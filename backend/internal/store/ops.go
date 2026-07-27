package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"

	"radix-backend/internal/database/dbgen"
	"radix-backend/internal/models"
)

// The operation log — the DTN queue, for real this time.
//
// Every write records what changed as a replayable op (table, primary key,
// operation, version, whole row), and a peer pulls the ops it hasn't seen
// instead of a whole-database zip. Three properties make that safe to do over a
// link that comes and goes:
//
//   - Idempotent. An op's identity is (origin_node, table_name, pk_json, hlc),
//     with a UNIQUE index behind it, so receiving it twice is a no-op.
//   - Order-independent between rows. An upsert carries the full row and is
//     accepted only if its version beats the local one, so two nodes converge on
//     the same content whatever order their ops cross in.
//   - Forwardable. An applied op is stored with its ORIGIN preserved and a fresh
//     local seq, so it travels on: A → B → C converges without A and C ever
//     meeting.
//
// What is deliberately not here: retention. Ops accumulate forever. Pruning them
// means deciding a peer will never come back (everything below min(acked_seq)
// plus a grace window), and a node offline longer than that has to re-bootstrap
// from a backup zip — which is one of the two jobs the zip still does, the other
// being sneakernet.

// maxOpsPerPull caps one pull, so a node that has been offline for a month
// transfers in bounded chunks instead of one enormous response. The puller keeps
// going until a round comes back empty.
const maxOpsPerPull = 500

// --- writing ops ---

// logUpsert records that a row was written. It reads the row back rather than
// taking a payload from the caller: that keeps the op's payload identical to
// what an export would produce, with no per-table column list to maintain, and
// it picks up whatever the database actually stored (defaults included).
//
// Must run inside the same transaction as the write itself. An op committed
// without its data — or data committed without its op — is a change that either
// never happened or never propagates.
func (s *Store) logUpsert(ctx context.Context, tx *sql.Tx, q *dbgen.Queries, table string, pk map[string]any) error {
	row, err := readRow(ctx, tx, table, pk)
	if err != nil {
		return err
	}
	if row == nil {
		return fmt.Errorf("log upsert of %s: row %v is not there", table, pk)
	}

	hlc, origin := s.rowVersionOrNow(row)
	payload, err := json.Marshal(row)
	if err != nil {
		return err
	}
	return s.appendOp(ctx, q, models.SyncOp{
		OriginNode: origin,
		Table:      table,
		PK:         pkJSON(pk),
		Op:         models.OpUpsert,
		HLC:        hlc,
		Label:      label(table, row, pk),
	}, string(payload))
}

// logDelete records that a row was removed. Unlike an upsert it takes its
// version straight from the clock: there is no row left to read one from, and
// the delete has to be able to outrank the row it removed.
func (s *Store) logDelete(ctx context.Context, tx *sql.Tx, q *dbgen.Queries, table string, pk map[string]any) error {
	return s.appendOp(ctx, q, models.SyncOp{
		OriginNode: s.nodeID,
		Table:      table,
		PK:         pkJSON(pk),
		Op:         models.OpDelete,
		HLC:        s.hlc.Now(),
		Label:      label(table, nil, pk),
	}, "{}")
}

func (s *Store) appendOp(ctx context.Context, q *dbgen.Queries, op models.SyncOp, payload string) error {
	return q.AddSyncOp(ctx, dbgen.AddSyncOpParams{
		OriginNode: op.OriginNode,
		TableName:  op.Table,
		PkJson:     op.PK,
		Op:         op.Op,
		Hlc:        op.HLC,
		Payload:    payload,
		Label:      op.Label,
		CreatedAt:  time.Now().UTC().Format(time.RFC3339),
	})
}

