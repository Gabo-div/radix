package handlers

import (
	"context"

	"github.com/labstack/echo/v5"
	"radix-backend/internal/auth"
	"radix-backend/internal/config"
	"radix-backend/internal/middleware"
	"radix-backend/internal/models"
)

// Store is the subset of store.Store that the handlers need — satisfied by
// *store.Store without any changes there (structural typing).
type Store interface {
	GetUser(ctx context.Context, id string) (*models.User, error)
	UpdateUser(ctx context.Context, user *models.User) error
	ActiveSessionCount() int

	GetLibraryItems(ctx context.Context) ([]models.LibraryItem, error)
	GetLibraryItem(ctx context.Context, id string) (*models.LibraryItem, error)
	AddLibraryItem(ctx context.Context, item models.LibraryItem) (string, error)
	UpdateLibraryItem(ctx context.Context, item *models.LibraryItem) error
	TotalDiskKB(ctx context.Context) (int, error)
	GetLessonsLinkingTo(ctx context.Context, targetID string) ([]models.LessonUsage, error)

	GetCourses(ctx context.Context) ([]*models.Course, error)
	GetCourse(ctx context.Context, id string) (*models.Course, error)
	AddCourse(ctx context.Context, course *models.Course) error
	GetLessonsForCourse(ctx context.Context, courseID string) ([]*models.Lesson, error)
	GetLesson(ctx context.Context, id string) (*models.Lesson, error)
	AddLesson(ctx context.Context, lesson *models.Lesson) error
	UpdateLesson(ctx context.Context, lesson *models.Lesson) error
	GetAllLessons(ctx context.Context) ([]models.LessonUsage, error)
	GetLessonLinks(ctx context.Context, lessonID string) ([]models.LibraryItem, []models.LessonUsage, error)

	GetQuiz(ctx context.Context, id string) (*models.Quiz, error)
	AddQuiz(ctx context.Context, quiz *models.Quiz) error
	UpdateQuiz(ctx context.Context, quiz *models.Quiz) error
	GetQuizzesForCourse(ctx context.Context, courseID string) ([]*models.Quiz, error)
	GetQuizLinks(ctx context.Context, quizID string) ([]models.LibraryItem, []models.LessonUsage, error)

	GetSyncQueue(ctx context.Context) (models.SyncQueue, error)
	EnqueueSync(ctx context.Context, action string) error
	ClearSyncQueue(ctx context.Context) (int, error)

	ListServerLogs(ctx context.Context, filter models.ServerLogFilter, search string, limit, offset int) ([]models.ServerLog, bool, error)
	GetServerLogStats(ctx context.Context, from, to string) (models.ServerLogStats, error)
}

type Handler struct {
	Store            Store
	LogBuffer        *middleware.LogBuffer
	LogRetentionDays int
}

func New(s Store, logBuffer *middleware.LogBuffer, cfg *config.Config) *Handler {
	return &Handler{Store: s, LogBuffer: logBuffer, LogRetentionDays: cfg.LogRetentionDays}
}

func (h *Handler) RegisterRoutes(api *echo.Group, a *auth.Auth) {
	api.POST("/auth/login", a.Login)
	api.POST("/auth/guest", a.LoginGuest)
	api.POST("/auth/logout", a.Logout)

	api.GET("/library", h.GetLibrary)
	api.GET("/library/:id", h.GetLibraryItem)
	api.PATCH("/library/:id", h.UpdateLibraryItem, a.RequireRole("admin"))
	api.GET("/library/:id/file", h.ServeLibraryFile)
	api.GET("/library/:id/usage", h.GetLibraryItemUsage)
	api.POST("/library", h.CreateLibraryItem, a.RequireRole("admin"))

	api.GET("/courses", h.GetCourses)
	api.POST("/courses", h.CreateCourse, a.RequireRole("admin"))
	api.GET("/courses/:id", h.GetCourse)

	api.POST("/courses/:id/lessons", h.CreateLesson, a.RequireRole("admin"))
	api.GET("/courses/:courseId/lessons/:lessonId", h.GetLesson)
	api.PUT("/lessons/:id", h.UpdateLesson, a.RequireRole("admin"))
	api.GET("/lessons", h.GetAllLessons)
	api.GET("/lessons/:id/links", h.GetLessonLinks)
	api.GET("/lessons/:id/usage", h.GetLessonUsage)

	api.GET("/courses/:id/quizzes", h.GetCourseQuizzes)
	api.POST("/quizzes", h.CreateQuiz, a.RequireRole("admin"))
	api.GET("/quizzes/:id", h.GetQuiz)
	api.PUT("/quizzes/:id", h.UpdateQuiz, a.RequireRole("admin"))
	api.GET("/quizzes/:id/links", h.GetQuizLinks)
	api.POST("/quizzes/:id/submit", h.SubmitQuiz, a.RequireRole("student"))

	api.GET("/monitor", h.GetMonitor, a.RequireRole("admin"))
	api.POST("/monitor/sync", h.ForceSync, a.RequireRole("admin"))

	api.GET("/logs", h.GetLogs)
	api.GET("/logs/history", h.SearchLogs, a.RequireRole("admin"))
	api.GET("/logs/stats", h.GetLogStats, a.RequireRole("admin"))
}
