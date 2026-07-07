-- Snapshot schema used only by sqlc for code generation.
-- Kept in sync by hand with internal/database/migrations/00001_init.sql
-- (sqlc must not read goose migration files directly: a "-- +goose Down"
-- block is real SQL and sqlc would execute the DROP TABLEs too).

CREATE TABLE users (
    id     TEXT PRIMARY KEY,
    name   TEXT NOT NULL,
    role   TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE courses (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT NOT NULL,
    category    TEXT NOT NULL
);

CREATE TABLE library_items (
    id                TEXT PRIMARY KEY,
    title             TEXT NOT NULL,
    type              TEXT NOT NULL,
    category          TEXT NOT NULL,
    size_kb           INTEGER NOT NULL,
    mime_type         TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    uploaded_at       TEXT NOT NULL,
    modified_at       TEXT NOT NULL,
    duration          TEXT,
    resolution        TEXT,
    file_path         TEXT NOT NULL,
    uploaded_by       TEXT REFERENCES users(id)
);

CREATE TABLE lessons (
    id              TEXT PRIMARY KEY,
    course_id       TEXT NOT NULL REFERENCES courses(id),
    title           TEXT NOT NULL,
    content_text    TEXT NOT NULL,
    library_item_id TEXT REFERENCES library_items(id)
);

CREATE TABLE quizzes (
    id        TEXT PRIMARY KEY,
    lesson_id TEXT NOT NULL REFERENCES lessons(id)
);

CREATE TABLE quiz_questions (
    id            TEXT PRIMARY KEY,
    quiz_id       TEXT NOT NULL REFERENCES quizzes(id),
    ordinal       INTEGER NOT NULL,
    text          TEXT NOT NULL,
    options_json  TEXT NOT NULL,
    correct_index INTEGER NOT NULL
);

CREATE TABLE user_completed_lessons (
    user_id   TEXT NOT NULL REFERENCES users(id),
    lesson_id TEXT NOT NULL REFERENCES lessons(id),
    PRIMARY KEY (user_id, lesson_id)
);

CREATE TABLE sync_log (
    id         INTEGER PRIMARY KEY,
    action     TEXT NOT NULL,
    created_at TEXT NOT NULL
);
