-- name: GetQuiz :one
SELECT * FROM quizzes WHERE id = ?;

-- name: GetQuizzesForCourse :many
SELECT * FROM quizzes WHERE course_id = ? ORDER BY rowid;

-- name: AddQuiz :exec
INSERT INTO quizzes (id, course_id, lesson_id, title, description) VALUES (?, ?, ?, ?, ?);

-- name: UpdateQuiz :exec
UPDATE quizzes SET title = ?, description = ? WHERE id = ?;

-- name: GetQuizQuestions :many
SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY ordinal;

-- name: AddQuizQuestion :exec
INSERT INTO quiz_questions (id, quiz_id, ordinal, text, options_json, correct_index)
VALUES (?, ?, ?, ?, ?, ?);

-- name: DeleteQuizQuestions :exec
DELETE FROM quiz_questions WHERE quiz_id = ?;