// rowVersionOrNow takes the op's version from the row when the table is
// versioned, so the op and the row it describes carry the same version — that's
// what lets a receiver compare them without unpacking the payload. Junction
// tables have no version of their own, so their ops get a fresh one.
func (s *Store) rowVersionOrNow(row map[string]any) (int64, string) {
	v := versionOf(row)
	if v.hlc == 0 {
		return s.hlc.Now(), s.nodeID
	}
	return v.hlc, v.origin
}

// label is the human-readable summary the Monitor lists. Derived from whatever
// name-ish column the row has rather than passed in by each call site: the
// handlers used to hand-write these strings ("ADD_LESSON: " + title) and that
// was one more thing to keep in sync with the schema.
func label(table string, row map[string]any, pk map[string]any) string {
	for _, col := range []string{"title", "name", "action"} {
		if v, ok := row[col]; ok {
			if text := asString(v); text != "" {
				return table + ": " + text
			}
		}
	}
	keys := make([]string, 0, len(pk))
	for key := range pk {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	parts := make([]string, 0, len(keys))
	for _, key := range keys {
		parts = append(parts, asString(pk[key]))
	}
	return table + ": " + strings.Join(parts, "/")
}

// pkJSON renders a primary key as the op's row identity. encoding/json sorts map
// keys, so the same key always renders the same way on every node.
func pkJSON(pk map[string]any) string {
	data, err := json.Marshal(pk)
	if err != nil { // map[string]any of scalars: can't happen
		return fmt.Sprint(pk)
	}
	return string(data)
}

func readRow(ctx context.Context, tx *sql.Tx, table string, pk map[string]any) (map[string]any, error) {
	where, args := pkWhere(table, pk)
	rows, err := tx.QueryContext(ctx, "SELECT * FROM "+quoteIdent(table)+" WHERE "+where, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	scanned, err := scanRowMaps(rows)
	if err != nil || len(scanned) == 0 {
		return nil, err
	}
	return scanned[0], nil
}

// pkWhere builds a deterministic `col = ? AND ...` for a primary key.
func pkWhere(table string, pk map[string]any) (string, []any) {
	cols := make([]string, 0, len(pk))
	for col := range pk {
		cols = append(cols, col)
	}
	sort.Strings(cols)

	parts := make([]string, len(cols))
	args := make([]any, len(cols))
	for i, col := range cols {
		parts[i] = quoteIdent(table) + "." + quoteIdent(col) + " = ?"
		args[i] = pk[col]
	}
	return strings.Join(parts, " AND "), args
}

// --- reading ops ---

// OpsSince returns the ops after cursor in this node's local order, oldest
// first. That order covers this node's own writes and everything it learned from
// its peers, which is what makes a single cursor per peer enough.
func (s *Store) OpsSince(ctx context.Context, cursor int64, limit int) ([]models.SyncOp, error) {
	if limit <= 0 || limit > maxOpsPerPull {
		limit = maxOpsPerPull
	}
	rows, err := s.queries.OpsSince(ctx, dbgen.OpsSinceParams{Seq: cursor, Limit: int64(limit)})
	if err != nil {
		return nil, err
	}
	ops := make([]models.SyncOp, 0, len(rows))
	for _, row := range rows {
		op := models.SyncOp{
			Seq:        row.Seq,
			OriginNode: row.OriginNode,
			Table:      row.TableName,
			PK:         row.PkJson,
			Op:         row.Op,
			HLC:        row.Hlc,
			Label:      row.Label,
			CreatedAt:  row.CreatedAt,
		}
		if row.Op == models.OpUpsert {
			if err := json.Unmarshal([]byte(row.Payload), &op.Payload); err != nil {
				return nil, fmt.Errorf("op %d has an unreadable payload: %w", row.Seq, err)
			}
		}
		ops = append(ops, op)
	}
	return ops, nil
}

// LatestOpSeq is the newest local seq, so a puller can tell whether it caught up
// or should keep pulling.
func (s *Store) LatestOpSeq(ctx context.Context) (int64, error) {
	seq, err := s.queries.MaxOpSeq(ctx)
	if err != nil {
		return 0, err
	}
	n, _ := seq.(int64)
	return n, nil
}

// --- applying ops ---

// ApplyOps merges a batch of ops from another node, in the order given. Returns
// how many changed something here and how many were dropped (already known, or
// beaten by a newer local version).
//
// Every op valid for a content table is stored whether or not it wins, so it
// forwards to this node's own peers — a node that only sees the losing version
// of a row still has to pass the winning one along.
func (s *Store) ApplyOps(ctx context.Context, ops []models.SyncOp) (applied, skipped int, err error) {
	if len(ops) == 0 {
		return 0, 0, nil
	}

	names, err := s.tableNames(ctx)
	if err != nil {
		return 0, 0, fmt.Errorf("list tables: %w", err)
	}
	allowed := make(map[string]bool, len(names))
	for _, name := range names {
		allowed[name] = true
	}
	plans, err := s.mergePlans(ctx, names)
	if err != nil {
		return 0, 0, err
	}

	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, 0, err
	}
	defer tx.Rollback()
	// Ops from different nodes can interleave a child before its parent; the
	// deferred check lets the batch settle before the constraints are judged.
	tx.ExecContext(ctx, "PRAGMA defer_foreign_keys = ON")

	q := s.queries.WithTx(tx)
	var highest int64
	for _, op := range ops {
		// A peer must not be able to write into another node's operational
		// tables (sync_*, server_logs) or into sqlite's own — tableNames is the
		// content whitelist, same one the backup uses.
		if !allowed[op.Table] {
			skipped++
			continue
		}
		if op.HLC > highest {
			highest = op.HLC
		}

		known, err := q.HasSyncOp(ctx, dbgen.HasSyncOpParams{
			OriginNode: op.OriginNode, TableName: op.Table, PkJson: op.PK, Hlc: op.HLC,
		})
		if err != nil {
			return applied, skipped, err
		}
		if known > 0 {
			skipped++
			continue
		}

		changed, err := s.applyOp(ctx, tx, q, op, plans[op.Table])
		if err != nil {
			return applied, skipped, err
		}
		if changed {
			applied++
		} else {
			skipped++
		}

		payload := "{}"
		if op.Op == models.OpUpsert {
			data, err := json.Marshal(op.Payload)
			if err != nil {
				return applied, skipped, err
			}
			payload = string(data)
		}
		if err := s.appendOp(ctx, q, op, payload); err != nil {
			return applied, skipped, err
		}
	}

	if err := tx.Commit(); err != nil {
		return 0, 0, err
	}
	// Same reason as ImportTables: what this node has seen now bounds what it
	// may write next, or a local edit could lose to the data it was made on.
	s.hlc.Observe(highest)
	return applied, skipped, nil
}

func (s *Store) applyOp(ctx context.Context, tx *sql.Tx, q *dbgen.Queries, op models.SyncOp, plan mergePlan) (bool, error) {
	switch op.Op {
	case models.OpDelete:
		return s.applyDelete(ctx, tx, op, plan)
	case models.OpUpsert:
		return s.applyUpsert(ctx, tx, q, op, plan)
	default:
		return false, fmt.Errorf("unknown operation %q", op.Op)
	}
}

func (s *Store) applyUpsert(ctx context.Context, tx *sql.Tx, q *dbgen.Queries, op models.SyncOp, plan mergePlan) (bool, error) {
	if len(op.Payload) == 0 {
		return false, fmt.Errorf("upsert of %s carries no payload", op.Table)
	}

	// The log is the tombstone table: a row deleted at an equal or newer version
	// must not come back because an older write about it arrived afterwards.
	buried, err := q.CountDeletesNotOlderThan(ctx, dbgen.CountDeletesNotOlderThanParams{
		TableName: op.Table, PkJson: op.PK, Hlc: op.HLC,
	})
	if err != nil {
		return false, err
	}
	if buried > 0 {
		return false, nil
	}

	cols := make([]string, 0, len(op.Payload))
	for col := range op.Payload {
		cols = append(cols, col)
	}
	sort.Strings(cols)

	// Unversioned rows can't be compared, so they're inserted if absent and left
	// alone otherwise — the same rule the backup merge uses for them.
	ignore := !plan.upsert()
	n, err := execRows(ctx, tx, op.Table, cols, []map[string]any{op.Payload}, ignore, lastWriterWins(op.Table, cols, plan))
	if err != nil {
		if isConstraintError(err) {
			// One op that can't satisfy a constraint (a missing parent, an email
			// another node already gave to a different id) must not wedge the
			// whole link: the rest of the batch still applies and this one is
			// reported as skipped. It will be retried on every later pull, since
			// nothing marks it as consumed.
			return false, nil
		}
		return false, err
	}
	if n == 0 {
		return false, nil
	}
	return true, s.rederive(ctx, q, op)
}

func (s *Store) applyDelete(ctx context.Context, tx *sql.Tx, op models.SyncOp, plan mergePlan) (bool, error) {
	var pk map[string]any
	if err := json.Unmarshal([]byte(op.PK), &pk); err != nil {
		return false, fmt.Errorf("delete of %s has an unreadable key: %w", op.Table, err)
	}
	where, args := pkWhere(op.Table, pk)

	// A delete only removes a row it outranks: an edit made after the delete, on
	// another node, wins and the row stays.
	if plan.versioned {
		local := quoteIdent(op.Table)
		where += " AND (" + local + "." + quoteIdent(hlcColumn) + " < ?" +
			" OR (" + local + "." + quoteIdent(hlcColumn) + " = ? AND " +
			local + "." + quoteIdent(originColumn) + " < ?))"
		args = append(args, op.HLC, op.HLC, op.OriginNode)
	}

	res, err := tx.ExecContext(ctx, "DELETE FROM "+quoteIdent(op.Table)+" WHERE "+where, args...)
	if err != nil {
		if isConstraintError(err) {
			return false, nil
		}
		return false, err
	}
	n, err := res.RowsAffected()
	if err != nil {
		return true, nil // driver can't say; the DELETE ran
	}
	return n > 0, nil
}

// rederive recomputes the indexes that are a pure function of the row's content
// rather than facts of their own: the [[id]] wiki-links. They're derived the
// same way on every node, so shipping them as ops would be redundant — and would
// need deletes for links the edit removed. Deterministic derivation costs
// nothing to redo and can't drift.
func (s *Store) rederive(ctx context.Context, q *dbgen.Queries, op models.SyncOp) error {
	id := asString(op.Payload["id"])
	if id == "" {
		return nil
	}
	switch op.Table {
	case "lessons":
		return s.syncLessonLinks(ctx, q, id, asString(op.Payload["content_text"]))
	case "quizzes":
		return s.syncQuizLinks(ctx, q, id, asString(op.Payload["description"]))
	case "forum_posts":
		return s.syncForumLinks(ctx, q, id, asString(op.Payload["body"]))
	}
	return nil
}

// isConstraintError reports whether the database rejected a statement because of
// a constraint rather than because something is broken. Matched on the message
// because neither driver exposes a typed error, and both wrap SQLite's own text.
func isConstraintError(err error) bool {
	return err != nil && strings.Contains(strings.ToLower(err.Error()), "constraint")
}

// --- peers and cursors ---

// PeerCursor is how far this node has read a peer's log. Zero for a peer never
// pulled from, which starts it at the beginning of that peer's history.
func (s *Store) PeerCursor(ctx context.Context, peer string) (int64, error) {
	row, err := s.queries.GetSyncPeer(ctx, peer)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, nil
		}
		return 0, err
	}
	return row.LastSeq, nil
}

