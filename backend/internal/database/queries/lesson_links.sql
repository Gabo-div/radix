-- name: DeleteLessonLinks :exec
DELETE FROM lesson_links WHERE source_lesson_id = ?;

-- name: AddLessonLink :exec
INSERT INTO lesson_links (source_lesson_id, target_id, target_type) VALUES (?, ?, ?);

-- name: GetLinkedLibraryItems :many
SELECT library_items.*, users.name AS uploaded_by_name
FROM lesson_links
JOIN library_items ON library_items.id = lesson_links.target_id
LEFT JOIN users ON library_items.uploaded_by = users.id
WHERE lesson_links.source_lesson_id = ? AND lesson_links.target_type = 'library_item'
ORDER BY library_items.rowid;

-- name: GetLinkedLessons :many
SELECT lessons.id, lessons.course_id, lessons.title, courses.title AS course_title
FROM lesson_links
JOIN lessons ON lessons.id = lesson_links.target_id
JOIN courses ON courses.id = lessons.course_id
WHERE lesson_links.source_lesson_id = ? AND lesson_links.target_type = 'lesson'
ORDER BY lessons.rowid;

-- name: GetLessonsLinkingToTarget :many
SELECT lessons.id, lessons.course_id, lessons.title, courses.title AS course_title
FROM lesson_links
JOIN lessons ON lessons.id = lesson_links.source_lesson_id
JOIN courses ON courses.id = lessons.course_id
WHERE lesson_links.target_id = ?
ORDER BY lessons.rowid;
