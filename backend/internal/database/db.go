package database

import (
	"context"
	"database/sql"
	"embed"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"

	"github.com/pressly/goose/v3"
	libsqlclient "github.com/tursodatabase/libsql-client-go/libsql"
	_ "turso.tech/database/tursogo" // registers the "turso" driver for local-only mode

	"radix-backend/internal/config"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

// DB wraps *sql.DB. In remote mode there's nothing else to wrap: every query
// goes straight over HTTP to sqld (see below), so there's no local replica
// file and no separate flush/Sync step needed on shutdown.
type DB struct {
	*sql.DB
}

// Two drivers are in play on purpose: tursogo (pure Go, no CGO) for
// local-only mode, and libsql-client-go's plain HTTP driver for remote mode.
// tursogo's own sync engine only talks to Turso Cloud's CDC protocol — it
// 404s against a self-hosted sqld/libsql-server.
//
// This used to be go-libsql's embedded-replica connector (CGO, keeps a local
// SQLite replica file synced from the remote via a native replication
// engine). That combination reliably corrupted the local replica file
// ("database disk image is malformed") under realistic concurrent write load
// against this project's sqld version — reproduced in isolation with
// concurrent BeginTx/COMMIT bursts even with MaxOpenConns(1) — and the
// libsql-server image is explicitly labeled BETA. libsql-client-go's HTTP
// driver (marked deprecated upstream in favor of embedded-replica, but still
// maintained and what Turso's serverless/edge SDKs use in production) has no
// local file to corrupt: every statement is a stateless HTTP round-trip to
// sqld, which owns all concurrency control itself.
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

	var opts []libsqlclient.Option
	if cfg.TursoAuthToken != "" {
		opts = append(opts, libsqlclient.WithAuthToken(cfg.TursoAuthToken))
	}
	connector, err := libsqlclient.NewConnector(cfg.TursoURL, opts...)
	if err != nil {
		return nil, fmt.Errorf("create libsql connector: %w", err)
	}
	sqlDB := sql.OpenDB(connector)
	return &DB{DB: sqlDB}, nil
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
