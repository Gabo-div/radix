-- Snapshot schema used only by sqlc for code generation.
-- Kept in sync by hand with internal/database/migrations/00001_init.sql
-- (sqlc must not read goose migration files directly: a "-- +goose Down"
-- block is real SQL and sqlc would execute the DROP TABLEs too).

CREATE TABLE users (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL,
    points        INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX idx_users_email ON users(email);

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
    id           TEXT PRIMARY KEY,
    course_id    TEXT NOT NULL REFERENCES courses(id),
    title        TEXT NOT NULL,
    content_text TEXT NOT NULL
);

CREATE TABLE quizzes (
    id          TEXT PRIMARY KEY,
    course_id   TEXT NOT NULL REFERENCES courses(id),
    lesson_id   TEXT REFERENCES lessons(id),
    title       TEXT NOT NULL DEFAULT 'Cuestionario',
    description TEXT NOT NULL DEFAULT ''
);
CREATE INDEX idx_quizzes_course ON quizzes(course_id);
CREATE UNIQUE INDEX idx_quizzes_lesson_unique ON quizzes(lesson_id) WHERE lesson_id IS NOT NULL;

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

CREATE TABLE server_logs (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    level     TEXT NOT NULL,
    message   TEXT NOT NULL,
    fields    TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX idx_server_logs_timestamp ON server_logs(timestamp);
CREATE INDEX idx_server_logs_level ON server_logs(level);

CREATE VIRTUAL TABLE server_logs_fts USING fts5(message, content='server_logs', content_rowid='id');

CREATE TABLE lesson_links (
    source_lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    target_id        TEXT NOT NULL,
    target_type      TEXT NOT NULL CHECK (target_type IN ('library_item', 'lesson')),
    PRIMARY KEY (source_lesson_id, target_id)
);
CREATE INDEX idx_lesson_links_target ON lesson_links(target_id);

CREATE TABLE quiz_links (
    source_quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    target_id      TEXT NOT NULL,
    target_type    TEXT NOT NULL CHECK (target_type IN ('library_item', 'lesson')),
    PRIMARY KEY (source_quiz_id, target_id)
);
CREATE INDEX idx_quiz_links_target ON quiz_links(target_id);
