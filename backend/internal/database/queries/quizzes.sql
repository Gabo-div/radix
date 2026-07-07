-- name: GetQuiz :one
SELECT * FROM quizzes WHERE id = ?;

-- name: AddQuiz :exec
INSERT INTO quizzes (id, lesson_id) VALUES (?, ?);

-- name: GetQuizQuestions :many
SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY ordinal;

-- name: AddQuizQuestion :exec
INSERT INTO quiz_questions (id, quiz_id, ordinal, text, options_json, correct_index)
VALUES (?, ?, ?, ?, ?, ?);
