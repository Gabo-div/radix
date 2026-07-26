package handlers

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"

	"github.com/labstack/echo/v5"
	"radix-backend/internal/httpx"
	"radix-backend/internal/models"
)

// Backup layout inside the zip (also the layout of the extracted folder, so a
// backup can be inspected/edited by hand before being imported back):
//
//	manifest.json      metadata + row counts per table
//	data/<table>.json  every row of that table, as an array of objects
//	uploads/<file>     the library's uploaded files (library_items.file_path)
const (
	backupDataDir    = "data/"
	backupUploadsDir = "uploads/"

	// uploadsDir is where uploadFile stores library files on disk.
	uploadsDir = "uploads"
)

type backupManifest struct {
	ExportedAt string         `json:"exportedAt"`
	Tables     map[string]int `json:"tables"`
	Uploads    int            `json:"uploads"`
}

// ExportBackup streams a zip of the whole database plus the uploaded files.
// It is written straight to the response (no buffering) because the uploads
// folder holds videos and can be far bigger than the row data.
func (h *Handler) ExportBackup(c *echo.Context) error {
	ctx := c.Request().Context()

	dumps, err := h.Store.ExportTables(ctx)
	if err != nil {
		return httpx.InternalError(c, "failed to export database")
	}
	uploads, err := os.ReadDir(uploadsDir)
	if err != nil && !os.IsNotExist(err) {
		return httpx.InternalError(c, "failed to read uploads folder")
	}

	manifest := backupManifest{ExportedAt: time.Now().Format(time.RFC3339), Tables: map[string]int{}}
	for _, dump := range dumps {
		manifest.Tables[dump.Name] = len(dump.Rows)
	}
	for _, entry := range uploads {
		if !entry.IsDir() {
			manifest.Uploads++
		}
	}

	filename := "radix-backup-" + time.Now().Format("20060102-150405") + ".zip"
	c.Response().Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	c.Response().Header().Set(echo.HeaderContentType, "application/zip")
	c.Response().WriteHeader(http.StatusOK)

	// Past this point the status line is already sent, so a failure can only
	// be reported by truncating the zip (the client's unzip then fails) — a
	// half-written backup must never look like a complete one.
	zw := zip.NewWriter(c.Response())

	if err := writeJSONEntry(zw, "manifest.json", manifest); err != nil {
		return err
	}
	for _, dump := range dumps {
		if err := writeJSONEntry(zw, backupDataDir+dump.Name+".json", dump.Rows); err != nil {
			return err
		}
	}
	for _, entry := range uploads {
		if entry.IsDir() {
			continue
		}
		if err := writeFileEntry(zw, backupUploadsDir+entry.Name(), filepath.Join(uploadsDir, entry.Name())); err != nil {
			return err
		}
	}
	return zw.Close()
}

func writeJSONEntry(zw *zip.Writer, name string, payload any) error {
	w, err := zw.Create(name)
	if err != nil {
		return err
	}
	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ") // the dump is meant to be readable/editable by hand
	return enc.Encode(payload)
}

func writeFileEntry(zw *zip.Writer, name, srcPath string) error {
	src, err := os.Open(srcPath)
	if err != nil {
		return err
	}
	defer src.Close()
	w, err := zw.Create(name)
	if err != nil {
		return err
	}
	_, err = io.Copy(w, src)
	return err
}

// ImportBackup merges an uploaded backup zip into the current database and
// restores its files. Nothing is deleted: rows that collide with existing ones
// are skipped (see store.ImportTables), and the whole merge is one transaction,
// so a bad zip leaves the database untouched.
func (h *Handler) ImportBackup(c *echo.Context) error {
	ctx := c.Request().Context()

	file, header, err := c.Request().FormFile("file")
	if err != nil {
		return httpx.BadRequest(c, "file is required")
	}
	defer file.Close()

	zr, err := zip.NewReader(file, header.Size)
	if err != nil {
		return httpx.BadRequest(c, "not a valid zip file")
	}

	dumps, err := readDumps(zr)
	if err != nil {
		return httpx.BadRequest(c, err.Error())
	}
	if len(dumps) == 0 {
		return httpx.BadRequest(c, "backup contains no data/*.json files")
	}

	tables, err := h.Store.ImportTables(ctx, dumps)
	if err != nil {
		return httpx.BadRequest(c, "failed to import database: "+err.Error())
	}

	// Files come after the DB: the transaction above is the part that must be
	// all-or-nothing. A file whose name is already there is overwritten (same
	// name means the same library item id, so it's the same file), and nothing
	// is ever deleted.
	restored, err := restoreUploads(zr)
	if err != nil {
		return httpx.InternalError(c, "database imported but restoring uploads failed: "+err.Error())
	}

	h.Store.EnqueueSync(ctx, "IMPORT_BACKUP: "+header.Filename)

	return httpx.OK(c, http.StatusOK, map[string]any{
		"tables":  tables,
		"uploads": restored,
	})
}

func readDumps(zr *zip.Reader) ([]models.TableDump, error) {
	var dumps []models.TableDump
	for _, entry := range zr.File {
		name := path.Clean(entry.Name)
		if !strings.HasPrefix(name, backupDataDir) || !strings.HasSuffix(name, ".json") {
			continue
		}
		table := strings.TrimSuffix(strings.TrimPrefix(name, backupDataDir), ".json")
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

func restoreUploads(zr *zip.Reader) (int, error) {
	count := 0
	for _, entry := range zr.File {
		if entry.FileInfo().IsDir() || !strings.HasPrefix(path.Clean(entry.Name), backupUploadsDir) {
			continue
		}
		// filepath.Base defuses "uploads/../../etc/passwd" style entries.
		name := filepath.Base(entry.Name)
		if name == "." || name == string(filepath.Separator) {
			continue
		}
		if err := os.MkdirAll(uploadsDir, 0o755); err != nil {
			return count, err
		}
		if err := extractTo(entry, filepath.Join(uploadsDir, name)); err != nil {
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
