package handlers

import (
	"crypto/subtle"
	"net/http"
	"strconv"
	"strings"

	"github.com/labstack/echo/v5"
	"radix-backend/internal/httpx"
	"radix-backend/internal/models"
)

// SyncOpsPath is the one route a peer node talks to. It's excluded from the
// session middleware (see auth.Middleware) and gated by the shared sync token
// instead: a peer has no user account, and giving it one would mean handing a
// machine an admin session for the whole API.
const SyncOpsPath = "/api/v1/sync/ops"

// GetSyncOps serves this node's operation log from a cursor. Read-only — a peer
// can never write here, it can only pull and decide for itself what to apply,
// which keeps the trust needed in one direction.
func (h *Handler) GetSyncOps(c *echo.Context) error {
	if !h.syncTokenValid(c) {
		return httpx.Unauthorized(c, "invalid sync token")
	}
	ctx := c.Request().Context()

	since, _ := strconv.ParseInt(c.QueryParam("since"), 10, 64)
	limit, _ := strconv.Atoi(c.QueryParam("limit"))

	ops, err := h.Store.OpsSince(ctx, since, limit)
	if err != nil {
		return httpx.InternalError(c, "failed to read the operation log")
	}
	// The puller sends its own cursor with every request, so acknowledgement
	// costs nothing extra: from here on this node knows those ops were
	// delivered, which is what its Monitor reports as no longer pending.
	if err := h.Store.RecordReader(ctx, c.QueryParam("node"), since); err != nil {
		return httpx.InternalError(c, "failed to record the peer's position")
	}

	return httpx.OK(c, http.StatusOK, map[string]any{
		"nodeId": h.Store.NodeID(),
		"ops":    ops,
	})
}

// syncTokenValid compares the bearer token against the configured one in
// constant time. An unset token disables the endpoint outright rather than
// leaving it open — a node with no token configured has no business serving its
// log to anyone.
func (h *Handler) syncTokenValid(c *echo.Context) bool {
	if h.SyncToken == "" {
		return false
	}
	presented := strings.TrimPrefix(c.Request().Header.Get("Authorization"), "Bearer ")
	return subtle.ConstantTimeCompare([]byte(presented), []byte(h.SyncToken)) == 1
}

// ForceSync runs one synchronisation round now instead of waiting for the
// timer. It used to delete the queue and report success without contacting
// anything.
func (h *Handler) ForceSync(c *echo.Context) error {
	if h.Syncer == nil || !h.Syncer.Enabled() {
		return httpx.OK(c, http.StatusOK, map[string]any{
			"results": []models.SyncResult{},
			"message": "No hay nodos pares configurados (SYNC_PEERS)",
		})
	}

	results := h.Syncer.Round(c.Request().Context())

	applied, files, failed := 0, 0, 0
	for _, result := range results {
		applied += result.Applied
		files += result.Files
		if result.Error != "" {
			failed++
		}
	}

	message := "Sincronización completada: " + strconv.Itoa(applied) + " operaciones aplicadas"
	if files > 0 {
		message += ", " + strconv.Itoa(files) + " archivo(s) descargado(s)"
	}
	if failed > 0 {
		message += ", " + strconv.Itoa(failed) + " nodo(s) inalcanzable(s)"
	}
	return httpx.OK(c, http.StatusOK, map[string]any{
		"results": results,
		"message": message,
	})
}

// GetSyncFile serves one library item's bytes to a peer node.
//
// It exists because an operation carries a row, not a file: a peer that learns
// about an uploaded video from the log has its metadata and nothing to play.
// Same file as GET /library/:id/file, but authenticated with the sync token —
// a node has no user session, and the alternative (shipping bytes inside the
// operation log) would put a video in a JSON payload and in every node's
// history forever.
func (h *Handler) GetSyncFile(c *echo.Context) error {
	if !h.syncTokenValid(c) {
		return httpx.Unauthorized(c, "invalid sync token")
	}
	item, err := h.Store.GetLibraryItem(c.Request().Context(), c.Param("id"))
	if err != nil {
		return httpx.NotFound(c, "item not found")
	}
	return h.serveFile(c, item)
}
