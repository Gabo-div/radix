-- +goose Up
-- Quiz value (max points) + per-student grade, so a student's total points
-- are derived from actual quiz results instead of an ever-incrementing XP
-- counter. Retaking a quiz overwrites that quiz's grade (latest attempt
-- counts), and users.points is recomputed (not incremented) from the sum of
-- quiz_grades every time a grade is recorded — see Store.RecordQuizGrade.
ALTER TABLE quizzes ADD COLUMN value INTEGER NOT NULL DEFAULT 100;

CREATE TABLE quiz_grades (
    user_id   TEXT NOT NULL REFERENCES users(id),
    quiz_id   TEXT NOT NULL REFERENCES quizzes(id),
    grade     INTEGER NOT NULL,
    graded_at TEXT NOT NULL,
    PRIMARY KEY (user_id, quiz_id)
);
CREATE INDEX idx_quiz_grades_user ON quiz_grades(user_id);

-- +goose Down
DROP TABLE quiz_grades;
ALTER TABLE quizzes DROP COLUMN value;
