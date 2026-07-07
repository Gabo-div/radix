// Package httpx centralizes echo response shapes so handlers don't repeat
// c.JSON(status, map[string]string{"error": ...}) everywhere. Same JSON shape
// as before — success is the raw payload, error is {"error": "..."}.
package httpx

import (
	"net/http"

	"github.com/labstack/echo/v5"
)

func OK(c *echo.Context, status int, data any) error {
	return c.JSON(status, data)
}

func NoContent(c *echo.Context) error {
	return c.NoContent(http.StatusNoContent)
}

func Fail(c *echo.Context, status int, message string) error {
	return c.JSON(status, map[string]string{"error": message})
}

func BadRequest(c *echo.Context, message string) error {
	return Fail(c, http.StatusBadRequest, message)
}

func Unauthorized(c *echo.Context, message string) error {
	return Fail(c, http.StatusUnauthorized, message)
}

func Forbidden(c *echo.Context, message string) error {
	return Fail(c, http.StatusForbidden, message)
}

func NotFound(c *echo.Context, message string) error {
	return Fail(c, http.StatusNotFound, message)
}

func InternalError(c *echo.Context, message string) error {
	return Fail(c, http.StatusInternalServerError, message)
}
