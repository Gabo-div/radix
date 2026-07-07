package database

import (
	"context"
	"database/sql"
	"embed"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"time"

	"github.com/pressly/goose/v3"
	libsql "github.com/tursodatabase/go-libsql"
	_ "turso.tech/database/tursogo" // registers the "turso" driver for local-only mode

	"radix-backend/internal/config"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

// DB wraps *sql.DB and, in remote mode, the go-libsql connector so pending
// local writes can be flushed to the remote before shutdown.
//
// Two drivers are in play on purpose: tursogo (pure Go, no CGO) for local-only
// mode, and go-libsql (CGO) for remote mode. tursogo's own sync engine only
// talks to Turso Cloud's CDC protocol — it 404s against a self-hosted
// sqld/libsql-server. go-libsql's embedded-replica connector is the one from
// the original libSQL lineage that sqld actually implements.
type DB struct {
	*sql.DB
	connector *libsql.Connector
}

func Open(ctx context.Context, cfg *config.Config) (*DB, error) {
	if dir := filepath.Dir(cfg.DBPath); dir != "." {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return nil, err
		}
	}

	if cfg.TursoURL == "" {
		sqlDB, err := sql.Open("turso", cfg.DBPath)
		if err != nil {
			return nil, err
		}
		sqlDB.SetMaxOpenConns(1)
		return &DB{DB: sqlDB}, nil
	}

	opts := []libsql.Option{libsql.WithSyncInterval(5 * time.Second)}
	if cfg.TursoAuthToken != "" {
		opts = append(opts, libsql.WithAuthToken(cfg.TursoAuthToken))
	}
	// The embedded-replica engine needs a real file for its SQLite replication
	// hook — ":memory:" panics (Rust-side "replication hook was not called").
	// The remote (sqld) is still the source of truth; this is just its local cache.
	connector, err := libsql.NewEmbeddedReplicaConnector(cfg.DBPath, cfg.TursoURL, opts...)
	if err != nil {
		return nil, fmt.Errorf("create libsql connector: %w", err)
	}
	sqlDB := sql.OpenDB(connector)
	sqlDB.SetMaxOpenConns(1)
	return &DB{DB: sqlDB, connector: connector}, nil
}

// Close flushes any pending local writes to the remote (remote mode only)
// before closing the underlying *sql.DB and releasing connector resources.
func (d *DB) Close() error {
	if d.connector != nil {
		_, _ = d.connector.Sync() //nolint:staticcheck // deprecated but still the only flush primitive
	}
	err := d.DB.Close()
	if d.connector != nil {
		if cerr := d.connector.Close(); cerr != nil && err == nil {
			err = cerr
		}
	}
	return err
}

func Migrate(ctx context.Context, db *sql.DB) error {
	migrations, err := fs.Sub(migrationsFS, "migrations")
	if err != nil {
		return err
	}
	provider, err := goose.NewProvider(goose.DialectTurso, db, migrations)
	if err != nil {
		return err
	}
	_, err = provider.Up(ctx)
	return err
}
