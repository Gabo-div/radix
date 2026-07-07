-- name: GetUser :one
SELECT * FROM users WHERE id = ?;

-- name: GetUserByRole :one
SELECT * FROM users WHERE role = ? LIMIT 1;

-- name: AddUser :exec
INSERT INTO users (id, name, role, points) VALUES (?, ?, ?, ?);

-- name: UpdateUser :exec
UPDATE users SET name = ?, role = ?, points = ? WHERE id = ?;

-- name: GetCompletedLessonIDs :many
SELECT lesson_id FROM user_completed_lessons WHERE user_id = ?;

-- name: DeleteCompletedLessons :exec
DELETE FROM user_completed_lessons WHERE user_id = ?;

-- name: AddCompletedLesson :exec
INSERT INTO user_completed_lessons (user_id, lesson_id) VALUES (?, ?);
