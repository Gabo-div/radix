package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"path/filepath"
	"time"

	"github.com/labstack/echo/v5"
	echomw "github.com/labstack/echo/v5/middleware"
	"go.uber.org/fx"
	"go.uber.org/zap"

	"radix-backend/internal/auth"
	"radix-backend/internal/backupzip"
	"radix-backend/internal/config"
	"radix-backend/internal/database"
	"radix-backend/internal/dtn"
	"radix-backend/internal/handlers"
	"radix-backend/internal/middleware"
	"radix-backend/internal/store"
)

func newDatabase(cfg *config.Config, lc fx.Lifecycle) (*database.DB, error) {
	ctx := context.Background()
	db, err := database.Open(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}
	if err := database.Migrate(ctx, db.DB); err != nil {
		return nil, fmt.Errorf("run migrations: %w", err)
	}
	lc.Append(fx.Hook{
		OnStop: func(context.Context) error {
			return db.Close()
		},
	})
	return db, nil
}

func newSQLDB(db *database.DB) *sql.DB {
	return db.DB
}

// newStore loads persisted sessions on start and saves them on stop, so a
// dev hot-reload (air) or a redeploy doesn't silently log everyone out —
// see store.SaveSessions/LoadSessions. It also seeds the logical clock from
// what's already stored, which has to happen before the first write: an edge
// server rebooting with a rewound clock would otherwise stamp new rows with
// versions that lose to its own older ones (store.SeedClock).
func newStore(sqlDB *sql.DB, cfg *config.Config, logger *zap.Logger, lc fx.Lifecycle) *store.Store {
	s := store.New(sqlDB, cfg.NodeID)
	if err := s.SeedClock(context.Background()); err != nil {
		logger.Error("failed to seed the logical clock", zap.Error(err))
	}
	sessionsPath := filepath.Join(filepath.Dir(cfg.DBPath), "sessions.json")
	if err := s.LoadSessions(sessionsPath); err != nil {
		logger.Error("failed to load sessions", zap.Error(err))
	}
	lc.Append(fx.Hook{
		OnStop: func(context.Context) error {
			return s.SaveSessions(sessionsPath)
		},
	})
	return s
}

func newLogBuffer(cfg *config.Config) *middleware.LogBuffer {
	return middleware.NewLogBuffer(cfg.LogBufferSize)
}

// newLogPersister flushes batched request logs to the durable server_logs
// table and prunes rows older than cfg.LogRetentionDays — see
// middleware.LogPersister for why this is async instead of a write per request.
func newLogPersister(s *store.Store, cfg *config.Config, logger *zap.Logger, lc fx.Lifecycle) *middleware.LogPersister {
	p := middleware.NewLogPersister(s, logger)
	lc.Append(fx.Hook{
		OnStart: func(context.Context) error {
			go p.Run(3*time.Second, 50, cfg.LogRetentionDays, 24*time.Hour)
			return nil
		},
		OnStop: func(context.Context) error {
			p.Stop()
			return nil
		},
	})
	return p
}

// newSyncer starts the peer-synchronisation loop. A node with no SYNC_PEERS
// still builds one (POST /monitor/sync reports there's nothing to pull, and the
// handlers hold the same interface either way) — it just never runs a round.
func newSyncer(s *store.Store, cfg *config.Config, logger *zap.Logger, lc fx.Lifecycle) *dtn.Syncer {
	syncer := dtn.New(s, logger, cfg.SyncPeers, cfg.SyncToken, backupzip.UploadsDir, 30*time.Second)

	var cancel context.CancelFunc
	lc.Append(fx.Hook{
		OnStart: func(context.Context) error {
			if !syncer.Enabled() {
				logger.Info("Sincronización entre nodos desactivada (SYNC_PEERS vacío)")
				return nil
			}
			if cfg.SyncToken == "" {
				logger.Warn("SYNC_PEERS configurado sin SYNC_TOKEN: los nodos pares rechazarán las peticiones")
			}
			logger.Info("Sincronización entre nodos activa",
				zap.Strings("peers", cfg.SyncPeers),
				zap.Duration("interval", cfg.SyncInterval))

			// Own context, not the start hook's: that one is cancelled as soon
			// as startup finishes, which would kill the loop immediately.
			var ctx context.Context
			ctx, cancel = context.WithCancel(context.Background())
			go syncer.Run(ctx, cfg.SyncInterval)
			return nil
		},
		OnStop: func(context.Context) error {
			if cancel != nil {
				cancel()
			}
			return nil
		},
	})
	return syncer
}

// newEcho wires routes/middleware and serves them via a plain *http.Server —
// echo/v5's own Echo.Start() has no graceful Shutdown in its public API, so
// the http.Server (Echo implements http.Handler) is what fx's lifecycle manages.
func newEcho(lc fx.Lifecycle, cfg *config.Config, a *auth.Auth, h *handlers.Handler, baseLogger *zap.Logger, logBuf *middleware.LogBuffer, persister *middleware.LogPersister) *echo.Echo {
	e := echo.New()
	logger := middleware.NewLogger(baseLogger, logBuf, persister)

	e.Use(middleware.DetachContext)
	e.Use(echomw.CORSWithConfig(echomw.CORSConfig{
		AllowOrigins: cfg.CORSOrigins,
		AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Content-Type", "Authorization"},
	}))
	e.Use(a.Middleware())
	e.Use(middleware.GoServerLogger(logger))

	h.RegisterRoutes(e.Group("/api/v1"), a)

	srv := &http.Server{Addr: ":" + cfg.Port, Handler: e}
	lc.Append(fx.Hook{
		OnStart: func(context.Context) error {
			go func() {
				if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
					logger.Error("http server error", zap.Error(err))
				}
			}()
			logger.Info("RADIX Backend iniciado", zap.String("environment", cfg.Environment), zap.String("port", cfg.Port))
			return nil
		},
		OnStop: func(ctx context.Context) error {
			return srv.Shutdown(ctx)
		},
	})

	return e
}

func main() {
	app := fx.New(
		fx.Provide(
			config.Load,
			middleware.NewBaseLogger,
			newDatabase,
			newSQLDB,
			fx.Annotate(newStore, fx.As(new(auth.Store)), fx.As(new(handlers.Store)), fx.As(fx.Self())),
			newLogBuffer,
			newLogPersister,
			fx.Annotate(newSyncer, fx.As(new(handlers.Syncer)), fx.As(fx.Self())),
			auth.New,
			handlers.New,
			newEcho,
		),
		fx.Invoke(
			func(*echo.Echo) {}, // force construction: nothing else depends on it
		),
	)
	if err := app.Err(); err != nil {
		log.Fatal(err)
	}
	app.Run()
}