// RecordPeer stores the outcome of a pull. A failed attempt keeps the cursor
// where it was — nothing was applied, so nothing may be marked as read.
func (s *Store) RecordPeer(ctx context.Context, peer models.SyncPeer) error {
	return s.queries.RecordSyncPeer(ctx, dbgen.RecordSyncPeerParams{
		Peer:       peer.Peer,
		NodeID:     peer.NodeID,
		LastSeq:    peer.LastSeq,
		LastSyncAt: time.Now().UTC().Format(time.RFC3339),
		LastError:  peer.LastError,
	})
}

// RecordReader notes that nodeID has read this node's log up to cursor. The
// puller sends its own position with every request, so this is free — and it's
// what lets the Monitor say "not delivered anywhere yet" instead of just
// "still in the table".
func (s *Store) RecordReader(ctx context.Context, nodeID string, cursor int64) error {
	if nodeID == "" {
		return nil
	}
	return s.queries.RecordSyncReader(ctx, dbgen.RecordSyncReaderParams{
		NodeID:   nodeID,
		AckedSeq: cursor,
		LastSeen: time.Now().UTC().Format(time.RFC3339),
	})
}

// GetSyncQueue is the Monitor's view of the queue: what hasn't reached a peer.
func (s *Store) GetSyncQueue(ctx context.Context) (models.SyncQueue, error) {
	count, err := s.queries.CountUnackedOps(ctx)
	if err != nil {
		return models.SyncQueue{}, err
	}
	labels, err := s.queries.UnackedOpLabels(ctx, queuePreviewSize)
	if err != nil {
		return models.SyncQueue{}, err
	}
	rows, err := s.queries.ListSyncPeers(ctx)
	if err != nil {
		return models.SyncQueue{}, err
	}
	peers := make([]models.SyncPeer, 0, len(rows))
	for _, row := range rows {
		peers = append(peers, models.SyncPeer{
			Peer:       row.Peer,
			NodeID:     row.NodeID,
			LastSeq:    row.LastSeq,
			LastSyncAt: row.LastSyncAt,
			LastError:  row.LastError,
		})
	}
	return models.SyncQueue{TransactionCount: int(count), Logs: labels, Peers: peers}, nil
}

