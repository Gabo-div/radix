-- +goose NO TRANSACTION
-- Quizzes used to require a lesson (1:1, lesson_id NOT NULL) — decoupling them
-- so a quiz can stand on its own inside a course (shown in the course's
-- "Cuestionarios" tab) while still optionally attaching to a lesson (lessons
-- keep at most one quiz via the partial unique index below). SQLite can't
-- ALTER a column to drop NOT NULL, so the table is rebuilt — which requires
-- foreign_keys off for the duration since quiz_questions still references
-- quizzes(id) and PRAGMA foreign_keys is a no-op inside a transaction, hence
-- NO TRANSACTION for this whole migration.
-- +goose Up
PRAGMA foreign_keys = OFF;

-- +goose StatementBegin
CREATE TABLE quizzes_new (
    id          TEXT PRIMARY KEY,
    course_id   TEXT NOT NULL REFERENCES courses(id),
    lesson_id   TEXT REFERENCES lessons(id),
    title       TEXT NOT NULL DEFAULT 'Cuestionario',
    description TEXT NOT NULL DEFAULT ''
);
-- +goose StatementEnd

INSERT INTO quizzes_new (id, course_id, lesson_id, title)
SELECT quizzes.id, lessons.course_id, quizzes.lesson_id, 'Cuestionario'
FROM quizzes JOIN lessons ON lessons.id = quizzes.lesson_id;

DROP TABLE quizzes;
ALTER TABLE quizzes_new RENAME TO quizzes;

CREATE INDEX idx_quizzes_course ON quizzes(course_id);
CREATE UNIQUE INDEX idx_quizzes_lesson_unique ON quizzes(lesson_id) WHERE lesson_id IS NOT NULL;

-- Mirrors lesson_links: a quiz's description can [[id]]-link library items
-- and lessons, materialized here the same way (recomputed on quiz save).
CREATE TABLE quiz_links (
    source_quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    target_id      TEXT NOT NULL,
    target_type    TEXT NOT NULL CHECK (target_type IN ('library_item', 'lesson')),
    PRIMARY KEY (source_quiz_id, target_id)
);
CREATE INDEX idx_quiz_links_target ON quiz_links(target_id);

PRAGMA foreign_keys = ON;

-- +goose Down
PRAGMA foreign_keys = OFF;

DROP TABLE quiz_links;

-- +goose StatementBegin
CREATE TABLE quizzes_old (
    id        TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL REFERENCES lessons(id)
);
-- +goose StatementEnd
INSERT INTO quizzes_old (id, lesson_id) SELECT id, lesson_id FROM quizzes WHERE lesson_id IS NOT NULL;
DROP TABLE quizzes;
ALTER TABLE quizzes_old RENAME TO quizzes;

PRAGMA foreign_keys = ON;
