-- name: AddForumPost :exec
INSERT INTO forum_posts (id, course_id, parent_id, user_id, title, body, created_at)
VALUES (?, ?, ?, ?, ?, ?, ?);

-- name: GetForumPost :one
SELECT * FROM forum_posts WHERE id = ?;

-- name: GetForumPostsForCourse :many
SELECT forum_posts.id, forum_posts.course_id, forum_posts.parent_id, forum_posts.user_id,
    forum_posts.title, forum_posts.body, forum_posts.created_at,
    users.name AS author_name, users.role AS author_role,
    (SELECT COUNT(*) FROM forum_likes WHERE forum_likes.post_id = forum_posts.id) AS like_count
FROM forum_posts
JOIN users ON users.id = forum_posts.user_id
WHERE forum_posts.course_id = ?
ORDER BY forum_posts.created_at;

-- name: LikePost :exec
INSERT OR IGNORE INTO forum_likes (post_id, user_id) VALUES (?, ?);

-- name: UnlikePost :exec
DELETE FROM forum_likes WHERE post_id = ? AND user_id = ?;

-- name: GetLikedPostIDsForCourse :many
SELECT forum_likes.post_id
FROM forum_likes
JOIN forum_posts ON forum_posts.id = forum_likes.post_id
WHERE forum_likes.user_id = ? AND forum_posts.course_id = ?;
