-- name: AddForumLink :exec
INSERT INTO forum_links (source_post_id, target_id, target_type) VALUES (?, ?, ?);

-- name: GetCourseForumLinkedLibraryItems :many
SELECT library_items.*, users.name AS uploaded_by_name
FROM library_items
LEFT JOIN users ON library_items.uploaded_by = users.id
WHERE library_items.id IN (
    SELECT forum_links.target_id
    FROM forum_links
    JOIN forum_posts ON forum_posts.id = forum_links.source_post_id
    WHERE forum_posts.course_id = ? AND forum_links.target_type = 'library_item'
)
ORDER BY library_items.rowid;

-- name: GetCourseForumLinkedLessons :many
SELECT lessons.id, lessons.course_id, lessons.title, courses.title AS course_title
FROM lessons
JOIN courses ON courses.id = lessons.course_id
WHERE lessons.id IN (
    SELECT forum_links.target_id
    FROM forum_links
    JOIN forum_posts ON forum_posts.id = forum_links.source_post_id
    WHERE forum_posts.course_id = ? AND forum_links.target_type = 'lesson'
)
ORDER BY lessons.rowid;

-- name: GetCourseForumLinkedQuizzes :many
SELECT quizzes.id, quizzes.course_id, quizzes.title, courses.title AS course_title
FROM quizzes
JOIN courses ON courses.id = quizzes.course_id
WHERE quizzes.id IN (
    SELECT forum_links.target_id
    FROM forum_links
    JOIN forum_posts ON forum_posts.id = forum_links.source_post_id
    WHERE forum_posts.course_id = ? AND forum_links.target_type = 'quiz'
)
ORDER BY quizzes.rowid;
