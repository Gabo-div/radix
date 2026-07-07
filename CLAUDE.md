# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

RADIX is an offline-first LMS simulating an edge server (Raspberry Pi) in the Amazon: Go REST backend + React SPA. Content is uploaded locally, students consume it offline earning XP, and a DTN (Delay-Tolerant Networking) sync queue records transactions for opportunistic sync with a central server. Three roles: `admin` (professor), `student`, `guest` — all gated via a Bearer-token session + RBAC middleware.

Monorepo layout: `backend/` (Go module `radix-backend`), `frontend/` (Vite/React SPA), `config/docker/` (local DB container).

## Commands

### Backend (run from `backend/`)
```bash
go run ./cmd/server        # start the API server (:1323 by default)
go run ./cmd/seed          # seed demo data — separate command, NOT run automatically on server boot
go build ./...             # compile check
go vet ./...               # static check
gofmt -l .                 # formatting check (no diff = clean)
```
No test suite exists yet. `CGO_ENABLED=1` is required to build (the `go-libsql` driver uses cgo) — this is the default on Linux/macOS with a C toolchain present.

Hot reload: `air` (`.air.toml` only watches `*.go` files — editing `.env` requires manually restarting the `air` process, it will not pick up new env vars on its own).

### Database (local dev)
```bash
cd config/docker && docker compose up -d     # starts a local sqld/libsql-server on :8080 (HTTP) / :5001 (gRPC)
```
The backend connects to this container by default (`TURSO_URL=http://localhost:8080` in `.env`). To reset local data: `docker compose down -v && docker compose up -d` (drops the container's volume) — also delete `backend/data/radix.db*` (the local embedded-replica cache file) so it re-bootstraps clean against the now-empty remote.

sqlc + goose:
```bash
sqlc generate                                        # regenerate internal/database/dbgen from queries/*.sql
goose -dir internal/database/migrations turso "$TURSO_URL" status   # or use GOOSE_* env vars from .env
```

### Frontend (run from `frontend/`)
```bash
bun install && bun run dev   # SPA on :5173, proxies /api to the backend port (VITE_API_PORT)
bun run build                # tsc + vite build
```

## Architecture

### Backend: dependency injection with uber/fx

`cmd/server/main.go` is the sole composition root — it's the only place that wires concrete types together. Everything else depends on interfaces or receives its dependencies as constructor params; nothing else imports `internal/store` directly.

- `internal/auth` and `internal/handlers` each define their **own** small `Store` interface listing only the methods they actually call (e.g. `auth.Store` has 5 methods, `handlers.Store` has ~19). `*store.Store` satisfies both by structural typing — it is never changed to accommodate this.
- In `main.go`, `store.New` is registered once via `fx.Annotate(store.New, fx.As(new(auth.Store)), fx.As(new(handlers.Store)), fx.As(fx.Self()))` so the same instance is exposed as both interfaces plus its concrete type.
- `auth.New(s Store) *Auth` and `handlers.New(s Store, logBuf *middleware.LogBuffer) *Handler` are the fx-callable constructors (no more `&auth.Auth{Store: s}` struct literals).
- `newDatabase`, `newSQLDB`, `newLogBuffer`, `newEcho` in `main.go` are small adapter constructors that exist purely to fit fx's DI graph (e.g. fx has no `context.Context` provider, so `newDatabase` fixes `context.Background()` internally rather than the public `database.Open`/`Migrate` signatures taking one from the container).
- `newEcho` wires an `*echo.Echo` but serves it through a plain `*http.Server{Handler: e}` — **echo/v5 has no `Shutdown()` in its public API** (only `Start(addr) error`), so graceful shutdown is implemented by wrapping Echo in a standard `http.Server` and managing `ListenAndServe`/`Shutdown` via `fx.Lifecycle` hooks. This also gives real graceful shutdown on SIGINT/SIGTERM (DB close + HTTP drain), which didn't exist before fx.
- Adding a new handler dependency on the store: add the method to the relevant package's `Store` interface, not to some shared interface — the split is intentional (auth's session/user-lookup surface vs. everything else).

### Backend: persistence (sqlc + goose + libSQL/Turso)

