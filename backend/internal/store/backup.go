package store

import (
	"context"
	"database/sql"
	"fmt"
	"sort"
	"strings"

	"radix-backend/internal/models"
)

// This file is deliberately generic (reflection over sqlite_master + SELECT *)
// instead of one sqlc query per table: a full-database dump has to cover every
// table, and a hand-written pair of queries per table would silently miss any
// table added by a future migration.

// maxBindParams caps how many placeholders a single multi-row INSERT uses.
// SQLite's default SQLITE_MAX_VARIABLE_NUMBER is 999; staying well under it
// keeps the batching valid while still cutting the number of round-trips to
// sqld by ~2 orders of magnitude versus one INSERT per row.
const maxBindParams = 500

// skippedTable reports tables the backup must not touch:
//   - sqlite internals;
//   - goose's own bookkeeping (migrations are applied by the app on boot, never
//     restored from a dump — restoring them could downgrade the recorded version);
//   - the FTS5 shadow tables of server_logs_fts, an external-content index
//     rebuilt by the triggers on server_logs;
//   - sync_log and server_logs: both are per-node operational history (the DTN
//     queue of this edge server and its own log stream), not shared content, so
//     merging another node's rows into them would be meaningless noise.
func skippedTable(name string) bool {
	return strings.HasPrefix(name, "sqlite_") ||
		name == "goose_db_version" ||
		strings.HasPrefix(name, "server_logs") ||
		name == "sync_log"
}

// tableNames lists the backed-up tables in FK-dependency order: a parent
// always precedes the children that reference it, so inserting in this order
// never points at a row that isn't in yet.
//
// The order is computed from the actual foreign keys, NOT from creation order
// (sqlite_master.rowid). Creation order looks equivalent and isn't: a migration
// that rebuilds a table (the DROP + RENAME dance SQLite needs to alter a
// column, see 00006_decouple_quizzes) moves it to the END of sqlite_master, so
// `quizzes` ends up listed after `quiz_questions` even though it's the parent.
// Importing in that order fails with "FOREIGN KEY constraint failed".
func (s *Store) tableNames(ctx context.Context) ([]string, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY rowid`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var names []string
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		if !skippedTable(name) {
			names = append(names, name)
		}
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return s.sortByDependency(ctx, names)
}

// parentTables returns the tables that name's foreign keys point at.
// Self-references are dropped: they say nothing about table ordering (see
// insertRows for how rows inside such a table are ordered).
func (s *Store) parentTables(ctx context.Context, name string) ([]string, error) {
	rows, err := s.db.QueryContext(ctx, "SELECT \"table\" FROM pragma_foreign_key_list("+quoteLiteral(name)+")")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var parents []string
	for rows.Next() {
		var parent string
		if err := rows.Scan(&parent); err != nil {
			return nil, err
		}
		if parent != name {
			parents = append(parents, parent)
		}
	}
	return parents, rows.Err()
}

// sortByDependency topologically sorts names so every parent precedes its
// children. Ties keep the incoming (creation) order, so the result is stable.
// A dependency cycle can't be satisfied by any order — those tables are
// appended as they came and left to the deferred FK check in ImportTables.
func (s *Store) sortByDependency(ctx context.Context, names []string) ([]string, error) {
	backedUp := make(map[string]bool, len(names))
	for _, name := range names {
		backedUp[name] = true
	}

	pending := make(map[string][]string, len(names))
	for _, name := range names {
		parents, err := s.parentTables(ctx, name)
		if err != nil {
			return nil, fmt.Errorf("foreign keys of %s: %w", name, err)
		}
		for _, parent := range parents {
			if backedUp[parent] {
				pending[name] = append(pending[name], parent)
			}
		}
	}

	done := make(map[string]bool, len(names))
	sorted := make([]string, 0, len(names))
	for len(sorted) < len(names) {
		progressed := false
		for _, name := range names {
			if done[name] {
				continue
			}
			ready := true
			for _, parent := range pending[name] {
				if !done[parent] {
					ready = false
					break
				}
			}
			if ready {
				done[name] = true
				sorted = append(sorted, name)
				progressed = true
			}
		}
		if !progressed { // cycle: emit the rest in creation order
			for _, name := range names {
				if !done[name] {
					done[name] = true
					sorted = append(sorted, name)
				}
			}
		}
	}
	return sorted, nil
}

func quoteIdent(name string) string {
	return `"` + strings.ReplaceAll(name, `"`, `""`) + `"`
}

// quoteLiteral is for the table-valued pragma functions, which take the table
// name as a string argument and not as an identifier.
func quoteLiteral(name string) string {
	return `'` + strings.ReplaceAll(name, `'`, `''`) + `'`
}

// ExportTables dumps every row of every backed-up table.
func (s *Store) ExportTables(ctx context.Context) ([]models.TableDump, error) {
	names, err := s.tableNames(ctx)
	if err != nil {
		return nil, fmt.Errorf("list tables: %w", err)
	}

	dumps := make([]models.TableDump, 0, len(names))
	for _, name := range names {
		dump, err := s.exportTable(ctx, name)
		if err != nil {
			return nil, fmt.Errorf("export %s: %w", name, err)
		}
		dumps = append(dumps, dump)
	}
	return dumps, nil
}

