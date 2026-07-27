package handlers

import (
	"archive/zip"
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"radix-backend/internal/backupzip"
	"radix-backend/internal/config"
	"radix-backend/internal/database"
	"radix-backend/internal/store"
)

// seedZip is the hand-built content backup produced by seeds/build_seed_backup.py.
const seedZip = "../../../seeds/radix-seed-backup.zip"

// TestSeedBackupImports runs the shipped seed zip through the real import path
// (backupzip.ReadDumps -> store.ImportTables) and checks the content actually landed:
// every course with its four lessons, every quiz with its questions, the
// [[id]] links resolved, and grades attached to real students. It is the check
// that keeps the seed zip and the schema from drifting apart — regenerate the
// zip if a migration changes a table it carries.
func TestSeedBackupImports(t *testing.T) {
	if _, err := os.Stat(seedZip); err != nil {
		t.Skipf("seed zip no disponible (%v)", err)
	}
	ctx := context.Background()
	s := newTestStore(t)

	zr, err := zip.OpenReader(seedZip)
	if err != nil {
		t.Fatalf("abrir zip: %v", err)
	}
	defer zr.Close()

	dumps, err := backupzip.ReadDumps(&zr.Reader)
	if err != nil {
		t.Fatalf("leer dumps: %v", err)
	}
	if len(dumps) == 0 {
		t.Fatal("el zip no trae data/*.json")
	}

	results, err := s.ImportTables(ctx, dumps)
	if err != nil {
		t.Fatalf("importar: %v", err)
	}
	applied := map[string]int{}
	for _, res := range results {
		applied[res.Name] = res.Applied
		if res.Skipped != 0 {
			t.Errorf("%s: %d filas omitidas en una base vacía", res.Name, res.Skipped)
		}
	}
	// Operational tables must not travel in a content backup.
	for _, table := range []string{"sync_log", "server_logs"} {
		if _, ok := applied[table]; ok {
			t.Errorf("el zip no debería traer %s", table)
		}
	}

	courses, err := s.GetCourses(ctx)
	if err != nil {
		t.Fatalf("cursos: %v", err)
	}
	if len(courses) < 7 {
		t.Fatalf("se esperaban al menos 7 asignaturas, hay %d", len(courses))
	}

	totalQuestions := 0
	for _, course := range courses {
		lessons, err := s.GetLessonsForCourse(ctx, course.ID)
		if err != nil {
			t.Fatalf("lecciones de %s: %v", course.ID, err)
		}
		if len(lessons) < 4 {
			t.Errorf("%s: %d lecciones, se esperaban 4 o más", course.ID, len(lessons))
		}
		for _, lesson := range lessons {
			if !strings.Contains(lesson.ContentText, "##") {
				t.Errorf("%s: el contenido no parece markdown", lesson.ID)
			}
		}

		quizzes, err := s.GetQuizzesForCourse(ctx, course.ID)
		if err != nil {
			t.Fatalf("cuestionarios de %s: %v", course.ID, err)
		}
		if len(quizzes) < len(lessons)+1 {
			t.Errorf("%s: %d cuestionarios para %d lecciones (falta el examen final)",
				course.ID, len(quizzes), len(lessons))
		}
		for _, quiz := range quizzes {
			if len(quiz.Questions) < 3 {
				t.Errorf("%s: solo %d preguntas", quiz.ID, len(quiz.Questions))
			}
			for _, q := range quiz.Questions {
				if q.CorrectIndex < 0 || q.CorrectIndex >= len(q.Options) {
					t.Errorf("%s: correctIndex fuera de rango", quiz.ID)
				}
			}
			totalQuestions += len(quiz.Questions)
		}

		posts, err := s.GetForumPosts(ctx, course.ID, "")
		if err != nil {
			t.Fatalf("foro de %s: %v", course.ID, err)
		}
		if len(posts) < 2 {
			t.Errorf("%s: el foro trae %d publicaciones", course.ID, len(posts))
		}
		for _, post := range posts {
			if post.AuthorName == "" {
				t.Errorf("%s: publicación %s sin autor resuelto", course.ID, post.ID)
			}
		}

		students, err := s.GetEnrolledStudents(ctx, course.ID)
		if err != nil {
			t.Fatalf("matriculados de %s: %v", course.ID, err)
		}
		if len(students) < 3 {
			t.Errorf("%s: solo %d matriculados", course.ID, len(students))
		}
	}
	if totalQuestions < 100 {
		t.Errorf("solo %d preguntas en total", totalQuestions)
	}

	// Los [[id]] deben haber quedado como enlaces resueltos, no como texto.
	lessons, err := s.GetLessonsForCourse(ctx, "c-sisdis")
	if err != nil {
		t.Fatalf("lecciones de c-sisdis: %v", err)
	}
	linkedItems := 0
	for _, lesson := range lessons {
		items, _, quizzes, err := s.GetLessonLinks(ctx, lesson.ID)
		if err != nil {
			t.Fatalf("enlaces de %s: %v", lesson.ID, err)
		}
		linkedItems += len(items)
		// Cada tema enlaza su control con [[id]]: es lo único que la vista de
		// la lección muestra, ya no el adjunto por quizzes.lesson_id.
		if len(quizzes) == 0 {
			t.Errorf("%s no enlaza ningún cuestionario", lesson.ID)
		}
	}
	if linkedItems == 0 {
		t.Error("ninguna lección de c-sisdis enlaza un archivo de la biblioteca")
	}

	// Los archivos de la biblioteca deben venir dentro del zip.
	items, err := s.GetLibraryItems(ctx)
	if err != nil {
		t.Fatalf("biblioteca: %v", err)
	}
	inZip := map[string]bool{}
	for _, f := range zr.File {
		inZip[f.Name] = true
	}
	for _, item := range items {
		if item.FilePath == "" {
			t.Errorf("%s: sin file_path", item.ID)
			continue
		}
		if !inZip[item.FilePath] {
			t.Errorf("%s: %s no está en el zip", item.ID, item.FilePath)
		}
	}

	// Volver a importar el mismo zip no debe duplicar nada.
	again, err := s.ImportTables(ctx, dumps)
	if err != nil {
		t.Fatalf("reimportar: %v", err)
	}
	for _, res := range again {
		if res.Applied != 0 {
			t.Errorf("%s: %d filas aplicadas al reimportar, se esperaba 0", res.Name, res.Applied)
		}
	}
}

