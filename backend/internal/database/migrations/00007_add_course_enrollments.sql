-- +goose Up
-- Students only get access to courses they're enrolled in — admin-managed,
-- no self-enroll. Junction table, same shape as user_completed_lessons.
CREATE TABLE course_enrollments (
    user_id   TEXT NOT NULL REFERENCES users(id),
    course_id TEXT NOT NULL REFERENCES courses(id),
    PRIMARY KEY (user_id, course_id)
);
CREATE INDEX idx_course_enrollments_course ON course_enrollments(course_id);

-- +goose Down
DROP TABLE course_enrollments;
