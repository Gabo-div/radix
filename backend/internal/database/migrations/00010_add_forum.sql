-- +goose Up
-- Per-course discussion forum: posts form a tree via parent_id (top-level
-- posts have parent_id NULL, replies point at the post they answer, replies
-- to replies point at THAT reply, unbounded depth — the tree is built
-- client-side from a flat per-course list, not recursive SQL). Deleting a
-- post cascades to its whole reply subtree, and to its likes.
CREATE TABLE forum_posts (
    id         TEXT PRIMARY KEY,
    course_id  TEXT NOT NULL REFERENCES courses(id),
    parent_id  TEXT REFERENCES forum_posts(id) ON DELETE CASCADE,
    user_id    TEXT NOT NULL REFERENCES users(id),
    body       TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE INDEX idx_forum_posts_course ON forum_posts(course_id);
CREATE INDEX idx_forum_posts_parent ON forum_posts(parent_id);

CREATE TABLE forum_likes (
    post_id TEXT NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    PRIMARY KEY (post_id, user_id)
);

-- +goose Down
DROP TABLE forum_likes;
DROP TABLE forum_posts;
