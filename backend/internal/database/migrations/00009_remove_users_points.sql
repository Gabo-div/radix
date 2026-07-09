-- +goose Up
-- Points are now course-scoped (sum of quiz_grades for that course's quizzes,
-- computed live — see GetEnrolledStudents/GetUserCoursePoints), so a single
-- global users.points column no longer means anything.
ALTER TABLE users DROP COLUMN points;

-- +goose Down
ALTER TABLE users ADD COLUMN points INTEGER NOT NULL DEFAULT 0;
