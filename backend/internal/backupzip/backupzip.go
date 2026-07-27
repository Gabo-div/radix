// Package backupzip reads the content-backup archive.
//
// The layout is the same whether it's a zip or an extracted folder, so a dump
// can be inspected and edited by hand before being imported back:
//
//	manifest.json      metadata + row counts per table
//	data/<table>.json  every row of that table, as an array of objects
//	uploads/<file>     the library's uploaded files (library_items.file_path)
//
// It lives apart from the handlers because two entry points need it: the admin
// import endpoint, and `cmd/seed -zip`, which loads a backup straight into the
// database with no server running (that's how a container starts up with the
// seed content already in place).
package backupzip

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"path"
	"path/filepath"
	"strings"

	"radix-backend/internal/models"
)

const (
	DataDir       = "data/"
	UploadsPrefix = "uploads/"
	ManifestName  = "manifest.json"

	// UploadsDir is where library files live on disk, relative to the working
	// directory. Single definition on purpose: the upload handler writes here,
	// a backup import restores here, and peer synchronisation downloads here —
	// and the path travels inside sync payloads, so every node has to resolve
	// the same stored string the same way.
	UploadsDir = "uploads"
)

// ReadDumps parses every data/<table>.json in the archive.
func ReadDumps(zr *zip.Reader) ([]models.TableDump, error) {
	var dumps []models.TableDump
	for _, entry := range zr.File {
		name := path.Clean(entry.Name)
		if !strings.HasPrefix(name, DataDir) || !strings.HasSuffix(name, ".json") {
			continue
		}
		table := strings.TrimSuffix(strings.TrimPrefix(name, DataDir), ".json")
		if table == "" || strings.Contains(table, "/") {
			continue
		}
		rc, err := entry.Open()
		if err != nil {
			return nil, err
		}
		var rows []map[string]any
		dec := json.NewDecoder(rc)
		// Numbers stay exact (server_logs.id, quiz_questions.correct_index)
		// instead of round-tripping through float64.
		dec.UseNumber()
		err = dec.Decode(&rows)
		rc.Close()
		if err != nil {
			return nil, fmt.Errorf("invalid JSON in %s: %w", entry.Name, err)
		}
		for _, row := range rows {
			for col, val := range row {
				row[col] = normalizeJSONValue(val)
			}
		}
		dumps = append(dumps, models.TableDump{Name: table, Rows: rows})
	}
	return dumps, nil
}

// normalizeJSONValue turns a decoded JSON value into something database/sql
// can bind: json.Number is neither int64 nor float64, and would otherwise be
// bound as text and rely on column affinity to become a number again.
func normalizeJSONValue(val any) any {
	num, ok := val.(json.Number)
	if !ok {
		return val
	}
	if i, err := num.Int64(); err == nil {
		return i
	}
	if f, err := num.Float64(); err == nil {
		return f
	}
	return num.String()
}

// RestoreUploads extracts the archive's files into dir, overwriting by name (the
// name carries the library item's id, so the same name is the same file) and
// deleting nothing.
func RestoreUploads(zr *zip.Reader, dir string) (int, error) {
	count := 0
	for _, entry := range zr.File {
		if entry.FileInfo().IsDir() || !strings.HasPrefix(path.Clean(entry.Name), UploadsPrefix) {
			continue
		}
		// filepath.Base defuses "uploads/../../etc/passwd" style entries.
		name := filepath.Base(entry.Name)
		if name == "." || name == string(filepath.Separator) {
			continue
		}
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return count, err
		}
		if err := extractTo(entry, filepath.Join(dir, name)); err != nil {
			return count, err
		}
		count++
	}
	return count, nil
}

func extractTo(entry *zip.File, dstPath string) error {
	rc, err := entry.Open()
	if err != nil {
		return err
	}
	defer rc.Close()
	dst, err := os.Create(dstPath)
	if err != nil {
		return err
	}
	defer dst.Close()
	_, err = io.Copy(dst, rc)
	return err
}
