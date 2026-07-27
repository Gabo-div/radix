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

// internalTable reports tables no bulk operation may ever touch:
//   - sqlite internals;
//   - goose's own bookkeeping (migrations are applied by the app on boot, so
//     rewriting this table could downgrade the recorded version);
//   - the FTS5 shadow tables of server_logs_fts, an external-content index the
//     Go code never writes to — the triggers on server_logs keep it in sync.
func internalTable(name string) bool {
	return strings.HasPrefix(name, "sqlite_") ||
		name == "goose_db_version" ||
		strings.HasPrefix(name, "server_logs_fts")
}

// skippedTable additionally excludes, from backups only, the tables that are
// per-node operational state rather than shared content: this edge server's log
// stream and everything sync_* (the operation log, the cursors into its peers,
// and how far its readers have got). Those describe this node's relationship
// with its neighbours; importing another node's copy would be meaningless, and
// letting a peer write rows into them through an import would be a hole.
// ClearTables does wipe them — flushing this node's database means flushing its
// history too.
func skippedTable(name string) bool {
	return internalTable(name) ||
		name == "server_logs" ||
		strings.HasPrefix(name, "sync_")
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
	return s.listTables(ctx, skippedTable)
}

// listTables returns every table except those `skip` rejects, in FK-dependency
// order.
func (s *Store) listTables(ctx context.Context, skip func(string) bool) ([]string, error) {
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
		if !skip(name) {
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

	scanned, err := scanRowMaps(rows)
	if err != nil {
		return dump, err
	}
	if len(scanned) > 0 {
		dump.Rows = scanned
	}
	return dump, nil
}

// scanRowMaps reads a `SELECT *` result into column-name → value maps. Shared by
// the backup export and the operation log, which both need a row without
// knowing its shape.
func scanRowMaps(rows *sql.Rows) ([]map[string]any, error) {
	cols, err := rows.Columns()
	if err != nil {
		return nil, err
	}

	var out []map[string]any
	for rows.Next() {
		vals := make([]any, len(cols))
		ptrs := make([]any, len(cols))
		for i := range vals {
			ptrs[i] = &vals[i]
		}
		if err := rows.Scan(ptrs...); err != nil {
			return nil, err
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
		out = append(out, row)
	}
	return out, rows.Err()
}

// ImportTables merges dumps into the existing data — nothing is deleted.
//
// A row that collides with one already here is resolved by version, not by
// arrival: the incoming row replaces the local one when its (hlc, origin_node)
// pair is greater, and is dropped otherwise (see insertRows). That's what makes
// this a real merge between edge servers rather than "whoever wrote first keeps
// it" — an edit made on another node now actually lands. Re-importing the same
// backup is still a no-op, since equal versions don't overwrite.
//
// Tables with no version columns (the junction tables: enrolments, likes, wiki
// links) keep the old skip-on-collision behaviour: they hold set membership, so
// there is no field an incoming row could update.
//
// Everything runs in one transaction: unknown tables/columns or a foreign key
// violation abort the whole import, never half of it. The per-table
// applied/skipped counts are what gets reported back to the caller.
func (s *Store) ImportTables(ctx context.Context, dumps []models.TableDump) ([]models.TableImport, error) {
	names, err := s.tableNames(ctx)
	if err != nil {
		return nil, fmt.Errorf("list tables: %w", err)
	}
	order := make(map[string]int, len(names))
	for i, name := range names {
		order[name] = i
	}
	plans, err := s.mergePlans(ctx, names)
	if err != nil {
		return nil, err
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

	q := s.queries.WithTx(tx)
	results := make([]models.TableImport, 0, len(pending))
	for _, dump := range pending {
		applied, written, err := insertRows(ctx, tx, dump, plans[dump.Name])
		if err != nil {
			return nil, fmt.Errorf("import %s: %w", dump.Name, err)
		}
		// A zip is a snapshot, but what it brings in still has to reach this
		// node's own peers — otherwise content imported on the central server
		// would stop there, and every edge would need the file by hand. Each row
		// keeps its own version and origin, so the op is a forward, not a claim
		// that this node authored it.
		for _, row := range written {
			if err := s.logImportedRow(ctx, q, dump.Name, plans[dump.Name], row); err != nil {
				return nil, fmt.Errorf("log import of %s: %w", dump.Name, err)
			}
		}
		results = append(results, models.TableImport{
			Name:    dump.Name,
			Applied: applied,
			Skipped: len(dump.Rows) - applied,
		})
	}
	if err := tx.Commit(); err != nil {
		return nil, err
	}

	// Everything just seen is now part of this node's history: the next local
	// write has to sort after it, or an edit made here would lose to the data it
	// was made on top of. Versions we rejected count too — they were still
	// observed. Deliberately after the commit, so a failed import doesn't move
	// the clock.
	s.hlc.Observe(maxHLC(pending))
	return results, nil
}

// maxHLC finds the highest version in the dumps, ignoring rows without one.
func maxHLC(dumps []models.TableDump) int64 {
	var highest int64
	for _, dump := range dumps {
		for _, row := range dump.Rows {
			// The dumps come from JSON, where the same column can arrive as
			// int64 or float64 depending on the decoder; anything else (a
			// hand-edited zip with a string) is ignored rather than guessed at.
			switch v := row[hlcColumn].(type) {
			case int64:
				if v > highest {
					highest = v
				}
			case float64:
				if int64(v) > highest {
					highest = int64(v)
				}
			}
		}
	}
	return highest
}

// ClearTables deletes every row of every table, leaving the schema (and the
// applied-migration record) in place — the DB ends up as if it had just been
// created. Returns rows deleted per table.
//
// Tables are emptied in reverse FK-dependency order, so a child is always gone
// before its parent. Everything runs in one transaction: an error leaves the
// data untouched. server_logs and sync_log go too (see skippedTable), and
// deleting from server_logs fires the triggers that clean up its FTS index.
func (s *Store) ClearTables(ctx context.Context) (map[string]int64, error) {
	names, err := s.listTables(ctx, internalTable)
	if err != nil {
		return nil, fmt.Errorf("list tables: %w", err)
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	deleted := make(map[string]int64, len(names))
	for i := len(names) - 1; i >= 0; i-- {
		res, err := tx.ExecContext(ctx, "DELETE FROM "+quoteIdent(names[i]))
		if err != nil {
			return nil, fmt.Errorf("clear %s: %w", names[i], err)
		}
		n, err := res.RowsAffected()
		if err != nil {
			n = 0 // driver can't report it; the DELETE still ran
		}
		deleted[names[i]] = n
	}
	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return deleted, nil
}

// insertRows merges dump's rows and returns how many were applied — inserted,
// or overwritten because the incoming version was newer. The rest lost to the
// local row (or collided with a unique constraint) and were left alone.
//
// Rows are classified here in Go rather than left to one clever SQL statement,
// because the obvious statement doesn't work: `INSERT OR IGNORE ... ON CONFLICT
// DO UPDATE` parses fine and then silently does nothing on a conflict — the OR
// IGNORE swallows it before the upsert is reached. Dropping OR IGNORE instead
// would make a collision on a non-key unique (two nodes that independently
// created the same student, so same users.email with different ids) abort the
// whole import, which is a regression: today those rows are skipped. So the
// split is deliberate — new rows go in with OR IGNORE, and only rows already
// present locally take the upsert path.
// The second return value is the rows it tried to write, which is what the
// caller turns into forwardable ops. A row that OR IGNORE dropped on a unique
// constraint is in there too: this node couldn't store it, but the payload is
// still complete and a node further along may well be able to.
func insertRows(ctx context.Context, tx *sql.Tx, dump models.TableDump, plan mergePlan) (int, []map[string]any, error) {
	if len(dump.Rows) == 0 {
		return 0, nil, nil
	}

	cols := make([]string, 0, len(dump.Rows[0]))
	for col := range dump.Rows[0] {
		cols = append(cols, col)
	}
	sort.Strings(cols)

	// Unversioned tables (the junction tables) have no field to overwrite:
	// their rows are set membership, so a collision means "already a member".
	if !plan.upsert() {
		applied, err := execRows(ctx, tx, dump.Name, cols, dump.Rows, true, "")
		return applied, dump.Rows, err
	}

	local, err := storedVersions(ctx, tx, dump.Name, plan)
	if err != nil {
		return 0, nil, err
	}

	fresh := make([]map[string]any, 0, len(dump.Rows))
	newer := make([]map[string]any, 0)
	for _, row := range dump.Rows {
		key, ok := rowKey(row, plan.pk)
		current, exists := local[key]
		switch {
		case !ok || !exists:
			fresh = append(fresh, row)
		case versionOf(row).after(current):
			newer = append(newer, row)
		}
	}

	inserted, err := execRows(ctx, tx, dump.Name, cols, fresh, true, "")
	if err != nil {
		return inserted, nil, err
	}
	// The upsert's own WHERE repeats the comparison already made above. Kept as
	// the authoritative rule: if the classification and the SQL ever disagree,
	// the stricter one wins and no newer row is overwritten by an older one.
	updated, err := execRows(ctx, tx, dump.Name, cols, newer, false, lastWriterWins(dump.Name, cols, plan))
	return inserted + updated, append(fresh, newer...), err
}

// execRows runs the batched multi-row INSERT and reports how many rows the
// database actually wrote.
func execRows(ctx context.Context, tx *sql.Tx, table string, cols []string, rows []map[string]any, ignore bool, suffix string) (int, error) {
	if len(rows) == 0 {
		return 0, nil
	}

	quoted := make([]string, len(cols))
	for i, col := range cols {
		quoted[i] = quoteIdent(col)
	}
	verb := "INSERT INTO "
	if ignore {
		verb = "INSERT OR IGNORE INTO "
	}
	prefix := verb + quoteIdent(table) + " (" + strings.Join(quoted, ",") + ") VALUES "
	tuple := "(?" + strings.Repeat(",?", len(cols)-1) + ")"

	perBatch := maxBindParams / len(cols)
	if perBatch < 1 {
		perBatch = 1
	}

	applied := 0
	for start := 0; start < len(rows); start += perBatch {
		end := min(start+perBatch, len(rows))
		chunk := rows[start:end]

		var b strings.Builder
		b.WriteString(prefix)
		args := make([]any, 0, len(chunk)*len(cols))
		for i, row := range chunk {
			if len(row) != len(cols) {
				return applied, fmt.Errorf("row %d has %d columns, expected %d", start+i, len(row), len(cols))
			}
			if i > 0 {
				b.WriteString(",")
			}
			b.WriteString(tuple)
			for _, col := range cols {
				val, ok := row[col]
				if !ok {
					return applied, fmt.Errorf("row %d is missing column %q", start+i, col)
				}
				args = append(args, val)
			}
		}
		b.WriteString(suffix)
		res, err := tx.ExecContext(ctx, b.String(), args...)
		if err != nil {
			return applied, err
		}
		// A driver that can't report RowsAffected would otherwise make every
		// row look skipped; assume they all landed in that case.
		if n, err := res.RowsAffected(); err == nil {
			applied += int(n)
		} else {
			applied += len(chunk)
		}
	}
	return applied, nil
}

// lastWriterWins builds the upsert clause for rows that already exist locally:
//
//	ON CONFLICT("id") DO UPDATE SET "title" = excluded."title", ...
//	WHERE excluded."hlc" > "lessons"."hlc"
//	   OR (excluded."hlc" = "lessons"."hlc" AND excluded."origin_node" > "lessons"."origin_node")
//
// The origin_node comparison only breaks an exact tie between two nodes that
// wrote at the very same logical instant. It exists so the outcome is identical
// on every node instead of depending on which one merged first — an arbitrary
// but deterministic rule beats a consistent-looking one ("keep mine on a tie")
// under which two nodes would each keep their own value and never agree again.
func lastWriterWins(table string, cols []string, plan mergePlan) string {
	if !plan.upsert() {
		return ""
	}

	key := make(map[string]bool, len(plan.pk))
	for _, col := range plan.pk {
		key[col] = true
	}
	// Only columns actually present in this dump get assigned: setting a column
	// the dump doesn't carry would write the table default over real data.
	sets := make([]string, 0, len(cols))
	for _, col := range cols {
		if !key[col] {
			sets = append(sets, quoteIdent(col)+" = excluded."+quoteIdent(col))
		}
	}
	if len(sets) == 0 {
		return ""
	}

	quotedPK := make([]string, len(plan.pk))
	for i, col := range plan.pk {
		quotedPK[i] = quoteIdent(col)
	}

	var (
		local  = quoteIdent(table)
		hlc    = quoteIdent(hlcColumn)
		origin = quoteIdent(originColumn)
	)
	// Written as two scalar comparisons instead of SQLite's row-value form
	// ((a,b) > (c,d)), which is equivalent but needs a newer SQLite than every
	// driver in this project is guaranteed to be.
	newer := "excluded." + hlc + " > " + local + "." + hlc +
		" OR (excluded." + hlc + " = " + local + "." + hlc +
		" AND excluded." + origin + " > " + local + "." + origin + ")"

	return " ON CONFLICT(" + strings.Join(quotedPK, ",") + ") DO UPDATE SET " +
		strings.Join(sets, ", ") + " WHERE " + newer
}