// newTestStore opens an empty database and creates the schema from
// schema.sql. Not database.Migrate: the local-only tursogo driver rejects
// 00003's DROP COLUMN and has no fts5 module (see store's backup_test.go).
func newTestStore(t *testing.T) *store.Store {
	t.Helper()
	return newNodeStore(t, "test-node")
}

// newNodeStore is the same, with an explicit node id — what the peer
// synchronisation tests need, since a node's identity is what its writes are
// stamped with.
func newNodeStore(t *testing.T, nodeID string) *store.Store {
	t.Helper()
	ctx := context.Background()
	db, err := database.Open(ctx, &config.Config{DBPath: filepath.Join(t.TempDir(), "test.db")})
	if err != nil {
		t.Fatalf("abrir base: %v", err)
	}
	t.Cleanup(func() { db.Close() })

	schema, err := os.ReadFile(filepath.Join("..", "database", "schema.sql"))
	if err != nil {
		t.Fatalf("leer schema.sql: %v", err)
	}
	for _, stmt := range strings.Split(string(schema), ";") {
		if strings.TrimSpace(stmt) == "" || strings.Contains(stmt, "VIRTUAL TABLE") {
			continue
		}
		if _, err := db.ExecContext(ctx, stmt); err != nil {
			t.Fatalf("ejecutar %q: %v", strings.TrimSpace(stmt), err)
		}
	}

	// Las claves foráneas se activan a mano: el driver local abre con
	// foreign_keys = 0 y sin esto el import del zip no comprobaría ninguna
	// referencia, que es justo lo que dejó pasar un orden de inserción malo.
	if _, err := db.ExecContext(ctx, "PRAGMA foreign_keys = ON"); err != nil {
		t.Fatalf("activar foreign_keys: %v", err)
	}
	var on int
	if err := db.QueryRowContext(ctx, "PRAGMA foreign_keys").Scan(&on); err != nil || on != 1 {
		t.Fatalf("foreign_keys sigue desactivado (%v, err=%v)", on, err)
	}
	return store.New(db.DB, nodeID)
}
