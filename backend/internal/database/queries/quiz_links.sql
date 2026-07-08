-- name: DeleteQuizLinks :exec
DELETE FROM quiz_links WHERE source_quiz_id = ?;

-- name: AddQuizLink :exec
INSERT INTO quiz_links (source_quiz_id, target_id, target_type) VALUES (?, ?, ?);

-- name: GetQuizLinkedLibraryItems :many
SELECT library_items.*, users.name AS uploaded_by_name
FROM quiz_links
JOIN library_items ON library_items.id = quiz_links.target_id
LEFT JOIN users ON library_items.uploaded_by = users.id
WHERE quiz_links.source_quiz_id = ? AND quiz_links.target_type = 'library_item'
ORDER BY library_items.rowid;

-- name: GetQuizLinkedLessons :many
SELECT lessons.id, lessons.course_id, lessons.title, courses.title AS course_title
FROM quiz_links
JOIN lessons ON lessons.id = quiz_links.target_id
JOIN courses ON courses.id = lessons.course_id
WHERE quiz_links.source_quiz_id = ? AND quiz_links.target_type = 'lesson'
ORDER BY lessons.rowid;
