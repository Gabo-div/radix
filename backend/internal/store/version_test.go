package store_test

import (
	"context"
	"path/filepath"
	"testing"

	"radix-backend/internal/config"
	"radix-backend/internal/database"
	"radix-backend/internal/models"
	"radix-backend/internal/store"
)

// versionedStore is one edge server: its own database, its own node id.
func versionedStore(t *testing.T, nodeID string) *store.Store {
	t.Helper()
	ctx := context.Background()
	db, err := database.Open(ctx, &config.Config{DBPath: filepath.Join(t.TempDir(), nodeID+".db")})
	if err != nil {
		t.Fatalf("open db for %s: %v", nodeID, err)
	}
	t.Cleanup(func() { db.Close() })
	enforceForeignKeys(t, db)
	applySchema(t, db)
	return store.New(db.DB, nodeID)
}

// TestImportAppliesNewerVersion is the bug this whole mechanism exists for.
//
// The import used to be INSERT OR IGNORE, so a row already present locally was
// skipped and the local copy always won. A lesson corrected on the central
// server therefore never reached an edge server that already had it: the fix
// was silently discarded on every import, forever.
//
// Two nodes here: "edge-a" writes the lesson, "central" imports it, corrects it,
// and its correction has to land back on edge-a. Then the same import replayed
// with the stale dump must NOT undo it.
func TestImportAppliesNewerVersion(t *testing.T) {
	ctx := context.Background()
	edge := versionedStore(t, "edge-a")
	central := versionedStore(t, "central")

	course := &models.Course{Title: "Redes", Description: "DTN", Category: "Sistemas"}
	if err := edge.AddCourse(ctx, course); err != nil {
		t.Fatalf("add course: %v", err)
	}
	lesson := &models.Lesson{CourseID: course.ID, Title: "Intro", ContentText: "texto con un error"}
	if err := edge.AddLesson(ctx, lesson); err != nil {
		t.Fatalf("add lesson: %v", err)
	}

	stale, err := edge.ExportTables(ctx)
	if err != nil {
		t.Fatalf("export from edge: %v", err)
	}
	if _, err := central.ImportTables(ctx, stale); err != nil {
		t.Fatalf("import into central: %v", err)
	}

	// The professor fixes the lesson on the central server.
	if err := central.UpdateLesson(ctx, &models.Lesson{
		ID:          lesson.ID,
		CourseID:    course.ID,
		Title:       "Intro corregida",
		ContentText: "texto corregido",
	}); err != nil {
		t.Fatalf("update on central: %v", err)
	}

	corrected, err := central.ExportTables(ctx)
	if err != nil {
		t.Fatalf("export from central: %v", err)
	}
	results, err := edge.ImportTables(ctx, corrected)
	if err != nil {
		t.Fatalf("import correction into edge: %v", err)
	}
	if applied := appliedFor(results, "lessons"); applied != 1 {
		t.Fatalf("lessons: applied=%d, want 1 (the correction must overwrite)", applied)
	}

	got, err := edge.GetLesson(ctx, lesson.ID)
	if err != nil {
		t.Fatalf("read lesson back: %v", err)
	}
	if got.Title != "Intro corregida" || got.ContentText != "texto corregido" {
		t.Fatalf("the correction did not land: title=%q content=%q", got.Title, got.ContentText)
	}

	// Importing the older dump again must not resurrect the old text — this is
	// the half that keeps sync idempotent no matter in which order two nodes
	// exchange their backups.
	results, err = edge.ImportTables(ctx, stale)
	if err != nil {
		t.Fatalf("re-import stale dump: %v", err)
	}
	if applied := appliedFor(results, "lessons"); applied != 0 {
		t.Fatalf("lessons: applied=%d importing an older version, want 0", applied)
	}
	got, err = edge.GetLesson(ctx, lesson.ID)
	if err != nil {
		t.Fatalf("read lesson back: %v", err)
	}
	if got.Title != "Intro corregida" {
		t.Fatalf("an older version overwrote a newer one: %q", got.Title)
	}
}

// TestTieBreakConvergesRegardlessOfOrder pins down the only reason origin_node
// takes part in the comparison: two nodes writing at the same logical instant
// must end up with the same row, whichever one merges first. A rule that merely
// looks consistent ("keep what I have on a tie") diverges here — each node would
// keep its own value and they'd never agree again.
func TestTieBreakConvergesRegardlessOfOrder(t *testing.T) {
	ctx := context.Background()

	fromAAA := courseDump("c1", "Versión de aaa", 500, "aaa")
	fromZZZ := courseDump("c1", "Versión de zzz", 500, "zzz")

	first := versionedStore(t, "first")
	if _, err := first.ImportTables(ctx, fromAAA); err != nil {
		t.Fatalf("import aaa: %v", err)
	}
	if _, err := first.ImportTables(ctx, fromZZZ); err != nil {
		t.Fatalf("import zzz: %v", err)
	}

	second := versionedStore(t, "second")
	if _, err := second.ImportTables(ctx, fromZZZ); err != nil {
		t.Fatalf("import zzz: %v", err)
	}
	if _, err := second.ImportTables(ctx, fromAAA); err != nil {
		t.Fatalf("import aaa: %v", err)
	}

	a, err := first.GetCourse(ctx, "c1")
	if err != nil {
		t.Fatalf("read from first: %v", err)
	}
	b, err := second.GetCourse(ctx, "c1")
	if err != nil {
		t.Fatalf("read from second: %v", err)
	}
	if a.Title != b.Title {
		t.Fatalf("the nodes diverged: %q vs %q", a.Title, b.Title)
	}
	if a.Title != "Versión de zzz" {
		t.Fatalf("expected the higher origin_node to win the tie, got %q", a.Title)
	}
}

