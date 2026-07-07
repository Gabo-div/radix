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

func (h *Handler) CreateQuiz(c *echo.Context) error {
	ctx := c.Request().Context()
	var req struct {
		LessonID  string                `json:"lessonId"`
		Questions []models.QuizQuestion `json:"questions"`
	}
	if err := c.Bind(&req); err != nil {
		return httpx.BadRequest(c, "invalid request")
	}
	if _, err := h.Store.GetLesson(ctx, req.LessonID); err != nil {
		return httpx.NotFound(c, "lesson not found")
	}
	quiz := &models.Quiz{
		LessonID:  req.LessonID,
		Questions: req.Questions,
	}
	if err := h.Store.AddQuiz(ctx, quiz); err != nil {
		return httpx.InternalError(c, "failed to create quiz")
	}

	h.Store.EnqueueSync(ctx, "ADD_QUIZ: "+quiz.ID)
	return httpx.OK(c, http.StatusCreated, quiz)
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
	earnedXP := correct * 10

	userID, _ := c.Get("user_id").(string)
	user, err := h.Store.GetUser(ctx, userID)
	if err != nil {
		return httpx.InternalError(c, "failed to load user")
	}
	user.Points += earnedXP
	alreadyCompleted := false
	for _, lid := range user.CompletedLessons {
		if lid == quiz.LessonID {
			alreadyCompleted = true
			break
		}
	}
	if !alreadyCompleted {
		user.CompletedLessons = append(user.CompletedLessons, quiz.LessonID)
	}
	if err := h.Store.UpdateUser(ctx, user); err != nil {
		return httpx.InternalError(c, "failed to update user")
	}

	h.Store.EnqueueSync(ctx, fmt.Sprintf("SUBMIT_QUIZ: %s | Score: %d%% | XP: %d", quizID, score, earnedXP))

	return httpx.OK(c, http.StatusOK, map[string]interface{}{
		"score":       score,
		"correct":     correct,
		"total":       total,
		"earnedXP":    earnedXP,
		"passed":      score >= 60,
		"totalPoints": user.Points,
	})
}
