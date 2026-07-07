package handlers

import (
	"net/http"

	"github.com/labstack/echo/v5"
	"radix-backend/internal/httpx"
)

func (h *Handler) GetMonitor(c *echo.Context) error {
	ctx := c.Request().Context()
	syncQ, err := h.Store.GetSyncQueue(ctx)
	if err != nil {
		return httpx.InternalError(c, "failed to load sync queue")
	}
	diskKB, err := h.Store.TotalDiskKB(ctx)
	if err != nil {
		return httpx.InternalError(c, "failed to load disk usage")
	}
	return httpx.OK(c, http.StatusOK, map[string]interface{}{
		"diskKB":      diskKB,
		"activeUsers": h.Store.ActiveSessionCount(),
		"syncQueue":   syncQ,
	})
}

func (h *Handler) ForceSync(c *echo.Context) error {
	synced, err := h.Store.ClearSyncQueue(c.Request().Context())
	if err != nil {
		return httpx.InternalError(c, "failed to sync")
	}
	return httpx.OK(c, http.StatusOK, map[string]interface{}{
		"synced":  synced,
		"message": "Sincronización oportunista completada exitosamente",
	})
}
