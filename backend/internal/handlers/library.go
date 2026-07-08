package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math/rand"
	"mime"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/labstack/echo/v5"
	"radix-backend/internal/httpx"
	"radix-backend/internal/models"
	"radix-backend/internal/store"
)

type ffprobeStream struct {
	CodecType string `json:"codec_type"`
	Width     int    `json:"width"`
	Height    int    `json:"height"`
	Duration  string `json:"duration"`
}

type ffprobeFormat struct {
	Duration string `json:"duration"`
	Size     string `json:"size"`
}

type ffprobeOutput struct {
	Streams []ffprobeStream `json:"streams"`
	Format  ffprobeFormat   `json:"format"`
}

func getFileMetadata(path string) (duration, resolution string) {
	cmd := exec.Command("ffprobe", "-v", "quiet", "-print_format", "json",
		"-show_format", "-show_streams", path)
	out, err := cmd.Output()
	if err != nil {
		return "", ""
	}
	var data ffprobeOutput
	if err := json.Unmarshal(out, &data); err != nil {
		return "", ""
	}

	if d := data.Format.Duration; d != "" {
		if sec, err := strconv.ParseFloat(d, 64); err == nil {
			duration = fmt.Sprintf("%d:%02d", int(sec)/60, int(sec)%60)
		}
	}

	for _, st := range data.Streams {
		if st.CodecType == "video" && st.Width > 0 {
			resolution = fmt.Sprintf("%dx%d", st.Width, st.Height)
			if duration == "" && st.Duration != "" {
				if sec, err := strconv.ParseFloat(st.Duration, 64); err == nil {
					duration = fmt.Sprintf("%d:%02d", int(sec)/60, int(sec)%60)
				}
			}
			break
		}
	}
	return
}

func detectType(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".mp4", ".webm", ".avi", ".mkv", ".mov", ".wmv", ".flv":
		return "video"
	case ".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a", ".opus":
		return "audio"
	case ".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".bmp", ".ico":
		return "image"
	case ".pdf":
		return "pdf"
	case ".txt", ".md", ".csv", ".json", ".xml", ".yaml", ".yml", ".log", ".go", ".ts", ".js", ".py":
		return "text"
	default:
		return "document"
	}
}

func (h *Handler) GetLibrary(c *echo.Context) error {
	items, err := h.Store.GetLibraryItems(c.Request().Context())
	if err != nil {
		return httpx.InternalError(c, "failed to load library")
	}
	typeFilter := c.QueryParam("type")
	categoryFilter := c.QueryParam("category")

	if typeFilter == "" && categoryFilter == "" {
		return httpx.OK(c, http.StatusOK, items)
	}

	filtered := make([]models.LibraryItem, 0)
	for _, item := range items {
		if typeFilter != "" && item.Type != typeFilter {
			continue
		}
		if categoryFilter != "" && item.Category != categoryFilter {
			continue
		}
		filtered = append(filtered, item)
	}
	if filtered == nil {
		filtered = []models.LibraryItem{}
	}
	return httpx.OK(c, http.StatusOK, filtered)
}

func (h *Handler) GetLibraryItem(c *echo.Context) error {
	id := c.Param("id")
	item, err := h.Store.GetLibraryItem(c.Request().Context(), id)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return httpx.NotFound(c, "item not found")
		}
		return httpx.InternalError(c, "failed to load item")
	}
	return httpx.OK(c, http.StatusOK, item)
}

// GetLibraryItemUsage lists lessons that embed this item via [[id]] — computed
// live from lesson content on every call, so it's always in sync.
func (h *Handler) GetLibraryItemUsage(c *echo.Context) error {
	id := c.Param("id")
	usage, err := h.Store.GetLessonsUsingLibraryItem(c.Request().Context(), id)
	if err != nil {
		return httpx.InternalError(c, "failed to load usage")
	}
	if usage == nil {
		usage = []models.LessonUsage{}
	}
	return httpx.OK(c, http.StatusOK, usage)
}

