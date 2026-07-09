-- +goose Up
-- Mirrors lesson_links/quiz_links: a forum post's body can [[id]]-link
-- library items, lessons, AND quizzes (the first source type that can link
-- to a quiz) — materialized here at post-creation time (posts are never
-- edited, so no re-sync path is needed).
CREATE TABLE forum_links (
    source_post_id TEXT NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    target_id      TEXT NOT NULL,
    target_type    TEXT NOT NULL CHECK (target_type IN ('library_item', 'lesson', 'quiz')),
    PRIMARY KEY (source_post_id, target_id)
);
CREATE INDEX idx_forum_links_target ON forum_links(target_id);

-- +goose Down
DROP TABLE forum_links;
