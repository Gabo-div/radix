package store_test

import (
	"context"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"

	"radix-backend/internal/config"
	"radix-backend/internal/database"
	"radix-backend/internal/models"
	"radix-backend/internal/store"
)

// TestBackupRoundTrip is the check behind the generic export/import: dump a
// populated database, wipe it by importing an empty-ish backup, then restore
// the original dump and require the rows to come back byte-for-byte (values
// included, so a broken type conversion or a mis-bound placeholder fails here).
func TestBackupRoundTrip(t *testing.T) {
	ctx := context.Background()
	db, err := database.Open(ctx, &config.Config{DBPath: filepath.Join(t.TempDir(), "test.db")})
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer db.Close()
	enforceForeignKeys(t, db)

	// The schema comes from schema.sql, not database.Migrate: the local-only
	// tursogo driver can't replay 00003's DROP COLUMN, and schema.sql is
	// already the maintained flat snapshot of the same schema (it's what sqlc
	// generates against).
	schema, err := os.ReadFile(filepath.Join("..", "database", "schema.sql"))
	if err != nil {
		t.Fatalf("read schema: %v", err)
	}
	for _, stmt := range strings.Split(string(schema), ";") {
		if strings.TrimSpace(stmt) == "" {
			continue
		}
		// tursogo has no fts5 module; server_logs_fts is excluded from the
		// backup anyway (it's rebuilt from server_logs by triggers).
		if strings.Contains(stmt, "VIRTUAL TABLE") {
			continue
		}
		if _, err := db.ExecContext(ctx, stmt); err != nil {
			t.Fatalf("exec schema stmt %q: %v", strings.TrimSpace(stmt), err)
		}
	}

	s := store.New(db.DB)
	if err := s.AddUser(ctx, &models.User{ID: "u1", Name: "Ana", Email: "ana@radix.test", PasswordHash: "hash", Role: models.RoleStudent}); err != nil {
		t.Fatalf("add user: %v", err)
	}
	course := &models.Course{Title: "Redes", Description: "DTN", Category: "Sistemas"}
	if err := s.AddCourse(ctx, course); err != nil {
		t.Fatalf("add course: %v", err)
	}
	lesson := &models.Lesson{CourseID: course.ID, Title: "Intro", ContentText: "hola [[x]]"}
	if err := s.AddLesson(ctx, lesson); err != nil {
		t.Fatalf("add lesson: %v", err)
	}
	if err := s.EnqueueSync(ctx, "TEST"); err != nil {
		t.Fatalf("enqueue sync: %v", err)
	}

	before, err := s.ExportTables(ctx)
	if err != nil {
		t.Fatalf("export: %v", err)
	}
	rowsIn := countRows(before)
	if rowsIn["users"] != 1 || rowsIn["courses"] != 1 || rowsIn["lessons"] != 1 {
		t.Fatalf("unexpected export counts: %v", rowsIn)
	}
	// Operational tables are per-node and must stay out of the backup.
	for _, table := range []string{"sync_log", "server_logs"} {
		if _, ok := rowsIn[table]; ok {
			t.Fatalf("%s must not be exported", table)
		}
	}

	// Re-importing the same backup is a no-op: everything collides, nothing is
	// inserted, and no row is duplicated.
	results, err := s.ImportTables(ctx, before)
	if err != nil {
		t.Fatalf("re-import: %v", err)
	}
	for _, res := range results {
		if res.Inserted != 0 || res.Skipped != len(rowsByTable(before)[res.Name]) {
			t.Fatalf("re-import of %s: inserted=%d skipped=%d, want all skipped", res.Name, res.Inserted, res.Skipped)
		}
	}
	after, err := s.ExportTables(ctx)
	if err != nil {
		t.Fatalf("export after re-import: %v", err)
	}
	if !reflect.DeepEqual(rowsByTable(before), rowsByTable(after)) {
		t.Fatalf("re-import changed the data:\nbefore=%v\nafter=%v", rowsByTable(before), rowsByTable(after))
	}

	// A backup carrying one new row merges it in, leaving the colliding ones
	// untouched — and the new row's values survive the round-trip intact.
	incoming := append([]models.TableDump(nil), before...)
	for i, dump := range incoming {
		if dump.Name != "courses" {
			continue
		}
		newCourse := map[string]any{"id": "c-nuevo", "title": "Robótica", "description": "Brazo", "category": "Robótica"}
		incoming[i] = models.TableDump{Name: "courses", Rows: append([]map[string]any{newCourse}, dump.Rows...)}
	}
	results, err = s.ImportTables(ctx, incoming)
	if err != nil {
		t.Fatalf("merge import: %v", err)
	}
	for _, res := range results {
		want := 0
		if res.Name == "courses" {
			want = 1
		}
		if res.Inserted != want {
			t.Fatalf("merge import of %s: inserted=%d, want %d", res.Name, res.Inserted, want)
		}
	}
	merged, err := s.ExportTables(ctx)
	if err != nil {
		t.Fatalf("export after merge: %v", err)
	}
	courses := rowsByTable(merged)["courses"]
	if len(courses) != 2 {
		t.Fatalf("expected 2 courses after merge, got %d", len(courses))
	}
	var found map[string]any
	for _, row := range courses {
		if row["id"] == "c-nuevo" {
			found = row
		}
	}
	if found == nil || found["title"] != "Robótica" || found["category"] != "Robótica" {
		t.Fatalf("merged course came back wrong: %v", found)
	}
}

