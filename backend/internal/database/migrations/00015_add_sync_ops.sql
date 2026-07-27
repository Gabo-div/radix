-- +goose Up
-- The DTN queue becomes a real operation log.
--
-- sync_log held human-readable audit strings ("SUBMIT_QUIZ: q1 | Score: 80%")
-- and POST /monitor/sync just deleted them and reported success: nothing was
-- ever sent anywhere. An op here is instead replayable on another node — table,
-- primary key, operation, version and the full row — which is what lets two edge
-- servers exchange only what changed instead of a whole-database zip.
--
-- Deletes are ops too, which is why there's no separate tombstone table: the
-- delete op stays in the log, so an older upsert arriving afterwards can't
-- resurrect the row (see store.ApplyOps).
DROP TABLE sync_log;

CREATE TABLE sync_ops (
    -- Local total order over everything this node knows, its own writes and the
    -- ops it learned from peers alike. This is the domain a peer's cursor lives
    -- in, and reinserting a received op with a fresh seq is what makes ops
    -- forward on: A -> B -> C works without A and C ever meeting.
    seq         INTEGER PRIMARY KEY AUTOINCREMENT,
    -- Who first produced the op. Preserved when forwarding, never rewritten to
    -- the local node: (origin_node, table_name, pk_json, hlc) is the op's
    -- identity, and that's what makes applying it twice a no-op.
    origin_node TEXT    NOT NULL,
    table_name  TEXT    NOT NULL,
    pk_json     TEXT    NOT NULL,
    op          TEXT    NOT NULL CHECK (op IN ('upsert', 'delete')),
    hlc         INTEGER NOT NULL,
    -- Whole row for an upsert (not a diff: idempotent and order-independent),
    -- empty for a delete.
    payload     TEXT    NOT NULL DEFAULT '{}',
    -- Human-readable summary, the one thing kept from sync_log — it's what the
    -- Monitor's queue lists.
    label       TEXT    NOT NULL DEFAULT '',
    created_at  TEXT    NOT NULL
);
CREATE UNIQUE INDEX idx_sync_ops_identity ON sync_ops(origin_node, table_name, pk_json, hlc);
-- Answers "is this row already deleted at a version at least this new?" without
-- scanning the log.
CREATE INDEX idx_sync_ops_row ON sync_ops(table_name, pk_json, hlc);

-- Peers this node pulls from, keyed by the configured URL: the cursor is a
-- position in that server's own seq sequence, so it belongs to the URL and not
-- to a node id we only learn after the first successful request.
CREATE TABLE sync_peers (
    peer         TEXT    PRIMARY KEY,
    node_id      TEXT    NOT NULL DEFAULT '',
    last_seq     INTEGER NOT NULL DEFAULT 0,
    last_sync_at TEXT    NOT NULL DEFAULT '',
    last_error   TEXT    NOT NULL DEFAULT ''
);

-- The other direction: nodes that pull FROM this one, and how far they've read.
-- A puller sends its own cursor in the request, so this costs nothing extra and
-- is what makes "pending" on the Monitor mean "not yet delivered anywhere"
-- instead of just "not yet deleted".
CREATE TABLE sync_readers (
    node_id   TEXT    PRIMARY KEY,
    acked_seq INTEGER NOT NULL DEFAULT 0,
    last_seen TEXT    NOT NULL DEFAULT ''
);

-- +goose Down
DROP TABLE sync_readers;
DROP TABLE sync_peers;
DROP TABLE sync_ops;

CREATE TABLE sync_log (
    id         INTEGER PRIMARY KEY,
    action     TEXT NOT NULL,
    created_at TEXT NOT NULL
);
