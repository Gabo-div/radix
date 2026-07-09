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
	if ok, err := h.requireCourseAccess(c, id); !ok {
		return err
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
	if ok, err := h.requireCourseAccess(c, lesson.CourseID); !ok {
		return err
	}

	role, _ := c.Get("user_role").(models.Role)
	resp := map[string]interface{}{
		"lesson": lesson,
	}

	if lesson.QuizID != nil && role != models.RoleGuest {
		quiz, err := h.Store.GetQuiz(ctx, *lesson.QuizID)
		if err == nil {
			resp["quiz"] = quiz
		}
	}

	return httpx.OK(c, http.StatusOK, resp)
}

// GetAllLessons lists every lesson across all courses — used by the frontend
// to resolve [[id]] wiki-links against lessons (in addition to library items).
func (h *Handler) GetAllLessons(c *echo.Context) error {
	ctx := c.Request().Context()
	lessons, err := h.Store.GetAllLessons(ctx)
	if err != nil {
		return httpx.InternalError(c, "failed to load lessons")
	}
	if lessons == nil {
		lessons = []models.LessonUsage{}
	}
	return httpx.OK(c, http.StatusOK, lessons)
}

// GetLessonUsage lists lessons that link to this lesson via [[id]].
func (h *Handler) GetLessonUsage(c *echo.Context) error {
	id := c.Param("id")
	usage, err := h.Store.GetLessonsLinkingTo(c.Request().Context(), id)
	if err != nil {
		return httpx.InternalError(c, "failed to load usage")
	}
	if usage == nil {
		usage = []models.LessonUsage{}
	}
	return httpx.OK(c, http.StatusOK, usage)
}

// GetLessonLinks resolves the library items and lessons this lesson links to
// via [[id]] wiki-links — scoped to just this lesson (backed by lesson_links),
// so viewing a lesson doesn't require fetching the entire library/lesson index.
func (h *Handler) GetLessonLinks(c *echo.Context) error {
	id := c.Param("id")
	items, lessons, err := h.Store.GetLessonLinks(c.Request().Context(), id)
	if err != nil {
		return httpx.InternalError(c, "failed to load lesson links")
	}
	if items == nil {
		items = []models.LibraryItem{}
	}
	if lessons == nil {
		lessons = []models.LessonUsage{}
	}
	return httpx.OK(c, http.StatusOK, map[string]interface{}{
		"libraryItems": items,
		"lessons":      lessons,
	})
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

// GetEnrolledStudents backs the course page's "Estudiantes" admin tab.
func (h *Handler) GetEnrolledStudents(c *echo.Context) error {
	ctx := c.Request().Context()
	students, err := h.Store.GetEnrolledStudents(ctx, c.Param("id"))
	if err != nil {
		return httpx.InternalError(c, "failed to load students")
	}
	if students == nil {
		students = []models.CourseStudent{}
	}
	return httpx.OK(c, http.StatusOK, students)
}

// GetAvailableStudents lists students not yet enrolled — backs the admin's
// "add student" picker.
func (h *Handler) GetAvailableStudents(c *echo.Context) error {
	ctx := c.Request().Context()
	students, err := h.Store.GetUnenrolledStudents(ctx, c.Param("id"))
	if err != nil {
		return httpx.InternalError(c, "failed to load available students")
	}
	if students == nil {
		students = []models.CourseStudent{}
	}
	return httpx.OK(c, http.StatusOK, students)
}

func (h *Handler) EnrollStudent(c *echo.Context) error {
	ctx := c.Request().Context()
	courseID := c.Param("id")
	var req struct {
		UserID string `json:"userId"`
	}
	if err := c.Bind(&req); err != nil || req.UserID == "" {
		return httpx.BadRequest(c, "invalid request")
	}
	if _, err := h.Store.GetCourse(ctx, courseID); err != nil {
		return httpx.NotFound(c, "course not found")
	}
	if err := h.Store.EnrollStudent(ctx, req.UserID, courseID); err != nil {
		return httpx.InternalError(c, "failed to enroll student")
	}
	h.Store.EnqueueSync(ctx, "ENROLL_STUDENT: "+req.UserID+" -> "+courseID)
	return httpx.NoContent(c)
}

// GetCourseResources lists every library item linked from any lesson/quiz in
// this course — backs the course page's "Recursos" tab.
func (h *Handler) GetCourseResources(c *echo.Context) error {
	ctx := c.Request().Context()
	courseID := c.Param("id")
	if ok, err := h.requireCourseAccess(c, courseID); !ok {
		return err
	}
	items, err := h.Store.GetCourseLibraryResources(ctx, courseID)
	if err != nil {
		return httpx.InternalError(c, "failed to load resources")
	}
	if items == nil {
		items = []models.LibraryItem{}
	}
	return httpx.OK(c, http.StatusOK, items)
}

func (h *Handler) UnenrollStudent(c *echo.Context) error {
	ctx := c.Request().Context()
	courseID := c.Param("id")
	userID := c.Param("userId")
	if err := h.Store.UnenrollStudent(ctx, userID, courseID); err != nil {
		return httpx.InternalError(c, "failed to unenroll student")
	}
	h.Store.EnqueueSync(ctx, "UNENROLL_STUDENT: "+userID+" -> "+courseID)
	return httpx.NoContent(c)
}
