package store

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
)

// Row versioning: the (hlc, origin_node) pair added by migration 00014 to every
// table with mutable rows. Writes stamp it (Store.version), and merging another
// node's data compares it to decide which of two edits to the same row wins.
//
// Everything here is derived from the live schema via pragma functions, in the
// same spirit as backup.go's FK ordering: a table added by a future migration
// takes part automatically if it carries the two columns, and none of this has
// to be kept in sync with a hardcoded list.
const (
	hlcColumn    = "hlc"
	originColumn = "origin_node"
)

// mergePlan says how one table's rows are merged on import.
type mergePlan struct {
	// pk lists the primary-key columns in order — the ON CONFLICT target.
	pk []string
	// versioned reports whether the table carries (hlc, origin_node), i.e.
	// whether an incoming row is allowed to overwrite a local one at all.
	versioned bool
}

// upsert reports whether rows of this table replace colliding local rows
// (last-writer-wins) rather than being skipped. A versioned table with no
// declared primary key has nothing to match a conflict against, so it falls
// back to skipping.
func (p mergePlan) upsert() bool {
	return p.versioned && len(p.pk) > 0
}

// mergePlans builds one plan per table.
func (s *Store) mergePlans(ctx context.Context, names []string) (map[string]mergePlan, error) {
	plans := make(map[string]mergePlan, len(names))
	for _, name := range names {
		plan, err := s.mergePlanFor(ctx, name)
		if err != nil {
			return nil, fmt.Errorf("inspect %s: %w", name, err)
		}
		plans[name] = plan
	}
	return plans, nil
}

func (s *Store) mergePlanFor(ctx context.Context, name string) (mergePlan, error) {
	// pragma_table_info's pk column is 0 for non-key columns and the 1-based
	// position within the key otherwise, which is the order ON CONFLICT needs.
	rows, err := s.db.QueryContext(ctx,
		"SELECT name, pk FROM pragma_table_info("+quoteLiteral(name)+") ORDER BY pk, cid")
	if err != nil {
		return mergePlan{}, err
	}
	defer rows.Close()

	var (
		plan     mergePlan
		hasHLC   bool
		hasOrig  bool
		keyed    = map[int]string{}
		maxKeyed int
	)
	for rows.Next() {
		var (
			col string
			pk  int
		)
		if err := rows.Scan(&col, &pk); err != nil {
			return mergePlan{}, err
		}
		switch col {
		case hlcColumn:
			hasHLC = true
		case originColumn:
			hasOrig = true
		}
		if pk > 0 {
			keyed[pk] = col
			if pk > maxKeyed {
				maxKeyed = pk
			}
		}
	}
	if err := rows.Err(); err != nil {
		return mergePlan{}, err
	}

	for i := 1; i <= maxKeyed; i++ {
		if col, ok := keyed[i]; ok {
			plan.pk = append(plan.pk, col)
		}
	}
	plan.versioned = hasHLC && hasOrig
	return plan, nil
}

// SeedClock advances this node's logical clock past every version already
// stored, so a restart can't hand out timestamps that lose to rows this node
// wrote before it went down. That matters precisely because the wall clock is
// untrustworthy here: an edge server with no RTC comes back from a power cut
// with a clock that can be far behind.
func (s *Store) SeedClock(ctx context.Context) error {
	names, err := s.listTables(ctx, internalTable)
	if err != nil {
		return fmt.Errorf("list tables: %w", err)
	}
	plans, err := s.mergePlans(ctx, names)
	if err != nil {
		return err
	}
	for _, name := range names {
		if !plans[name].versioned {
			continue
		}
		var maxHLC int64
		row := s.db.QueryRowContext(ctx,
			"SELECT COALESCE(MAX("+quoteIdent(hlcColumn)+"), 0) FROM "+quoteIdent(name))
		if err := row.Scan(&maxHLC); err != nil {
			return fmt.Errorf("read max %s of %s: %w", hlcColumn, name, err)
		}
		s.hlc.Observe(maxHLC)
	}
	return nil
}

