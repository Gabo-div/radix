-- +goose Up
ALTER TABLE users ADD COLUMN email TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN password_hash TEXT NOT NULL DEFAULT '';
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- +goose Down
DROP INDEX idx_users_email;
ALTER TABLE users DROP COLUMN password_hash;
ALTER TABLE users DROP COLUMN email;
