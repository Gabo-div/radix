-- +goose NO TRANSACTION
-- A lesson can now [[id]]-link a quiz, the same way it already links library
-- items and other lessons — the lesson view stopped rendering the quiz attached
-- via quizzes.lesson_id and shows only the ones the author linked explicitly.
-- SQLite can't ALTER a CHECK constraint, so the table is rebuilt; that needs
-- foreign_keys off for the duration and PRAGMA foreign_keys is a no-op inside a
-- transaction, hence NO TRANSACTION (same reason as 00006).
-- +goose Up
PRAGMA foreign_keys = OFF;

-- +goose StatementBegin
CREATE TABLE lesson_links_new (
    source_lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    target_id        TEXT NOT NULL,
    target_type      TEXT NOT NULL CHECK (target_type IN ('library_item', 'lesson', 'quiz')),
    PRIMARY KEY (source_lesson_id, target_id)
);
-- +goose StatementEnd

INSERT INTO lesson_links_new (source_lesson_id, target_id, target_type)
SELECT source_lesson_id, target_id, target_type FROM lesson_links;

DROP TABLE lesson_links;
ALTER TABLE lesson_links_new RENAME TO lesson_links;

CREATE INDEX idx_lesson_links_target ON lesson_links(target_id);

PRAGMA foreign_keys = ON;

-- +goose Down
PRAGMA foreign_keys = OFF;

-- +goose StatementBegin
CREATE TABLE lesson_links_old (
    source_lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    target_id        TEXT NOT NULL,
    target_type      TEXT NOT NULL CHECK (target_type IN ('library_item', 'lesson')),
    PRIMARY KEY (source_lesson_id, target_id)
);
-- +goose StatementEnd

INSERT INTO lesson_links_old (source_lesson_id, target_id, target_type)
SELECT source_lesson_id, target_id, target_type FROM lesson_links
WHERE target_type <> 'quiz';

DROP TABLE lesson_links;
ALTER TABLE lesson_links_old RENAME TO lesson_links;

CREATE INDEX idx_lesson_links_target ON lesson_links(target_id);

PRAGMA foreign_keys = ON;
