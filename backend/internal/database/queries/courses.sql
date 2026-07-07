-- name: GetCourses :many
SELECT * FROM courses ORDER BY rowid;

-- name: GetCourse :one
SELECT * FROM courses WHERE id = ?;

-- name: AddCourse :exec
INSERT INTO courses (id, title, description, category) VALUES (?, ?, ?, ?);