- `internal/store/store.go` is a thin adapter: it holds `*sql.DB` + generated `*dbgen.Queries`, and translates between `dbgen` row structs and `internal/models` structs (handlers/auth only ever see `internal/models` types, never `dbgen` types).
- **Sessions are the one thing NOT in the DB** — `Store` also holds an in-memory `map[string]models.Session` + mutex. Deliberate: avoids a DB round-trip on every authenticated request, sessions have no TTL/eviction logic so a SQL table would just accumulate rows forever.
- **`lessons.quiz_id` does not exist as a column.** `quizzes.lesson_id` is the single source of truth for that 1:1 relationship (avoids the two tables disagreeing on the FK). `models.Lesson.QuizID` is derived via `LEFT JOIN quizzes` in the `GetLesson`/`GetLessonsForCourse` queries — if you add a new lesson query, remember the join.
- All entity IDs are app-generated UUIDs (`uuid.NewString()`) inserted by the relevant `Add*` store method — **except `users.id`**, which the caller supplies (guest logins mint their own `g_<hex>` ID; seed data uses literal `"u1"`/`"u2"`/`"u3"`). Don't "fix" `AddUser` to auto-generate — that's intentional.
- Two DB drivers coexist in `internal/database/db.go`, and this is load-bearing, not accidental:
  - `turso.tech/database/tursogo` (pure Go, no cgo) — used only for **local-only** mode (`TURSO_URL` unset), via `sql.Open("turso", cfg.DBPath)`.
  - `github.com/tursodatabase/go-libsql` (cgo) — used for **remote** mode, via `NewEmbeddedReplicaConnector`. This is necessary because `tursogo`'s own sync engine only speaks Turso Cloud's CDC protocol and 404s against a self-hosted `sqld`/`libsql-server` (what `config/docker/docker-compose.yml` runs) — `go-libsql` is from the original libSQL lineage that `sqld` actually implements.
  - The embedded-replica connector **requires a real local file** even in remote mode (`cfg.DBPath`) — passing `:memory:` panics inside the Rust replication layer ("replication hook was not called"). The file is just a local cache; `sqld`'s volume is the actual source of truth. `DB.Close()` calls `connector.Sync()` to flush pending local writes before closing.
- `sqlc`'s schema source is `internal/database/schema.sql`, a **hand-maintained plain-SQL snapshot** — it does NOT point at `internal/database/migrations/` directly, because goose's `-- +goose Down` blocks are live SQL (`DROP TABLE ...`) that sqlc would also execute while parsing, silently emptying the schema it generates against. When you add a migration, update both files.
- `runSeed`/seeding is **not** part of server startup — `cmd/seed/main.go` is a separate command (`go run ./cmd/seed`), guarded by an empty-check (`GetCourses` count) so re-running it is a no-op once data exists. If a seed run fails partway, it can leave partial rows without tripping that guard (the guard only checks `courses`); a clean retry may need `docker compose down -v` first.
- Insert ordering in `seed.go` matters: rows must be created in FK-dependency order (e.g. a lesson must exist before a user's `CompletedLessons` can reference it via `user_completed_lessons` — real FK constraints are enforced by the remote DB even though a bare local SQLite connection might not enforce them by default).

### Backend: consistent HTTP responses

`internal/httpx` centralizes response shapes — `httpx.OK(c, status, data)` and `httpx.Fail/NotFound/BadRequest/InternalError/Forbidden/Unauthorized/NoContent(c, ...)`. This is **not** a new envelope: success responses are still the raw payload (array/object), errors are still `{"error": "..."}` — same shape the frontend's `lib/api.ts` already expects (`err.error` on non-2xx). Every handler should use these instead of hand-rolling `c.JSON(status, map[string]string{"error": ...})`.

### Frontend

`src/types/index.ts` mirrors the Go structs by hand — when a backend model or response shape changes, update this file too (no codegen link between them). `src/lib/api.ts` is the single fetch client: it injects the bearer token from `localStorage`, and throws on non-2xx using the `{error}` body. `src/lib/markdown.ts` + `codemirror-wiki.ts` implement the `[[id]]` wiki-link syntax used inside lesson content to embed library items — the editor (`MarkdownEditor.tsx`) highlights these and shows a hover preview; `InlineMedia.tsx` renders the embedded result by file type (video/audio/image/pdf/text/document).

## Environment variables (`backend/.env`)

| Variable | Purpose |
|---|---|
| `PORT`, `LOG_BUFFER_SIZE`, `CORS_ORIGINS`, `ENVIRONMENT` | server basics |
| `DB_PATH` | local file used as SQLite storage (local-only mode) or embedded-replica cache (remote mode) |
| `TURSO_URL`, `TURSO_AUTH_TOKEN` | if `TURSO_URL` is set, the backend connects in remote mode against that libSQL-compatible server (defaults to the local docker-compose container, no auth token needed there) |
| `GOOSE_DRIVER`, `GOOSE_DBSTRING`, `GOOSE_MIGRATION_DIR` | for the `goose` CLI only (manual migration authoring/status) — the app itself runs migrations programmatically from the embedded `migrations/` folder and doesn't read these |
