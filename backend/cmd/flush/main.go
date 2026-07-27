// Command flush empties the database: every row of every table goes, the
// schema and the applied-migration record stay. Useful to get back to a clean
// slate before `go run ./cmd/seed` or before importing a backup.
//
//	go run ./cmd/flush                 # asks for confirmation
//	go run ./cmd/flush -yes            # no prompt
//	go run ./cmd/flush -yes -uploads   # also deletes the uploaded files
//
// It talks to whatever database .env points at, which in remote mode is the
// same sqld the server uses — flushing while the server is running leaves its
// in-memory sessions pointing at users that no longer exist, so restart it
// afterwards.
package main

import (
	"bufio"
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"radix-backend/internal/config"
	"radix-backend/internal/database"
	"radix-backend/internal/store"
)

// uploadsDir mirrors where the library stores uploaded files (see
// handlers.uploadsDir) — relative to the process's working directory, so this
// command has to be run from backend/ just like the server.
const uploadsDir = "uploads"

func main() {
	assumeYes := flag.Bool("yes", false, "no pedir confirmación")
	alsoUploads := flag.Bool("uploads", false, "borrar también los archivos de "+uploadsDir+"/")
	flag.Parse()

	ctx := context.Background()
	cfg := config.Load()

	target := cfg.TursoURL
	if target == "" {
		target = cfg.DBPath + " (modo local)"
	}
	if !*assumeYes && !confirm(target, *alsoUploads) {
		log.Println("cancelado, no se borró nada")
		return
	}

	db, err := database.Open(ctx, cfg)
	if err != nil {
		log.Fatalf("open database: %v", err)
	}
	defer db.Close()

	// Migrations run first so the schema exists (and matches) even on a
	// database that was never started by the server.
	if err := database.Migrate(ctx, db.DB); err != nil {
		log.Fatalf("run migrations: %v", err)
	}

	deleted, err := store.New(db.DB, cfg.NodeID).ClearTables(ctx)
	if err != nil {
		log.Fatalf("flush database: %v", err)
	}

	tables := make([]string, 0, len(deleted))
	for table := range deleted {
		tables = append(tables, table)
	}
	sort.Strings(tables)

	var total int64
	for _, table := range tables {
		if deleted[table] > 0 {
			fmt.Printf("  %-24s %6d\n", table, deleted[table])
		}
		total += deleted[table]
	}
	fmt.Printf("  %-24s %6d\n", "TOTAL filas", total)

	if *alsoUploads {
		removed, err := clearUploads()
		if err != nil {
			log.Fatalf("borrar %s/: %v", uploadsDir, err)
		}
		fmt.Printf("  %-24s %6d\n", "archivos borrados", removed)
	} else {
		fmt.Printf("  %s/ intacto (usar -uploads para borrarlo)\n", uploadsDir)
	}

	// Sessions live in memory, not in the DB, and are snapshotted to this file
	// on shutdown. Dropping it keeps a restarted server from restoring tokens
	// for users that were just deleted.
	sessions := filepath.Join(filepath.Dir(cfg.DBPath), "sessions.json")
	if err := os.Remove(sessions); err == nil {
		fmt.Printf("  %s eliminado\n", sessions)
	} else if !os.IsNotExist(err) {
		log.Printf("aviso: no se pudo eliminar %s: %v", sessions, err)
	}

	log.Println("listo — reiniciá el servidor si estaba corriendo")
}

// confirm requires the word BORRAR typed in full: a y/n prompt is too easy to
// answer on autopilot for something that deletes every row.
func confirm(target string, alsoUploads bool) bool {
	fmt.Printf("Se van a borrar TODAS las filas de: %s\n", target)
	if alsoUploads {
		fmt.Printf("También se borrarán los archivos de %s/\n", uploadsDir)
	}
	fmt.Print("Esto no se puede deshacer. Escribí BORRAR para continuar: ")

	line, err := bufio.NewReader(os.Stdin).ReadString('\n')
	if err != nil {
		return false
	}
	return strings.TrimSpace(line) == "BORRAR"
}

func clearUploads() (int, error) {
	entries, err := os.ReadDir(uploadsDir)
	if err != nil {
		if os.IsNotExist(err) {
			return 0, nil
		}
		return 0, err
	}
	removed := 0
	for _, entry := range entries {
		if entry.IsDir() {
			continue // nothing nested there today; don't recurse blindly
		}
		if err := os.Remove(filepath.Join(uploadsDir, entry.Name())); err != nil {
			return removed, err
		}
		removed++
	}
	return removed, nil
}
