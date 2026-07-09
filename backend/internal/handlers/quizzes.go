package handlers

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/labstack/echo/v5"
	"radix-backend/internal/httpx"
	"radix-backend/internal/models"
	"radix-backend/internal/store"
)

// CreateQuiz makes a quiz that stands on its own inside a course (courseId
// required) and can optionally also attach to one of that course's lessons
// (lessonId) — a lesson's tied quiz is just a quiz with lessonId set, not a
// different kind of object.
func (h *Handler) CreateQuiz(c *echo.Context) error {
	ctx := c.Request().Context()
	var req struct {
		CourseID    string                `json:"courseId"`
		LessonID    *string               `json:"lessonId"`
		Title       string                `json:"title"`
		Description string                `json:"description"`
		Value       int                   `json:"value"`
		Questions   []models.QuizQuestion `json:"questions"`
	}
	if err := c.Bind(&req); err != nil {
		return httpx.BadRequest(c, "invalid request")
	}

	courseID := req.CourseID
	if req.LessonID != nil {
		lesson, err := h.Store.GetLesson(ctx, *req.LessonID)
		if err != nil {
			return httpx.NotFound(c, "lesson not found")
		}
		courseID = lesson.CourseID
	}
	if courseID == "" {
		return httpx.BadRequest(c, "courseId or lessonId is required")
	}
	if _, err := h.Store.GetCourse(ctx, courseID); err != nil {
		return httpx.NotFound(c, "course not found")
	}

	quiz := &models.Quiz{
		CourseID:    courseID,
		LessonID:    req.LessonID,
		Title:       req.Title,
		Description: req.Description,
		Value:       req.Value,
		Questions:   req.Questions,
	}
	if err := h.Store.AddQuiz(ctx, quiz); err != nil {
		return httpx.InternalError(c, "failed to create quiz")
	}

	h.Store.EnqueueSync(ctx, "ADD_QUIZ: "+quiz.ID)
	return httpx.OK(c, http.StatusCreated, quiz)
}

// GetCourseQuizzes lists the standalone + lesson-tied quizzes for a course —
// backs the course page's "Cuestionarios" tab.
func (h *Handler) GetCourseQuizzes(c *echo.Context) error {
	ctx := c.Request().Context()
	courseID := c.Param("id")
	if ok, err := h.requireCourseAccess(c, courseID); !ok {
		return err
	}
	quizzes, err := h.Store.GetQuizzesForCourse(ctx, courseID)
	if err != nil {
		return httpx.InternalError(c, "failed to load quizzes")
	}
	if quizzes == nil {
		quizzes = []*models.Quiz{}
	}
	return httpx.OK(c, http.StatusOK, quizzes)
}

func (h *Handler) UpdateQuiz(c *echo.Context) error {
	ctx := c.Request().Context()
	id := c.Param("id")
	quiz, err := h.Store.GetQuiz(ctx, id)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return httpx.NotFound(c, "quiz not found")
		}
		return httpx.InternalError(c, "failed to load quiz")
	}
	var req struct {
		Title       *string               `json:"title"`
		Description *string               `json:"description"`
		Value       *int                  `json:"value"`
		Questions   []models.QuizQuestion `json:"questions"`
	}
	if err := c.Bind(&req); err != nil {
		return httpx.BadRequest(c, "invalid request")
	}
	if req.Title != nil {
		quiz.Title = *req.Title
	}
	if req.Description != nil {
		quiz.Description = *req.Description
	}
	if req.Value != nil {
		quiz.Value = *req.Value
	}
	if req.Questions != nil {
		quiz.Questions = req.Questions
	}
	if err := h.Store.UpdateQuiz(ctx, quiz); err != nil {
		return httpx.InternalError(c, "failed to update quiz")
	}
	h.Store.EnqueueSync(ctx, "UPDATE_QUIZ: "+id)
	return httpx.OK(c, http.StatusOK, quiz)
}

// GetQuizLinks resolves the library items and lessons this quiz's description
// links to via [[id]] wiki-links — mirrors GetLessonLinks.
func (h *Handler) GetQuizLinks(c *echo.Context) error {
	id := c.Param("id")
	items, lessons, err := h.Store.GetQuizLinks(c.Request().Context(), id)
	if err != nil {
		return httpx.InternalError(c, "failed to load quiz links")
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

func (h *Handler) GetQuiz(c *echo.Context) error {
	ctx := c.Request().Context()
	id := c.Param("id")
	role, _ := c.Get("user_role").(models.Role)
	if role == models.RoleGuest {
		return httpx.Forbidden(c, "guests cannot access quizzes")
	}
	quiz, err := h.Store.GetQuiz(ctx, id)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return httpx.NotFound(c, "quiz not found")
		}
		return httpx.InternalError(c, "failed to load quiz")
	}
	if ok, err := h.requireCourseAccess(c, quiz.CourseID); !ok {
		return err
	}
	return httpx.OK(c, http.StatusOK, quiz)
}

func (h *Handler) SubmitQuiz(c *echo.Context) error {
	ctx := c.Request().Context()
	quizID := c.Param("id")
	quiz, err := h.Store.GetQuiz(ctx, quizID)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			return httpx.NotFound(c, "quiz not found")
		}
		return httpx.InternalError(c, "failed to load quiz")
	}
	if ok, err := h.requireCourseAccess(c, quiz.CourseID); !ok {
		return err
	}

	var req struct {
		Answers []int `json:"answers"`
	}
	if err := c.Bind(&req); err != nil {
		return httpx.BadRequest(c, "invalid request")
	}

	if len(req.Answers) != len(quiz.Questions) {
		return httpx.BadRequest(c, "answer count mismatch")
	}

	correct := 0
	for i, q := range quiz.Questions {
		if i < len(req.Answers) && req.Answers[i] == q.CorrectIndex {
			correct++
		}
	}

	total := len(quiz.Questions)
	score := correct * 100 / total
	grade := score * quiz.Value / 100

	userID, _ := c.Get("user_id").(string)
	user, err := h.Store.GetUser(ctx, userID)
	if err != nil {
		return httpx.InternalError(c, "failed to load user")
	}
	// Standalone quizzes (no lessonId) aren't a lesson-completion gate.
	if quiz.LessonID != nil {
		alreadyCompleted := false
		for _, lid := range user.CompletedLessons {
			if lid == *quiz.LessonID {
				alreadyCompleted = true
				break
			}
		}
		if !alreadyCompleted {
			user.CompletedLessons = append(user.CompletedLessons, *quiz.LessonID)
			if err := h.Store.UpdateUser(ctx, user); err != nil {
				return httpx.InternalError(c, "failed to update user")
			}
		}
	}

	// A retake overwrites this quiz's grade — the latest attempt counts.
	if err := h.Store.RecordQuizGrade(ctx, userID, quizID, grade); err != nil {
		return httpx.InternalError(c, "failed to record grade")
	}
	// Points are per-course, not global — sum of this user's grades across
	// only this quiz's course.
	totalPoints, err := h.Store.GetUserCoursePoints(ctx, userID, quiz.CourseID)
	if err != nil {
		return httpx.InternalError(c, "failed to load points")
	}

	h.Store.EnqueueSync(ctx, fmt.Sprintf("SUBMIT_QUIZ: %s | Score: %d%% | Grade: %d/%d", quizID, score, grade, quiz.Value))

	return httpx.OK(c, http.StatusOK, map[string]interface{}{
		"score":       score,
		"correct":     correct,
		"total":       total,
		"grade":       grade,
		"quizValue":   quiz.Value,
		"passed":      score >= 60,
		"totalPoints": totalPoints,
	})
}
