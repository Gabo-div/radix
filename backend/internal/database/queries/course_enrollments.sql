-- name: EnrollStudent :exec
INSERT OR IGNORE INTO course_enrollments (user_id, course_id) VALUES (?, ?);

-- name: UnenrollStudent :exec
DELETE FROM course_enrollments WHERE user_id = ? AND course_id = ?;

-- name: IsEnrolled :one
SELECT EXISTS(SELECT 1 FROM course_enrollments WHERE user_id = ? AND course_id = ?);

-- name: GetEnrolledCourseIDs :many
SELECT course_id FROM course_enrollments WHERE user_id = ?;

-- name: GetEnrolledStudents :many
SELECT users.id, users.name, users.email,
    COALESCE((
        SELECT SUM(quiz_grades.grade)
        FROM quiz_grades
        JOIN quizzes ON quizzes.id = quiz_grades.quiz_id
        WHERE quiz_grades.user_id = users.id AND quizzes.course_id = course_enrollments.course_id
    ), 0) AS points
FROM course_enrollments
JOIN users ON users.id = course_enrollments.user_id
WHERE course_enrollments.course_id = ?
ORDER BY users.name;

-- name: GetUnenrolledStudents :many
SELECT users.id, users.name, users.email
FROM users
WHERE users.role = 'student'
  AND users.id NOT IN (SELECT user_id FROM course_enrollments WHERE course_id = ?)
ORDER BY users.name;