// queuePreviewSize bounds the labels sent to the Monitor: the count is exact,
// the list is a preview.
const queuePreviewSize = 50

// logImportedRow turns a row that a backup import wrote into a forwardable op,
// keeping the row's own version and origin instead of claiming this node wrote
// it. Rows with no primary key (none in this schema) are left unlogged: there
// would be nothing to address the op to.
func (s *Store) logImportedRow(ctx context.Context, q *dbgen.Queries, table string, plan mergePlan, row map[string]any) error {
	if len(plan.pk) == 0 {
		return nil
	}
	pk := make(map[string]any, len(plan.pk))
	for _, col := range plan.pk {
		val, ok := row[col]
		if !ok {
			return nil
		}
		pk[col] = val
	}

	hlc, origin := s.rowVersionOrNow(row)
	payload, err := json.Marshal(row)
	if err != nil {
		return err
	}
	return s.appendOp(ctx, q, models.SyncOp{
		OriginNode: origin,
		Table:      table,
		PK:         pkJSON(pk),
		Op:         models.OpUpsert,
		HLC:        hlc,
		Label:      label(table, row, pk),
	}, string(payload))
}

// LibraryFiles lists the items that have a file on disk. Ops carry rows and not
// bytes, so this is what tells a node which uploads it has learned about but
// doesn't hold yet (dtn.Syncer.fetchFiles).
func (s *Store) LibraryFiles(ctx context.Context) ([]models.LibraryFile, error) {
	rows, err := s.queries.ListLibraryFiles(ctx)
	if err != nil {
		return nil, err
	}
	files := make([]models.LibraryFile, 0, len(rows))
	for _, row := range rows {
		if row.FilePath == "" { // legacy metadata-only item, nothing to fetch
			continue
		}
		files = append(files, models.LibraryFile{ID: row.ID, FilePath: row.FilePath})
	}
	return files, nil
}
