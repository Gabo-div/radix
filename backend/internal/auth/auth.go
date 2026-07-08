package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"net/http"
	"strings"

	"github.com/labstack/echo/v5"
	"golang.org/x/crypto/bcrypt"
	"radix-backend/internal/httpx"
	"radix-backend/internal/models"
	"radix-backend/internal/store"
)

// Store is the subset of store.Store that auth needs — satisfied by
// *store.Store without any changes there (structural typing).
type Store interface {
	AddUser(ctx context.Context, user *models.User) error
	GetUserByEmail(ctx context.Context, email string) (*models.User, error)
	CreateSession(userID, name string, role models.Role) string
	GetSession(token string) (models.Session, bool)
	DeleteSession(token string)
}

type Auth struct {
	Store Store
}

func New(s Store) *Auth {
	return &Auth{Store: s}
}

func guestID() string {
	b := make([]byte, 8)
	rand.Read(b)
	return "g_" + hex.EncodeToString(b)
}

func (a *Auth) Login(c *echo.Context) error {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.Bind(&req); err != nil {
		return httpx.BadRequest(c, "invalid request")
	}

	ctx := c.Request().Context()

	user, err := a.Store.GetUserByEmail(ctx, req.Email)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return httpx.Unauthorized(c, "invalid email or password")
		}
		return httpx.InternalError(c, "failed to look up user")
	}
	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)) != nil {
		return httpx.Unauthorized(c, "invalid email or password")
	}

	token := a.Store.CreateSession(user.ID, user.Name, user.Role)
	return httpx.OK(c, http.StatusOK, map[string]interface{}{
		"token": token,
		"user":  user,
	})
}

func (a *Auth) LoginGuest(c *echo.Context) error {
	ctx := c.Request().Context()
	id := guestID()
	user := &models.User{
		ID:    id,
		Name:  "Invitado",
		Email: id + "@guest.local",
		Role:  models.RoleGuest,
	}
	if err := a.Store.AddUser(ctx, user); err != nil {
		return httpx.InternalError(c, "failed to create guest")
	}

	token := a.Store.CreateSession(user.ID, user.Name, user.Role)
	return httpx.OK(c, http.StatusOK, map[string]interface{}{
		"token": token,
		"user":  user,
	})
}

func (a *Auth) Logout(c *echo.Context) error {
	auth := c.Request().Header.Get("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		token := strings.TrimPrefix(auth, "Bearer ")
		a.Store.DeleteSession(token)
	}
	return httpx.NoContent(c)
}

func (a *Auth) Middleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c *echo.Context) error {
			path := c.Request().URL.Path
			if path == "/api/v1/auth/login" || path == "/api/v1/auth/guest" {
				return next(c)
			}

			var token string
			auth := c.Request().Header.Get("Authorization")
			if strings.HasPrefix(auth, "Bearer ") {
				token = strings.TrimPrefix(auth, "Bearer ")
			} else {
				token = c.QueryParam("token")
			}
			if token == "" {
				return httpx.Unauthorized(c, "missing token")
			}
			session, ok := a.Store.GetSession(token)
			if !ok {
				return httpx.Unauthorized(c, "invalid or expired token")
			}

			c.Set("user_id", session.UserID)
			c.Set("user_role", session.Role)
			c.Set("user_name", session.Name)
			return next(c)
		}
	}
}

func (a *Auth) RequireRole(role models.Role) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c *echo.Context) error {
			userRole, ok := c.Get("user_role").(models.Role)
			if !ok || userRole != role {
				return httpx.Forbidden(c, "forbidden: insufficient permissions")
			}
			return next(c)
		}
	}
}

func (a *Auth) RequireAnyRole(roles ...models.Role) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c *echo.Context) error {
			userRole, ok := c.Get("user_role").(models.Role)
			if !ok {
				return httpx.Forbidden(c, "forbidden")
			}
			for _, r := range roles {
				if userRole == r {
					return next(c)
				}
			}
			return httpx.Forbidden(c, "forbidden: insufficient permissions")
		}
	}
}
