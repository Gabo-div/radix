-- name: GetLibraryItems :many
SELECT library_items.*, users.name AS uploaded_by_name FROM library_items
LEFT JOIN users ON library_items.uploaded_by = users.id
ORDER BY library_items.rowid;

-- name: GetLibraryItem :one
SELECT library_items.*, users.name AS uploaded_by_name FROM library_items
LEFT JOIN users ON library_items.uploaded_by = users.id
WHERE library_items.id = ?;

-- name: AddLibraryItem :exec
INSERT INTO library_items (
    id, title, type, category, size_kb, mime_type, original_filename,
    uploaded_at, modified_at, duration, resolution, file_path, uploaded_by,
    hlc, origin_node
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);

-- name: UpdateLibraryItem :exec
UPDATE library_items SET
    title = ?, category = ?, size_kb = ?, mime_type = ?, original_filename = ?,
    duration = ?, resolution = ?, file_path = ?, hlc = ?, origin_node = ?
WHERE id = ?;

-- name: TotalDiskKB :one
SELECT COALESCE(SUM(size_kb), 0) FROM library_items;

-- name: GetCourseLibraryResources :many
SELECT library_items.*, users.name AS uploaded_by_name
FROM library_items
LEFT JOIN users ON library_items.uploaded_by = users.id
WHERE library_items.id IN (
    SELECT lesson_links.target_id
    FROM lesson_links
    JOIN lessons ON lessons.id = lesson_links.source_lesson_id
    WHERE lessons.course_id = ? AND lesson_links.target_type = 'library_item'
    UNION
    SELECT quiz_links.target_id
    FROM quiz_links
    JOIN quizzes ON quizzes.id = quiz_links.source_quiz_id
    WHERE quizzes.course_id = ? AND quiz_links.target_type = 'library_item'
)
ORDER BY library_items.rowid;

-- name: ListLibraryFiles :many
-- Inventory of the library's files, used by peer synchronisation to work out
-- which ones this node knows about but does not hold. Items with no file are
-- filtered in Go rather than in a WHERE here.
--
-- Keep this comment ASCII: a non-ASCII character in a query comment makes sqlc
-- truncate the generated SQL by the extra bytes (an em dash here produced
-- "SELECT id, file_path FROM library_ite").
SELECT id, file_path FROM library_items;
