-- name: AddServerLog :exec
INSERT INTO server_logs (timestamp, level, message, fields)
VALUES (?, ?, ?, ?);

-- name: ListServerLogs :many
SELECT * FROM server_logs
WHERE level = COALESCE(sqlc.narg('level'), level)
  AND timestamp >= COALESCE(sqlc.narg('from_ts'), timestamp)
  AND timestamp <= COALESCE(sqlc.narg('to_ts'), timestamp)
ORDER BY id DESC
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- name: SearchServerLogs :many
SELECT server_logs.* FROM server_logs
JOIN server_logs_fts ON server_logs_fts.rowid = server_logs.id
WHERE server_logs_fts.message MATCH sqlc.arg('query')
  AND level = COALESCE(sqlc.narg('level'), level)
  AND timestamp >= COALESCE(sqlc.narg('from_ts'), timestamp)
  AND timestamp <= COALESCE(sqlc.narg('to_ts'), timestamp)
ORDER BY server_logs.id DESC
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- name: DeleteOldServerLogs :execrows
DELETE FROM server_logs WHERE timestamp < ?;

-- name: CountServerLogsByLevel :many
SELECT level, COUNT(*) AS count FROM server_logs
WHERE timestamp >= ? AND timestamp <= ?
GROUP BY level
ORDER BY level;

-- name: CountServerLogsTotal :one
SELECT COUNT(*) FROM server_logs
WHERE timestamp >= ? AND timestamp <= ?;
