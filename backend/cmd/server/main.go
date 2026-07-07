package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"

	"github.com/labstack/echo/v5"
	echomw "github.com/labstack/echo/v5/middleware"
	"go.uber.org/fx"

	"radix-backend/internal/auth"
	"radix-backend/internal/config"
	"radix-backend/internal/database"
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

func newLogBuffer(cfg *config.Config) *middleware.LogBuffer {
	return middleware.NewLogBuffer(cfg.LogBufferSize)
}

// newEcho wires routes/middleware and serves them via a plain *http.Server —
// echo/v5's own Echo.Start() has no graceful Shutdown in its public API, so
// the http.Server (Echo implements http.Handler) is what fx's lifecycle manages.
func newEcho(lc fx.Lifecycle, cfg *config.Config, a *auth.Auth, h *handlers.Handler, logBuf *middleware.LogBuffer) *echo.Echo {
	e := echo.New()

	e.Use(echomw.CORSWithConfig(echomw.CORSConfig{
		AllowOrigins: cfg.CORSOrigins,
		AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders: []string{"Content-Type", "Authorization"},
	}))
	e.Use(a.Middleware())
	e.Use(middleware.GoServerLogger(logBuf))

	h.RegisterRoutes(e.Group("/api/v1"), a)

	srv := &http.Server{Addr: ":" + cfg.Port, Handler: e}
	lc.Append(fx.Hook{
		OnStart: func(context.Context) error {
			go func() {
				if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
					log.Printf("http server error: %v", err)
				}
			}()
			log.Printf("RADIX Backend (%s) iniciado en :%s", cfg.Environment, cfg.Port)
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
			newDatabase,
			newSQLDB,
			fx.Annotate(store.New, fx.As(new(auth.Store)), fx.As(new(handlers.Store)), fx.As(fx.Self())),
			newLogBuffer,
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
