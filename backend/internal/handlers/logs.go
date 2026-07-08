package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/labstack/echo/v5"
	"radix-backend/internal/httpx"
	"radix-backend/internal/models"
)

func (h *Handler) GetLogs(c *echo.Context) error {
	lines := h.LogBuffer.Lines()
	if lines == nil {
		lines = []string{}
	}
	return httpx.OK(c, http.StatusOK, lines)
}

// SearchLogs is the durable, filterable counterpart to GetLogs' in-memory
// tail — backed by server_logs (see store.ListServerLogs).
func (h *Handler) SearchLogs(c *echo.Context) error {
	ctx := c.Request().Context()
	filter := models.ServerLogFilter{
		Level: c.QueryParam("level"),
		From:  c.QueryParam("from"),
		To:    c.QueryParam("to"),
	}

	limit := 50
	if l := c.QueryParam("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil && n > 0 && n <= 200 {
			limit = n
		}
	}
	offset := 0
	if o := c.QueryParam("offset"); o != "" {
		if n, err := strconv.Atoi(o); err == nil && n >= 0 {
			offset = n
		}
	}

	logs, hasMore, err := h.Store.ListServerLogs(ctx, filter, c.QueryParam("q"), limit, offset)
	if err != nil {
		return httpx.InternalError(c, "failed to load logs")
	}
	if logs == nil {
		logs = []models.ServerLog{}
	}
	return httpx.OK(c, http.StatusOK, map[string]interface{}{
		"logs":    logs,
		"hasMore": hasMore,
	})
}

// GetLogStats aggregates counts by level over a date range for the
// observability dashboard — defaults to the last 24h.
func (h *Handler) GetLogStats(c *echo.Context) error {
	ctx := c.Request().Context()
	to := time.Now()
	from := to.AddDate(0, 0, -1)

	if f := c.QueryParam("from"); f != "" {
		if t, err := time.Parse(time.RFC3339, f); err == nil {
			from = t
		} else {
			return httpx.BadRequest(c, "invalid from")
		}
	}
	if t := c.QueryParam("to"); t != "" {
		if parsed, err := time.Parse(time.RFC3339, t); err == nil {
			to = parsed
		} else {
			return httpx.BadRequest(c, "invalid to")
		}
	}

	stats, err := h.Store.GetServerLogStats(ctx, from.Format(time.RFC3339), to.Format(time.RFC3339))
	if err != nil {
		return httpx.InternalError(c, "failed to load log stats")
	}
	return httpx.OK(c, http.StatusOK, map[string]interface{}{
		"stats":         stats,
		"retentionDays": h.LogRetentionDays,
	})
}
