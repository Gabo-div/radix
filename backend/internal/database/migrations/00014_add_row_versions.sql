-- +goose Up
-- Row versions, so two edge servers that both edited the same row can agree on
-- which edit wins when their data meets.
--
-- Until now importing a backup was INSERT OR IGNORE: a row already present here
-- was skipped and the local copy always won, which silently discarded every
-- edit made anywhere else. A lesson corrected on the central server never
-- reached the node that imported it. With these two columns the merge becomes
-- last-writer-wins: the incoming row replaces the local one when its (hlc,
-- origin_node) pair is greater. See store.insertRows.
--
--   hlc         logical clock value of the write, milliseconds-since-epoch when
--               the writing node's clock is healthy, but monotonic regardless
--               (internal/clock) — an edge server has no RTC and no NTP.
--   origin_node the NODE_ID that produced the write. Only used to break exact
--               hlc ties, so the outcome is the same on every node instead of
--               depending on which one merged first.
--
-- Only tables with mutable rows get them. The junction tables
-- (course_enrollments, user_completed_lessons, forum_likes, *_links) are pure
-- set membership: there is no field to overwrite, so their conflict is
-- insert-vs-delete, which needs the operation log rather than a version column.
ALTER TABLE users ADD COLUMN hlc INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN origin_node TEXT NOT NULL DEFAULT '';

ALTER TABLE courses ADD COLUMN hlc INTEGER NOT NULL DEFAULT 0;
ALTER TABLE courses ADD COLUMN origin_node TEXT NOT NULL DEFAULT '';

ALTER TABLE library_items ADD COLUMN hlc INTEGER NOT NULL DEFAULT 0;
ALTER TABLE library_items ADD COLUMN origin_node TEXT NOT NULL DEFAULT '';

ALTER TABLE lessons ADD COLUMN hlc INTEGER NOT NULL DEFAULT 0;
ALTER TABLE lessons ADD COLUMN origin_node TEXT NOT NULL DEFAULT '';

ALTER TABLE quizzes ADD COLUMN hlc INTEGER NOT NULL DEFAULT 0;
ALTER TABLE quizzes ADD COLUMN origin_node TEXT NOT NULL DEFAULT '';

ALTER TABLE quiz_questions ADD COLUMN hlc INTEGER NOT NULL DEFAULT 0;
ALTER TABLE quiz_questions ADD COLUMN origin_node TEXT NOT NULL DEFAULT '';

ALTER TABLE quiz_grades ADD COLUMN hlc INTEGER NOT NULL DEFAULT 0;
ALTER TABLE quiz_grades ADD COLUMN origin_node TEXT NOT NULL DEFAULT '';

ALTER TABLE forum_posts ADD COLUMN hlc INTEGER NOT NULL DEFAULT 0;
ALTER TABLE forum_posts ADD COLUMN origin_node TEXT NOT NULL DEFAULT '';

-- Backfill: rows that existed before this migration get the migration's own
-- timestamp as their baseline version, not 0 — otherwise any row arriving from
-- a peer would outrank every row this node already had. origin_node stays empty
-- for them: nobody can say now which node first wrote data from before there
-- were node ids.
UPDATE users          SET hlc = strftime('%s', 'now') * 1000;
UPDATE courses        SET hlc = strftime('%s', 'now') * 1000;
UPDATE library_items  SET hlc = strftime('%s', 'now') * 1000;
UPDATE lessons        SET hlc = strftime('%s', 'now') * 1000;
UPDATE quizzes        SET hlc = strftime('%s', 'now') * 1000;
UPDATE quiz_questions SET hlc = strftime('%s', 'now') * 1000;
UPDATE quiz_grades    SET hlc = strftime('%s', 'now') * 1000;
UPDATE forum_posts    SET hlc = strftime('%s', 'now') * 1000;

-- +goose Down
ALTER TABLE users DROP COLUMN hlc;
ALTER TABLE users DROP COLUMN origin_node;
ALTER TABLE courses DROP COLUMN hlc;
ALTER TABLE courses DROP COLUMN origin_node;
ALTER TABLE library_items DROP COLUMN hlc;
ALTER TABLE library_items DROP COLUMN origin_node;
ALTER TABLE lessons DROP COLUMN hlc;
ALTER TABLE lessons DROP COLUMN origin_node;
ALTER TABLE quizzes DROP COLUMN hlc;
ALTER TABLE quizzes DROP COLUMN origin_node;
ALTER TABLE quiz_questions DROP COLUMN hlc;
ALTER TABLE quiz_questions DROP COLUMN origin_node;
ALTER TABLE quiz_grades DROP COLUMN hlc;
ALTER TABLE quiz_grades DROP COLUMN origin_node;
ALTER TABLE forum_posts DROP COLUMN hlc;
ALTER TABLE forum_posts DROP COLUMN origin_node;
