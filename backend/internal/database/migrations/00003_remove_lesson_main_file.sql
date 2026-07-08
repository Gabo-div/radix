-- +goose Up
ALTER TABLE lessons DROP COLUMN library_item_id;

-- +goose Down
ALTER TABLE lessons ADD COLUMN library_item_id TEXT REFERENCES library_items(id);