// TestImportOrdersByForeignKeys reproduces the shape a migrated database
// really has: 00006_decouple_quizzes rebuilds `quizzes` with the SQLite
// DROP + RENAME dance, which moves it to the end of sqlite_master — after
// `quiz_questions`, the table that references it. Importing in creation order
// then fails with "FOREIGN KEY constraint failed", so the import must derive
// its order from the foreign keys instead.
func TestImportOrdersByForeignKeys(t *testing.T) {
	ctx := context.Background()
	db, err := database.Open(ctx, &config.Config{DBPath: filepath.Join(t.TempDir(), "test.db")})
	if err != nil {
		t.Fatalf("open db: %v", err)
	}
	defer db.Close()
	enforceForeignKeys(t, db)

	// Child created first, parent last — exactly the inverted order a rebuild
	// leaves behind.
	stmts := []string{
		`CREATE TABLE courses (id TEXT PRIMARY KEY, title TEXT NOT NULL)`,
		`CREATE TABLE quiz_questions (
			id TEXT PRIMARY KEY,
			quiz_id TEXT NOT NULL REFERENCES quizzes(id),
			text TEXT NOT NULL
		)`,
		`CREATE TABLE quizzes (
			id TEXT PRIMARY KEY,
			course_id TEXT NOT NULL REFERENCES courses(id),
			title TEXT NOT NULL
		)`,
	}
	for _, stmt := range stmts {
		if _, err := db.ExecContext(ctx, stmt); err != nil {
			t.Fatalf("exec %q: %v", stmt, err)
		}
	}

	s := store.New(db.DB)
	dumps := []models.TableDump{
		{Name: "quiz_questions", Rows: []map[string]any{
			{"id": "q1", "quiz_id": "qz1", "text": "¿Cuál es la capa de red?"},
		}},
		{Name: "quizzes", Rows: []map[string]any{
			{"id": "qz1", "course_id": "c1", "title": "Control"},
		}},
		{Name: "courses", Rows: []map[string]any{
			{"id": "c1", "title": "Redes"},
		}},
	}

	results, err := s.ImportTables(ctx, dumps)
	if err != nil {
		t.Fatalf("import: %v", err)
	}
	for _, res := range results {
		if res.Inserted != 1 {
			t.Errorf("%s: inserted=%d, want 1", res.Name, res.Inserted)
		}
	}

	// Y el orden debe ser padres primero, sin importar el de creación.
	after, err := s.ExportTables(ctx)
	if err != nil {
		t.Fatalf("export: %v", err)
	}
	var order []string
	for _, dump := range after {
		order = append(order, dump.Name)
	}
	position := func(name string) int {
		for i, n := range order {
			if n == name {
				return i
			}
		}
		t.Fatalf("%s ausente de %v", name, order)
		return -1
	}
	if position("courses") > position("quizzes") || position("quizzes") > position("quiz_questions") {
		t.Errorf("orden incorrecto: %v", order)
	}
}

// enforceForeignKeys turns on FK enforcement for the test connection. Without
// it these tests prove almost nothing about a real deployment: the local-only
// tursogo driver opens with `foreign_keys = 0`, while the remote sqld the app
// actually runs against enforces them — which is how an import ordered wrongly
// passed every test and still failed in production. The local driver caps the
// pool at one connection, so this PRAGMA sticks for the whole test.
func enforceForeignKeys(t *testing.T, db *database.DB) {
	t.Helper()
	if _, err := db.ExecContext(context.Background(), "PRAGMA foreign_keys = ON"); err != nil {
		t.Fatalf("activar foreign_keys: %v", err)
	}
	var on int
	if err := db.QueryRowContext(context.Background(), "PRAGMA foreign_keys").Scan(&on); err != nil {
		t.Fatalf("leer foreign_keys: %v", err)
	}
	if on != 1 {
		t.Fatal("foreign_keys sigue desactivado: el test no probaría las claves foráneas")
	}
}

func countRows(dumps []models.TableDump) map[string]int {
	out := map[string]int{}
	for _, dump := range dumps {
		out[dump.Name] = len(dump.Rows)
	}
	return out
}

func rowsByTable(dumps []models.TableDump) map[string][]map[string]any {
	out := map[string][]map[string]any{}
	for _, dump := range dumps {
		out[dump.Name] = dump.Rows
	}
	return out
}