// TestUniqueCollisionElsewhereIsStillSkipped covers the documented ceiling of
// this merge, and incidentally that INSERT OR IGNORE and ON CONFLICT DO UPDATE
// really do coexist in one statement on this driver.
//
// An incoming user with a new id but an email another local user already has
// collides on users.email, not on the primary key the upsert targets. OR IGNORE
// absorbs it: the row is skipped instead of aborting the import. Resolving it
// properly needs id remapping, which nothing needs yet.
func TestUniqueCollisionElsewhereIsStillSkipped(t *testing.T) {
	ctx := context.Background()
	s := versionedStore(t, "edge-a")

	if err := s.AddUser(ctx, &models.User{
		ID: "u1", Name: "Ana", Email: "ana@radix.test", PasswordHash: "h", Role: models.RoleStudent,
	}); err != nil {
		t.Fatalf("add user: %v", err)
	}

	incoming := []models.TableDump{{Name: "users", Rows: []map[string]any{{
		"id": "u2", "name": "Ana (otro nodo)", "email": "ana@radix.test",
		"password_hash": "h", "role": "student",
		"hlc": int64(9_000_000_000_000), "origin_node": "central",
	}}}}

	results, err := s.ImportTables(ctx, incoming)
	if err != nil {
		t.Fatalf("import must not fail on a non-key unique collision: %v", err)
	}
	if applied := appliedFor(results, "users"); applied != 0 {
		t.Fatalf("users: applied=%d, want 0 (the email is taken)", applied)
	}
	if _, err := s.GetUser(ctx, "u1"); err != nil {
		t.Fatalf("the local user must survive: %v", err)
	}
}

// TestSeedClockOutlastsARewoundWallClock: an edge server has no RTC, so a
// reboot can bring the clock back. The restarted process must still stamp its
// writes above everything already stored, or the node's own new edits would lose
// to its old ones.
func TestSeedClockOutlastsARewoundWallClock(t *testing.T) {
	ctx := context.Background()
	db, err := database.Open(ctx, &config.Config{DBPath: filepath.Join(t.TempDir(), "node.db")})
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer db.Close()
	enforceForeignKeys(t, db)
	applySchema(t, db)

	// A row versioned far in the future stands in for "this node wrote while its
	// clock was ahead", which is what the wall clock alone cannot recover from.
	const future = int64(90_000_000_000_000)
	before := store.New(db.DB, "edge-a")
	if _, err := before.ImportTables(ctx, courseDump("c1", "Redes", future, "edge-a")); err != nil {
		t.Fatalf("import future row: %v", err)
	}

	// Restart: a brand-new Store over the same database, clock at zero.
	after := store.New(db.DB, "edge-a")
	if err := after.SeedClock(ctx); err != nil {
		t.Fatalf("seed clock: %v", err)
	}
	course := &models.Course{Title: "Robótica", Description: "d", Category: "c"}
	if err := after.AddCourse(ctx, course); err != nil {
		t.Fatalf("add course after restart: %v", err)
	}

	dumps, err := after.ExportTables(ctx)
	if err != nil {
		t.Fatalf("export: %v", err)
	}
	got := hlcOf(t, dumps, "courses", course.ID)
	if got <= future {
		t.Fatalf("post-restart write got version %d, not above the stored %d", got, future)
	}
}

// courseDump hand-builds a courses dump with an explicit version, standing in
// for a backup arriving from another node.
func courseDump(id, title string, hlc int64, origin string) []models.TableDump {
	return []models.TableDump{{Name: "courses", Rows: []map[string]any{{
		"id": id, "title": title, "description": "d", "category": "c",
		"hlc": hlc, "origin_node": origin,
	}}}}
}

func appliedFor(results []models.TableImport, table string) int {
	for _, res := range results {
		if res.Name == table {
			return res.Applied
		}
	}
	return -1
}

func hlcOf(t *testing.T, dumps []models.TableDump, table, id string) int64 {
	t.Helper()
	for _, dump := range dumps {
		if dump.Name != table {
			continue
		}
		for _, row := range dump.Rows {
			if row["id"] != id {
				continue
			}
			hlc, ok := row["hlc"].(int64)
			if !ok {
				t.Fatalf("hlc of %s/%s came back as %T (%v), want int64", table, id, row["hlc"], row["hlc"])
			}
			return hlc
		}
	}
	t.Fatalf("no row %s in %s", id, table)
	return 0
}
