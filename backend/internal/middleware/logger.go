package middleware

import (
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/labstack/echo/v5"
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

func GoServerLogger(logBuffer *LogBuffer) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c *echo.Context) error {
			err := next(c)
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
			ts := time.Now().Format("2006/01/02 15:04:05")
			logLine := fmt.Sprintf("[GO-SERVER] %s - %s %s - Role: %s - Status: %d",
				ts, method, path, strings.ToUpper(roleStr), status)

			logBuffer.Write(logLine)

			if err != nil {
				logBuffer.Write(fmt.Sprintf("[GO-SERVER] %s - ERROR: %v", ts, err))
			}
			return err
		}
	}
}
