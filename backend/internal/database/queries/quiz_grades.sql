-- name: UpsertQuizGrade :exec
INSERT INTO quiz_grades (user_id, quiz_id, grade, graded_at)
VALUES (?, ?, ?, ?)
ON CONFLICT (user_id, quiz_id) DO UPDATE SET grade = excluded.grade, graded_at = excluded.graded_at;

-- name: GetUserCoursePoints :one
SELECT COALESCE(SUM(quiz_grades.grade), 0)
FROM quiz_grades
JOIN quizzes ON quizzes.id = quiz_grades.quiz_id
WHERE quiz_grades.user_id = ? AND quizzes.course_id = ?;
