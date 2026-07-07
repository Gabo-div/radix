-- name: CountSyncLog :one
SELECT COUNT(*) FROM sync_log;

-- name: ListSyncLog :many
SELECT action FROM sync_log ORDER BY id;

-- name: AddSyncLog :exec
INSERT INTO sync_log (action, created_at) VALUES (?, ?);

-- name: ClearSyncLog :exec
DELETE FROM sync_log;
