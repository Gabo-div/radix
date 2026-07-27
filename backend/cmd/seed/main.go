// Command seed populates the database with initial content.
//
//	go run ./cmd/seed                          # the small built-in demo dataset
//	go run ./cmd/seed -zip ../seeds/backup.zip # a content backup, no server needed
//
// The -zip form is what lets a container come up already populated: it goes
// straight through store.ImportTables, with no HTTP request, no admin login and
// no running server to wait for.
package main

import (
	"archive/zip"
	"context"
	"flag"
	"log"

	"radix-backend/internal/backupzip"
	"radix-backend/internal/config"
	"radix-backend/internal/database"
	"radix-backend/internal/seed"
	"radix-backend/internal/store"
)

func main() {
	zipPath := flag.String("zip", "", "import this content backup instead of the built-in demo data")
	flag.Parse()

	ctx := context.Background()
	cfg := config.Load()

	db, err := database.Open(ctx, cfg)
	if err != nil {
		log.Fatalf("open database: %v", err)
	}
	defer db.Close()

	if err := database.Migrate(ctx, db.DB); err != nil {
		log.Fatalf("run migrations: %v", err)
	}

	s := store.New(db.DB, cfg.NodeID)
	if err := s.SeedClock(ctx); err != nil {
		log.Fatalf("seed the logical clock: %v", err)
	}

	if *zipPath != "" {
		if err := importZip(ctx, s, *zipPath); err != nil {
			log.Fatalf("import %s: %v", *zipPath, err)
		}
		return
	}

	courses, err := s.GetCourses(ctx)
	if err != nil {
		log.Fatalf("check seed state: %v", err)
	}
	if len(courses) > 0 {
		log.Println("database already has data, skipping seed")
		return
	}

	if err := seed.Data(ctx, s); err != nil {
		log.Fatalf("seed database: %v", err)
	}
	log.Println("seed complete")
}

// importZip merges a content backup. No emptiness guard: the merge is by row
// version and skips anything the database already has, so running this on every
// container start is a no-op after the first.
func importZip(ctx context.Context, s *store.Store, path string) error {
	zr, err := zip.OpenReader(path)
	if err != nil {
		return err
	}
	defer zr.Close()

	dumps, err := backupzip.ReadDumps(&zr.Reader)
	if err != nil {
		return err
	}
	if len(dumps) == 0 {
		log.Printf("%s has no data/*.json, nothing to import", path)
		return nil
	}

	results, err := s.ImportTables(ctx, dumps)
	if err != nil {
		return err
	}
	applied, skipped := 0, 0
	for _, result := range results {
		applied += result.Applied
		skipped += result.Skipped
	}

	files, err := backupzip.RestoreUploads(&zr.Reader, backupzip.UploadsDir)
	if err != nil {
		return err
	}
	log.Printf("imported %s: %d rows applied, %d already present, %d files", path, applied, skipped, files)
	return nil
}
