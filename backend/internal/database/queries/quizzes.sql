-- name: GetQuiz :one
SELECT * FROM quizzes WHERE id = ?;

-- name: GetQuizzesForCourse :many
SELECT * FROM quizzes WHERE course_id = ? ORDER BY rowid;

-- name: AddQuiz :exec
INSERT INTO quizzes (id, course_id, lesson_id, title, description, value, hlc, origin_node)
VALUES (?, ?, ?, ?, ?, ?, ?, ?);

-- name: UpdateQuiz :exec
UPDATE quizzes SET title = ?, description = ?, value = ?, hlc = ?, origin_node = ? WHERE id = ?;

-- name: GetQuizQuestions :many
SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY ordinal;

-- name: AddQuizQuestion :exec
INSERT INTO quiz_questions (id, quiz_id, ordinal, text, options_json, correct_index, hlc, origin_node)
VALUES (?, ?, ?, ?, ?, ?, ?, ?);

-- name: DeleteQuizQuestions :exec
DELETE FROM quiz_questions WHERE quiz_id = ?;
