package models

type Role string

const (
	RoleAdmin   Role = "admin"
	RoleStudent Role = "student"
	RoleGuest   Role = "guest"
)

type User struct {
	ID               string   `json:"id"`
	Name             string   `json:"name"`
	Email            string   `json:"email"`
	PasswordHash     string   `json:"-"`
	Role             Role     `json:"role"`
	Points           int      `json:"points"`
	CompletedLessons []string `json:"completedLessons"`
}

type LibraryItem struct {
	ID               string `json:"id"`
	Title            string `json:"title"`
	Type             string `json:"type"`
	Category         string `json:"category"`
	SizeKB           int    `json:"sizeKB"`
	MimeType         string `json:"mimeType"`
	OriginalFilename string `json:"originalFilename"`
	UploadedBy       string `json:"uploadedBy"`
	UploadedAt       string `json:"uploadedAt"`
	ModifiedAt       string `json:"modifiedAt"`
	Duration         string `json:"duration,omitempty"`
	Resolution       string `json:"resolution,omitempty"`
	FilePath         string `json:"-"`
}

type QuizQuestion struct {
	Text         string   `json:"text"`
	Options      []string `json:"options"`
	CorrectIndex int      `json:"correctIndex"`
}

// Quiz.LessonID is optional — quizzes stand on their own inside a course (the
// course's "Cuestionarios" tab) and can additionally attach to at most one
// lesson (enforced by idx_quizzes_lesson_unique).
type Quiz struct {
	ID          string         `json:"id"`
	CourseID    string         `json:"courseId"`
	LessonID    *string        `json:"lessonId"`
	Title       string         `json:"title"`
	Description string         `json:"description"`
	Questions   []QuizQuestion `json:"questions"`
}

type Lesson struct {
	ID          string  `json:"id"`
	CourseID    string  `json:"courseId"`
	Title       string  `json:"title"`
	ContentText string  `json:"contentText"`
	QuizID      *string `json:"quizId"`
}

// LessonUsage identifies a lesson that embeds a library item via a
// [[id]] wiki-link — computed live from lessons.content_text, never stored,
// so it's automatically consistent with lesson edits/deletes.
type LessonUsage struct {
	LessonID    string `json:"lessonId"`
	CourseID    string `json:"courseId"`
	LessonTitle string `json:"lessonTitle"`
	CourseTitle string `json:"courseTitle"`
}

type Course struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Category    string `json:"category"`
}

type SyncQueue struct {
	TransactionCount int      `json:"transactionCount"`
	Logs             []string `json:"logs"`
}

type Session struct {
	UserID string
	Name   string
	Role   Role
}

// ServerLog is one persisted log entry — durable counterpart to
// middleware.LogBuffer's in-memory tail, written asynchronously in batches
// so no call site ever blocks on this insert. It applies to every log call
// in the app, not just HTTP requests: Fields is a generic JSON object holding
// whatever structured zap fields the call site attached (method/path/status
// for a request, or something else entirely for a background job) — there's
// no fixed per-source column set.
type ServerLog struct {
	ID        int64  `json:"id"`
	Timestamp string `json:"timestamp"`
	Level     string `json:"level"`
	Message   string `json:"message"`
	Fields    string `json:"fields"`
}

// ServerLogFilter's fields are all optional (zero value = unfiltered).
type ServerLogFilter struct {
	Level string
	From  string
	To    string
}

type ServerLogStats struct {
	Total   int64            `json:"total"`
	ByLevel map[string]int64 `json:"byLevel"`
}
