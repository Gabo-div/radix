// Command seed populates the database with initial demo data.
// Run manually: go run ./cmd/seed
package main

import (
	"context"
	"log"

	"radix-backend/internal/config"
	"radix-backend/internal/database"
	"radix-backend/internal/seed"
	"radix-backend/internal/store"
)

func main() {
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

	s := store.New(db.DB)

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
