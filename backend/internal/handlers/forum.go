package handlers

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v5"
	"radix-backend/internal/httpx"
	"radix-backend/internal/models"
	"radix-backend/internal/store"
)

// requireForumWriteAccess enforces the course-enrollment boundary (via
// requireCourseAccess) plus blocks guests, who get read-only forum access.
// On failure it has already written the response; callers must `return err`.
func (h *Handler) requireForumWriteAccess(c *echo.Context, courseID string) (bool, error) {
	role, _ := c.Get("user_role").(models.Role)
	if role == models.RoleGuest {
		return false, httpx.Forbidden(c, "guests have read-only forum access")
	}
	return h.requireCourseAccess(c, courseID)
}

// GetForumPosts lists every post in a course's forum, flat — the client
// builds the reply tree from parentId links.
func (h *Handler) GetForumPosts(c *echo.Context) error {
	ctx := c.Request().Context()
	courseID := c.Param("id")
	if ok, err := h.requireCourseAccess(c, courseID); !ok {
		return err
	}
	userID, _ := c.Get("user_id").(string)
	posts, err := h.Store.GetForumPosts(ctx, courseID, userID)
	if err != nil {
		return httpx.InternalError(c, "failed to load forum posts")
	}
	if posts == nil {
		posts = []models.ForumPost{}
	}
	return httpx.OK(c, http.StatusOK, posts)
}

// CreateForumPost makes a top-level post (no parentId) or a reply to any
// existing post in the same course (parentId set) — replies can nest to
// unbounded depth, same as replying to a reply.
func (h *Handler) CreateForumPost(c *echo.Context) error {
	ctx := c.Request().Context()
	courseID := c.Param("id")
	if ok, err := h.requireForumWriteAccess(c, courseID); !ok {
		return err
	}

	var req struct {
		ParentID *string `json:"parentId"`
		Title    string  `json:"title"`
		Body     string  `json:"body"`
	}
	if err := c.Bind(&req); err != nil || req.Body == "" {
		return httpx.BadRequest(c, "invalid request")
	}
	if req.ParentID == nil {
		// Only a thread-starting post has a title — replies don't.
		if req.Title == "" {
			return httpx.BadRequest(c, "title is required for a new thread")
		}
	} else {
		parent, err := h.Store.GetForumPost(ctx, *req.ParentID)
		if err != nil {
			if errors.Is(err, store.ErrNotFound) {
				return httpx.NotFound(c, "parent post not found")
			}
			return httpx.InternalError(c, "failed to load parent post")
		}
		if parent.CourseID != courseID {
			return httpx.BadRequest(c, "parent post belongs to a different course")
		}
		req.Title = ""
	}

	userID, _ := c.Get("user_id").(string)
	author, err := h.Store.GetUser(ctx, userID)
	if err != nil {
		return httpx.InternalError(c, "failed to load user")
	}
	post := &models.ForumPost{CourseID: courseID, ParentID: req.ParentID, UserID: userID, Title: req.Title, Body: req.Body}
	if err := h.Store.AddForumPost(ctx, post); err != nil {
		return httpx.InternalError(c, "failed to create post")
	}
	h.Store.EnqueueSync(ctx, "ADD_FORUM_POST: "+post.ID)

	post.AuthorName = author.Name
	post.AuthorRole = author.Role
	return httpx.OK(c, http.StatusCreated, post)
}

// GetForumLinks resolves every library item, lesson, and quiz linked from any
// post in the course's forum — one course-wide bundle the client uses to
// resolve every post's own [[id]] refs (ids are globally unique).
func (h *Handler) GetForumLinks(c *echo.Context) error {
	ctx := c.Request().Context()
	courseID := c.Param("id")
	if ok, err := h.requireCourseAccess(c, courseID); !ok {
		return err
	}
	items, lessons, quizzes, err := h.Store.GetCourseForumLinks(ctx, courseID)
	if err != nil {
		return httpx.InternalError(c, "failed to load forum links")
	}
	if items == nil {
		items = []models.LibraryItem{}
	}
	if lessons == nil {
		lessons = []models.LessonUsage{}
	}
	if quizzes == nil {
		quizzes = []models.QuizUsage{}
	}
	return httpx.OK(c, http.StatusOK, map[string]interface{}{
		"libraryItems": items,
		"lessons":      lessons,
		"quizzes":      quizzes,
	})
}

func (h *Handler) LikeForumPost(c *echo.Context) error {
	ctx := c.Request().Context()
	postID := c.Param("id")
	post, err := h.Store.GetForumPost(ctx, postID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return httpx.NotFound(c, "post not found")
		}
		return httpx.InternalError(c, "failed to load post")
	}
	if ok, err := h.requireForumWriteAccess(c, post.CourseID); !ok {
		return err
	}
	userID, _ := c.Get("user_id").(string)
	if err := h.Store.LikePost(ctx, postID, userID); err != nil {
		return httpx.InternalError(c, "failed to like post")
	}
	return httpx.NoContent(c)
}

func (h *Handler) UnlikeForumPost(c *echo.Context) error {
	ctx := c.Request().Context()
	postID := c.Param("id")
	post, err := h.Store.GetForumPost(ctx, postID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return httpx.NotFound(c, "post not found")
		}
		return httpx.InternalError(c, "failed to load post")
	}
	if ok, err := h.requireForumWriteAccess(c, post.CourseID); !ok {
		return err
	}
	userID, _ := c.Get("user_id").(string)
	if err := h.Store.UnlikePost(ctx, postID, userID); err != nil {
		return httpx.InternalError(c, "failed to unlike post")
	}
	return httpx.NoContent(c)
}
