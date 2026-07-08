-- +goose Up
CREATE TABLE server_logs (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    level     TEXT NOT NULL,
    message   TEXT NOT NULL,
    fields    TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX idx_server_logs_timestamp ON server_logs(timestamp);
CREATE INDEX idx_server_logs_level ON server_logs(level);

-- FTS5 external-content index over message — kept in sync via triggers so
-- full-text search never needs a second write path from application code.
CREATE VIRTUAL TABLE server_logs_fts USING fts5(message, content='server_logs', content_rowid='id');

-- +goose StatementBegin
CREATE TRIGGER server_logs_ai AFTER INSERT ON server_logs BEGIN
    INSERT INTO server_logs_fts(rowid, message) VALUES (new.id, new.message);
END;
-- +goose StatementEnd

-- +goose StatementBegin
CREATE TRIGGER server_logs_ad AFTER DELETE ON server_logs BEGIN
    INSERT INTO server_logs_fts(server_logs_fts, rowid, message) VALUES('delete', old.id, old.message);
END;
-- +goose StatementEnd

-- +goose Down
DROP TRIGGER server_logs_ad;
DROP TRIGGER server_logs_ai;
DROP TABLE server_logs_fts;
DROP TABLE server_logs;