func (s *Store) exportTable(ctx context.Context, name string) (models.TableDump, error) {
	dump := models.TableDump{Name: name, Rows: []map[string]any{}}

	rows, err := s.db.QueryContext(ctx, "SELECT * FROM "+quoteIdent(name))
	if err != nil {
		return dump, err
	}
	defer rows.Close()

	cols, err := rows.Columns()
	if err != nil {
		return dump, err
	}

	for rows.Next() {
		vals := make([]any, len(cols))
		ptrs := make([]any, len(cols))
		for i := range vals {
			ptrs[i] = &vals[i]
		}
		if err := rows.Scan(ptrs...); err != nil {
			return dump, err
		}
		row := make(map[string]any, len(cols))
		for i, col := range cols {
			// Every column in this schema is TEXT/INTEGER, but a driver is
			// free to hand TEXT back as []byte — which encoding/json would
			// then write as base64, breaking the round-trip.
			if b, ok := vals[i].([]byte); ok {
				row[col] = string(b)
			} else {
				row[col] = vals[i]
			}
		}
		dump.Rows = append(dump.Rows, row)
	}
	return dump, rows.Err()
}

// ImportTables merges dumps into the existing data — nothing is deleted. Rows
// go in with INSERT OR IGNORE, so a row that collides with one already there
// (same primary key, or a UNIQUE like users.email / the one-quiz-per-lesson
// index) is skipped and the local row wins. Re-importing the same backup is
// therefore a no-op, and importing another node's backup adds only what's
// missing here.
//
// Everything runs in one transaction: unknown tables/columns or a foreign key
// violation abort the whole import, never half of it. The per-table
// inserted/skipped counts are what gets reported back to the caller.
func (s *Store) ImportTables(ctx context.Context, dumps []models.TableDump) ([]models.TableImport, error) {
	names, err := s.tableNames(ctx)
	if err != nil {
		return nil, fmt.Errorf("list tables: %w", err)
	}
	order := make(map[string]int, len(names))
	for i, name := range names {
		order[name] = i
	}

	pending := make([]models.TableDump, 0, len(dumps))
	for _, dump := range dumps {
		if skippedTable(dump.Name) {
			continue // e.g. a hand-edited zip still carrying data/sync_log.json
		}
		if _, ok := order[dump.Name]; !ok {
			return nil, fmt.Errorf("unknown table %q in backup", dump.Name)
		}
		pending = append(pending, dump)
	}
	// Insert parents before children (see tableNames), so a child row never
	// references a parent that hasn't been inserted yet.
	sort.SliceStable(pending, func(i, j int) bool { return order[pending[i].Name] < order[pending[j].Name] })

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Belt to the ordering above: defers FK checks to COMMIT for this tx only,
	// which also covers rows referencing a later row of their own table
	// (forum_posts.parent_id). Ignored if the server rejects it — the table
	// ordering alone already satisfies every cross-table foreign key.
	tx.ExecContext(ctx, "PRAGMA defer_foreign_keys = ON")

	results := make([]models.TableImport, 0, len(pending))
	for _, dump := range pending {
		inserted, err := insertRows(ctx, tx, dump)
		if err != nil {
			return nil, fmt.Errorf("import %s: %w", dump.Name, err)
		}
		results = append(results, models.TableImport{
			Name:     dump.Name,
			Inserted: inserted,
			Skipped:  len(dump.Rows) - inserted,
		})
	}
	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return results, nil
}

// insertRows adds dump's rows and returns how many were actually inserted;
// the rest collided with existing rows and were ignored.
func insertRows(ctx context.Context, tx *sql.Tx, dump models.TableDump) (int, error) {
	if len(dump.Rows) == 0 {
		return 0, nil
	}

	cols := make([]string, 0, len(dump.Rows[0]))
	for col := range dump.Rows[0] {
		cols = append(cols, col)
	}
	sort.Strings(cols)

	quoted := make([]string, len(cols))
	for i, col := range cols {
		quoted[i] = quoteIdent(col)
	}
	tuple := "(?" + strings.Repeat(",?", len(cols)-1) + ")"
	// OR IGNORE is what makes an import a merge: a row already present here
	// (by primary key or any UNIQUE constraint) is left alone.
	prefix := "INSERT OR IGNORE INTO " + quoteIdent(dump.Name) + " (" + strings.Join(quoted, ",") + ") VALUES "

	perBatch := maxBindParams / len(cols)
	if perBatch < 1 {
		perBatch = 1
	}

	inserted := 0
	for start := 0; start < len(dump.Rows); start += perBatch {
		end := min(start+perBatch, len(dump.Rows))
		chunk := dump.Rows[start:end]

		var b strings.Builder
		b.WriteString(prefix)
		args := make([]any, 0, len(chunk)*len(cols))
		for i, row := range chunk {
			if len(row) != len(cols) {
				return inserted, fmt.Errorf("row %d has %d columns, expected %d", start+i, len(row), len(cols))
			}
			if i > 0 {
				b.WriteString(",")
			}
			b.WriteString(tuple)
			for _, col := range cols {
				val, ok := row[col]
				if !ok {
					return inserted, fmt.Errorf("row %d is missing column %q", start+i, col)
				}
				args = append(args, val)
			}
		}
		res, err := tx.ExecContext(ctx, b.String(), args...)
		if err != nil {
			return inserted, err
		}
		// A driver that can't report RowsAffected would otherwise make every
		// row look skipped; assume they all landed in that case.
		if n, err := res.RowsAffected(); err == nil {
			inserted += int(n)
		} else {
			inserted += len(chunk)
		}
	}
	return inserted, nil
}
