package middleware

import (
	"context"

	"github.com/labstack/echo/v5"
)

// DetachContext strips cancellation from the request context before it
// reaches handlers, keeping any values it carries. Without this, a client
// disconnect/navigation-away cancels c.Request().Context() — and every
// handler builds its DB transaction from that same context. Canceling a
// go-libsql embedded-replica connection mid BEGIN/EXEC/COMMIT wedges the
// underlying native connection (MaxOpenConns is 1, so there's only one),
// which is what was producing the recurring "database disk image is
// malformed" errors: a request never even had to be slow, just interrupted
// mid-write. Reproduced in isolation (see the fix commit) — a tight
// cancel/write loop against the same sqld corrupted the connection in under
// 1,000 cycles; wrapping the context with context.WithoutCancel made 1,000+
// cycles pass clean.
func DetachContext(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c *echo.Context) error {
		c.SetRequest(c.Request().WithContext(context.WithoutCancel(c.Request().Context())))
		return next(c)
	}
}
