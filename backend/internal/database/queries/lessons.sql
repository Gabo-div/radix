-- name: GetLessonsForCourse :many
SELECT lessons.*, quizzes.id AS quiz_id
FROM lessons
LEFT JOIN quizzes ON quizzes.lesson_id = lessons.id
WHERE lessons.course_id = ?
ORDER BY lessons.rowid;

-- name: GetLesson :one
SELECT lessons.*, quizzes.id AS quiz_id
FROM lessons
LEFT JOIN quizzes ON quizzes.lesson_id = lessons.id
WHERE lessons.id = ?;

-- name: AddLesson :exec
INSERT INTO lessons (id, course_id, title, content_text) VALUES (?, ?, ?, ?);

-- name: UpdateLesson :exec
UPDATE lessons SET title = ?, content_text = ? WHERE id = ?;

-- name: GetLessonsReferencingLibraryItem :many
SELECT lessons.id, lessons.course_id, lessons.title, courses.title AS course_title
FROM lessons
JOIN courses ON courses.id = lessons.course_id
WHERE lessons.content_text LIKE ?
ORDER BY lessons.rowid;
