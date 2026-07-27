package handlers

import (
	"archive/zip"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/labstack/echo/v5"
	"radix-backend/internal/backupzip"
	"radix-backend/internal/httpx"
)

// The archive layout, and the code that reads it back, live in
// internal/backupzip — `cmd/seed -zip` imports a backup with no server running
// and needs the same parser.

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
	uploads, err := os.ReadDir(backupzip.UploadsDir)
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

	if err := writeJSONEntry(zw, backupzip.ManifestName, manifest); err != nil {
		return err
	}
	for _, dump := range dumps {
		if err := writeJSONEntry(zw, backupzip.DataDir+dump.Name+".json", dump.Rows); err != nil {
			return err
		}
	}
	for _, entry := range uploads {
		if entry.IsDir() {
			continue
		}
		if err := writeFileEntry(zw, backupzip.UploadsPrefix+entry.Name(), filepath.Join(backupzip.UploadsDir, entry.Name())); err != nil {
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

	dumps, err := backupzip.ReadDumps(zr)
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
	restored, err := backupzip.RestoreUploads(zr, backupzip.UploadsDir)
	if err != nil {
		return httpx.InternalError(c, "database imported but restoring uploads failed: "+err.Error())
	}

	return httpx.OK(c, http.StatusOK, map[string]any{
		"tables":  tables,
		"uploads": restored,
	})
}
