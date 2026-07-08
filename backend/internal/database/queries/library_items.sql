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
    uploaded_at, modified_at, duration, resolution, file_path, uploaded_by
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);

-- name: UpdateLibraryItem :exec
UPDATE library_items SET
    title = ?, category = ?, size_kb = ?, mime_type = ?, original_filename = ?,
    duration = ?, resolution = ?, file_path = ?
WHERE id = ?;

-- name: TotalDiskKB :one
SELECT COALESCE(SUM(size_kb), 0) FROM library_items;
