package middleware

import (
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/labstack/echo/v5"
	"go.uber.org/zap"
	"radix-backend/internal/models"
)

type LogBuffer struct {
	mu    sync.Mutex
	lines []string
	max   int
}

func NewLogBuffer(max int) *LogBuffer {
	return &LogBuffer{
		lines: make([]string, 0, max),
		max:   max,
	}
}

func (lb *LogBuffer) Write(line string) {
	lb.mu.Lock()
	defer lb.mu.Unlock()
	if len(lb.lines) >= lb.max {
		lb.lines = lb.lines[1:]
	}
	lb.lines = append(lb.lines, line)
}

func (lb *LogBuffer) Lines() []string {
	lb.mu.Lock()
	defer lb.mu.Unlock()
	result := make([]string, len(lb.lines))
	copy(result, lb.lines)
	return result
}

// GoServerLogger logs one structured entry per request through logger — build
// logger via NewLogger so that single call also feeds the live tail
// (LogBuffer) and durable history (server_logs), see observability_core.go.
func GoServerLogger(logger *zap.Logger) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c *echo.Context) error {
			start := time.Now()
			err := next(c)
			duration := time.Since(start)

			role, _ := c.Get("user_role").(models.Role)
			roleStr := "UNAUTHENTICATED"
			if role != "" {
				roleStr = string(role)
			}

			status := 200
			if err != nil {
				if he, ok := err.(*echo.HTTPError); ok {
					status = he.Code
				} else {
					status = 500
				}
			}

			method := c.Request().Method
			path := c.Request().URL.Path
			msg := fmt.Sprintf("%s %s → %d (%dms) role=%s", method, path, status, duration.Milliseconds(), strings.ToUpper(roleStr))

			fields := []zap.Field{
				zap.String("method", method),
				zap.String("path", path),
				zap.String("role", strings.ToUpper(roleStr)),
				zap.Int("status", status),
				zap.Int64("duration_ms", duration.Milliseconds()),
			}

			if err != nil {
				logger.Error(msg+" — "+err.Error(), fields...)
			} else {
				logger.Info(msg, fields...)
			}
			return err
		}
	}
}
