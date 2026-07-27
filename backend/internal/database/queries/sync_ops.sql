-- name: AddSyncOp :exec
-- OR IGNORE is the idempotency: an op already known by identity
-- (origin_node, table_name, pk_json, hlc) is a no-op, which is what stops an op
-- from being applied twice or bouncing between two nodes forever.
INSERT OR IGNORE INTO sync_ops (origin_node, table_name, pk_json, op, hlc, payload, label, created_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?);

-- name: HasSyncOp :one
SELECT COUNT(*) FROM sync_ops
WHERE origin_node = ? AND table_name = ? AND pk_json = ? AND hlc = ?;

-- name: OpsSince :many
SELECT * FROM sync_ops WHERE seq > ? ORDER BY seq LIMIT ?;

-- name: MaxOpSeq :one
SELECT COALESCE(MAX(seq), 0) FROM sync_ops;

-- name: CountDeletesNotOlderThan :one
-- The log doubles as the tombstone table: an upsert arriving after a delete of
-- the same row at an equal or newer version must not resurrect it.
SELECT COUNT(*) FROM sync_ops
WHERE table_name = ? AND pk_json = ? AND op = 'delete' AND hlc >= ?;

-- name: CountUnackedOps :one
-- Ops no peer has confirmed reading yet. With no known reader that's every op,
-- which is the honest answer: nothing has been delivered anywhere.
SELECT COUNT(*) FROM sync_ops
WHERE seq > (SELECT COALESCE(MIN(acked_seq), 0) FROM sync_readers);

-- name: UnackedOpLabels :many
SELECT label FROM sync_ops
WHERE seq > (SELECT COALESCE(MIN(acked_seq), 0) FROM sync_readers)
ORDER BY seq DESC LIMIT ?;

-- name: GetSyncPeer :one
SELECT * FROM sync_peers WHERE peer = ?;

-- name: ListSyncPeers :many
SELECT * FROM sync_peers ORDER BY peer;

-- name: RecordSyncPeer :exec
INSERT INTO sync_peers (peer, node_id, last_seq, last_sync_at, last_error)
VALUES (?, ?, ?, ?, ?)
ON CONFLICT (peer) DO UPDATE SET
    node_id = excluded.node_id,
    last_seq = excluded.last_seq,
    last_sync_at = excluded.last_sync_at,
    last_error = excluded.last_error;

-- name: RecordSyncReader :exec
INSERT INTO sync_readers (node_id, acked_seq, last_seen)
VALUES (?, ?, ?)
ON CONFLICT (node_id) DO UPDATE SET
    -- A cursor only ever moves forward: a peer that restarts from an old
    -- position must not make this node think its ops are undelivered again.
    acked_seq = MAX(sync_readers.acked_seq, excluded.acked_seq),
    last_seen = excluded.last_seen;
