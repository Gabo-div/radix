package handlers

import (
	"errors"
	"net/http"

	"github.com/labstack/echo/v5"
	"radix-backend/internal/httpx"
	"radix-backend/internal/models"
	"radix-backend/internal/store"
)

func (h *Handler) GetCourses(c *echo.Context) error {
	ctx := c.Request().Context()
	courses, err := h.Store.GetCourses(ctx)
	if err != nil {
		return httpx.InternalError(c, "failed to load courses")
	}
	return httpx.OK(c, http.StatusOK, courses)
}

func (h *Handler) CreateCourse(c *echo.Context) error {
	ctx := c.Request().Context()
	var req struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Category    string `json:"category"`
	}
	if err := c.Bind(&req); err != nil {
		return httpx.BadRequest(c, "invalid request")
	}
	course := &models.Course{
		Title:       req.Title,
		Description: req.Description,
		Category:    req.Category,
	}
	if err := h.Store.AddCourse(ctx, course); err != nil {
		return httpx.InternalError(c, "failed to create course")
	}
	h.Store.EnqueueSync(ctx, "ADD_COURSE: "+course.Title)
	return httpx.OK(c, http.StatusCreated, course)
}

func (h *Handler) GetCourse(c *echo.Context) error {
	ctx := c.Request().Context()
	id := c.Param("id")
	course, err := h.Store.GetCourse(ctx, id)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return httpx.NotFound(c, "course not found")
		}
		return httpx.InternalError(c, "failed to load course")
	}
	lessons, err := h.Store.GetLessonsForCourse(ctx, id)
	if err != nil {
		return httpx.InternalError(c, "failed to load lessons")
	}
	if lessons == nil {
		lessons = []*models.Lesson{}
	}
	return httpx.OK(c, http.StatusOK, map[string]interface{}{
		"course":  course,
		"lessons": lessons,
	})
}

func (h *Handler) CreateLesson(c *echo.Context) error {
	ctx := c.Request().Context()
	courseID := c.Param("id")
	if _, err := h.Store.GetCourse(ctx, courseID); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return httpx.NotFound(c, "course not found")
		}
		return httpx.InternalError(c, "failed to load course")
	}
	var req struct {
		Title       string `json:"title"`
		ContentText string `json:"contentText"`
	}
	if err := c.Bind(&req); err != nil {
		return httpx.BadRequest(c, "invalid request")
	}
	lesson := &models.Lesson{
		CourseID:    courseID,
		Title:       req.Title,
		ContentText: req.ContentText,
	}
	if err := h.Store.AddLesson(ctx, lesson); err != nil {
		return httpx.InternalError(c, "failed to create lesson")
	}
	h.Store.EnqueueSync(ctx, "ADD_LESSON: "+lesson.Title)
	return httpx.OK(c, http.StatusCreated, lesson)
}

func (h *Handler) GetLesson(c *echo.Context) error {
	ctx := c.Request().Context()
	id := c.Param("lessonId")
	lesson, err := h.Store.GetLesson(ctx, id)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return httpx.NotFound(c, "lesson not found")
		}
		return httpx.InternalError(c, "failed to load lesson")
	}

	role, _ := c.Get("user_role").(models.Role)
	resp := map[string]interface{}{
		"lesson": lesson,
	}

	if lesson.LibraryItemID != nil {
		libItem, err := h.Store.GetLibraryItem(ctx, *lesson.LibraryItemID)
		if err == nil {
			resp["libraryItem"] = libItem
		}
	}

	if lesson.QuizID != nil && role != models.RoleGuest {
		quiz, err := h.Store.GetQuiz(ctx, *lesson.QuizID)
		if err == nil {
			resp["quiz"] = quiz
		}
	}

	return httpx.OK(c, http.StatusOK, resp)
}

func (h *Handler) LinkLibraryItem(c *echo.Context) error {
	ctx := c.Request().Context()
	lessonID := c.Param("lessonId")
	lesson, err := h.Store.GetLesson(ctx, lessonID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return httpx.NotFound(c, "lesson not found")
		}
		return httpx.InternalError(c, "failed to load lesson")
	}
	var req struct {
		LibraryItemID string `json:"libraryItemId"`
	}
	if err := c.Bind(&req); err != nil {
		return httpx.BadRequest(c, "invalid request")
	}
	if _, err := h.Store.GetLibraryItem(ctx, req.LibraryItemID); err != nil {
		return httpx.BadRequest(c, "library item not found")
	}
	lesson.LibraryItemID = &req.LibraryItemID
	if err := h.Store.UpdateLesson(ctx, lesson); err != nil {
		return httpx.InternalError(c, "failed to update lesson")
	}
	h.Store.EnqueueSync(ctx, "LINK_LIBRARY_ITEM: "+lessonID+" -> "+req.LibraryItemID)
	return httpx.OK(c, http.StatusOK, lesson)
}

func (h *Handler) UpdateLesson(c *echo.Context) error {
	ctx := c.Request().Context()
	id := c.Param("id")
	lesson, err := h.Store.GetLesson(ctx, id)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return httpx.NotFound(c, "lesson not found")
		}
		return httpx.InternalError(c, "failed to load lesson")
	}
	var req struct {
		Title       *string `json:"title"`
		ContentText *string `json:"contentText"`
	}
	if err := c.Bind(&req); err != nil {
		return httpx.BadRequest(c, "invalid request")
	}
	if req.Title != nil {
		lesson.Title = *req.Title
	}
	if req.ContentText != nil {
		lesson.ContentText = *req.ContentText
	}
	if err := h.Store.UpdateLesson(ctx, lesson); err != nil {
		return httpx.InternalError(c, "failed to update lesson")
	}
	h.Store.EnqueueSync(ctx, "UPDATE_LESSON: "+id)
	return httpx.OK(c, http.StatusOK, lesson)
}
