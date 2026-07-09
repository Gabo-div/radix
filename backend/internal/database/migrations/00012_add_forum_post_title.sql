-- +goose Up
-- Only a thread-starting post (parent_id IS NULL) has a title — replies
-- don't. Enforced in the handler, not a CHECK constraint (SQLite CHECK can't
-- easily express "NOT NULL depends on another column" cleanly here).
ALTER TABLE forum_posts ADD COLUMN title TEXT NOT NULL DEFAULT '';

-- +goose Down
ALTER TABLE forum_posts DROP COLUMN title;