// NodeID reports the id this node stamps on its own writes.
func (s *Store) NodeID() string { return s.nodeID }

// rowVersion is the (hlc, origin_node) pair of one stored row.
type rowVersion struct {
	hlc    int64
	origin string
}

// after reports whether v was written later than other. Ties on the logical
// clock are broken by node id — see lastWriterWins for why that rule exists.
func (v rowVersion) after(other rowVersion) bool {
	if v.hlc != other.hlc {
		return v.hlc > other.hlc
	}
	return v.origin > other.origin
}

// versionOf reads the version out of a dumped row. A row with no version (a
// hand-edited dump, or a seed pack built before migration 00014) reads as the
// zero version, which loses every comparison — it can be inserted where nothing
// exists, but never overwrites a row someone actually wrote.
func versionOf(row map[string]any) rowVersion {
	v := rowVersion{origin: asString(row[originColumn])}
	// JSON decoding can hand the same column back as either integer type
	// depending on the decoder; anything else is treated as "no version" rather
	// than guessed at.
	switch n := row[hlcColumn].(type) {
	case int64:
		v.hlc = n
	case float64:
		v.hlc = int64(n)
	}
	return v
}

// storedVersions reads the version of every row currently in the table, keyed
// the same way as rowKey. One query per table, which at this scale is far
// cheaper than asking the database about each incoming row.
func storedVersions(ctx context.Context, tx *sql.Tx, table string, plan mergePlan) (map[string]rowVersion, error) {
	cols := make([]string, 0, len(plan.pk)+2)
	for _, col := range plan.pk {
		cols = append(cols, quoteIdent(col))
	}
	cols = append(cols, quoteIdent(hlcColumn), quoteIdent(originColumn))

	rows, err := tx.QueryContext(ctx, "SELECT "+strings.Join(cols, ",")+" FROM "+quoteIdent(table))
	if err != nil {
		return nil, fmt.Errorf("read versions of %s: %w", table, err)
	}
	defer rows.Close()

	out := map[string]rowVersion{}
	for rows.Next() {
		vals := make([]any, len(cols))
		ptrs := make([]any, len(cols))
		for i := range vals {
			ptrs[i] = &vals[i]
		}
		if err := rows.Scan(ptrs...); err != nil {
			return nil, err
		}
		keyParts := make([]any, len(plan.pk))
		copy(keyParts, vals[:len(plan.pk)])

		var version rowVersion
		if n, ok := vals[len(vals)-2].(int64); ok {
			version.hlc = n
		}
		version.origin = asString(vals[len(vals)-1])
		out[joinKey(keyParts)] = version
	}
	return out, rows.Err()
}

// rowKey builds the primary-key identity of a dumped row. Reports false if the
// row is missing a key column, in which case it's treated as new and left to
// the database to accept or reject.
func rowKey(row map[string]any, pk []string) (string, bool) {
	parts := make([]any, len(pk))
	for i, col := range pk {
		val, ok := row[col]
		if !ok {
			return "", false
		}
		parts[i] = val
	}
	return joinKey(parts), true
}

// joinKey renders key values as text so a value scanned from the database and
// the same value decoded from JSON land on the same key. The separator is a NUL
// byte, which can't appear inside a SQLite TEXT value, so ("a","b") and ("ab",)
// can't collide.
func joinKey(parts []any) string {
	var b strings.Builder
	for i, part := range parts {
		if i > 0 {
			b.WriteByte(0)
		}
		b.WriteString(asString(part))
	}
	return b.String()
}

// asString normalizes a driver or JSON value to text. []byte matters here: a
// driver is free to return TEXT that way, and fmt would then render it as a
// list of bytes and never match the same value read from a dump.
func asString(val any) string {
	switch v := val.(type) {
	case nil:
		return ""
	case string:
		return v
	case []byte:
		return string(v)
	default:
		return fmt.Sprint(v)
	}
}
