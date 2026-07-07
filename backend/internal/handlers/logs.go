package handlers

import (
	"net/http"

	"github.com/labstack/echo/v5"
	"radix-backend/internal/httpx"
)

func (h *Handler) GetLogs(c *echo.Context) error {
	lines := h.LogBuffer.Lines()
	if lines == nil {
		lines = []string{}
	}
	return httpx.OK(c, http.StatusOK, lines)
}