func (h *Handler) CreateLibraryItem(c *echo.Context) error {
	ctx := c.Request().Context()
	contentType := c.Request().Header.Get("Content-Type")

	if strings.HasPrefix(contentType, "multipart/form-data") {
		return h.uploadFile(c)
	}

	var req struct {
		Title    string `json:"title"`
		Type     string `json:"type"`
		Category string `json:"category"`
	}
	if err := c.Bind(&req); err != nil {
		return httpx.BadRequest(c, "invalid request")
	}

	userID, _ := c.Get("user_id").(string)
	now := time.Now().Format(time.RFC3339)

	item := models.LibraryItem{
		Title:      req.Title,
		Type:       req.Type,
		Category:   req.Category,
		SizeKB:     rand.Intn(90000) + 1000,
		UploadedBy: userID,
		UploadedAt: now,
		ModifiedAt: now,
	}
	newID, err := h.Store.AddLibraryItem(ctx, item)
	if err != nil {
		return httpx.InternalError(c, "failed to create item")
	}
	stored, err := h.Store.GetLibraryItem(ctx, newID)
	if err != nil {
		return httpx.InternalError(c, "failed to create item")
	}
	h.Store.EnqueueSync(ctx, "ADD_LIBRARY_ITEM: "+stored.Title)
	return httpx.OK(c, http.StatusCreated, stored)
}

func (h *Handler) uploadFile(c *echo.Context) error {
	ctx := c.Request().Context()
	file, header, err := c.Request().FormFile("file")
	if err != nil {
		return httpx.BadRequest(c, "file is required")
	}
	defer file.Close()

	title := c.FormValue("title")
	category := c.FormValue("category")
	if title == "" {
		title = header.Filename
	}

	userID, _ := c.Get("user_id").(string)
	now := time.Now().Format(time.RFC3339)

	item := models.LibraryItem{
		Title:            title,
		Type:             detectType(header.Filename),
		Category:         category,
		MimeType:         header.Header.Get("Content-Type"),
		OriginalFilename: header.Filename,
		UploadedBy:       userID,
		UploadedAt:       now,
		ModifiedAt:       now,
	}

	newID, err := h.Store.AddLibraryItem(ctx, item)
	if err != nil {
		return httpx.InternalError(c, "failed to store item")
	}
	stored, err := h.Store.GetLibraryItem(ctx, newID)
	if err != nil {
		return httpx.InternalError(c, "failed to store item")
	}

	savePath := filepath.Join("uploads", fmt.Sprintf("%s_%s", newID, header.Filename))
	dst, err := os.Create(savePath)
	if err != nil {
		return httpx.InternalError(c, "failed to save file")
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		return httpx.InternalError(c, "failed to write file")
	}

	fi, _ := dst.Stat()
	if fi != nil {
		stored.SizeKB = int(fi.Size() / 1024)
	}

	duration, resolution := getFileMetadata(savePath)
	stored.Duration = duration
	stored.Resolution = resolution
	if stored.MimeType == "" {
		stored.MimeType = mime.TypeByExtension(filepath.Ext(header.Filename))
	}
	stored.FilePath = savePath

	if err := h.Store.UpdateLibraryItem(ctx, stored); err != nil {
		return httpx.InternalError(c, "failed to store item")
	}

	h.Store.EnqueueSync(ctx, "UPLOAD_FILE: "+stored.Title)
	return httpx.OK(c, http.StatusCreated, stored)
}

func (h *Handler) ServeLibraryFile(c *echo.Context) error {
	id := c.Param("id")
	item, err := h.Store.GetLibraryItem(c.Request().Context(), id)
	if err != nil {
		return httpx.NotFound(c, "item not found")
	}
	if item.FilePath == "" {
		return httpx.NotFound(c, "no file uploaded for this item")
	}

	contentType := item.MimeType
	if contentType == "" {
		contentType = mime.TypeByExtension(filepath.Ext(item.OriginalFilename))
	}
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	c.Response().Header().Set("Content-Disposition",
		fmt.Sprintf(`inline; filename="%s"`, item.OriginalFilename))

	f, err := os.Open(item.FilePath)
	if err != nil {
		return httpx.InternalError(c, "cannot open file")
	}
	defer f.Close()
	return c.Stream(http.StatusOK, contentType, f)
}

func (h *Handler) UpdateLibraryItem(c *echo.Context) error {
	ctx := c.Request().Context()
	id := c.Param("id")
	item, err := h.Store.GetLibraryItem(ctx, id)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return httpx.NotFound(c, "item not found")
		}
		return httpx.InternalError(c, "failed to load item")
	}
	var req struct {
		Title    *string `json:"title"`
		Category *string `json:"category"`
	}
	if err := c.Bind(&req); err != nil {
		return httpx.BadRequest(c, "invalid request")
	}
	if req.Title != nil {
		item.Title = *req.Title
	}
	if req.Category != nil {
		item.Category = *req.Category
	}
	if err := h.Store.UpdateLibraryItem(ctx, item); err != nil {
		return httpx.InternalError(c, "failed to update item")
	}
	h.Store.EnqueueSync(ctx, "UPDATE_LIBRARY_ITEM: "+id)
	return httpx.OK(c, http.StatusOK, item)
}
