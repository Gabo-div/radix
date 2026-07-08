-- +goose Up
-- Materializes [[id]] wiki-links found in lessons.content_text so lookups
-- (forward: what does this lesson link to; reverse: what links to this item)
-- are indexed table reads instead of a LIKE scan over every lesson body.
-- Recomputed from content_text on every lesson create/update — content_text
-- stays the source of truth, this is just a cache of it.
CREATE TABLE lesson_links (
    source_lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    target_id        TEXT NOT NULL,
    target_type      TEXT NOT NULL CHECK (target_type IN ('library_item', 'lesson')),
    PRIMARY KEY (source_lesson_id, target_id)
);
CREATE INDEX idx_lesson_links_target ON lesson_links(target_id);

-- +goose Down
DROP TABLE lesson_links;
