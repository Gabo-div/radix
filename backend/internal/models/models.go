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
	CompletedLessons []string `json:"completedLessons"`
	// EnrolledCourses is only meaningful for students — admins/guests aren't
	// enrollment-gated, see Store.IsEnrolled.
	EnrolledCourses []string `json:"enrolledCourses"`
}

// CourseStudent is a student enrolled in a course, for the course's
// "Estudiantes" admin tab.
type CourseStudent struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Email  string `json:"email"`
	Points int    `json:"points"`
}

// ForumPost is one node in a course's discussion forum. ParentID nil means a
// top-level post; otherwise it's a reply to another post, to unbounded depth
// — the tree is built client-side from the flat per-course list returned by
// GetForumPosts, not recursive SQL. Liked tracks whether the requesting user
// has liked it (populated per-request, not stored on the row).
// ForumPost.Title is only set on a thread-starting post (ParentID nil) —
// replies have no title, enforced in the handler.
type ForumPost struct {
	ID         string  `json:"id"`
	CourseID   string  `json:"courseId"`
	ParentID   *string `json:"parentId"`
	UserID     string  `json:"userId"`
	AuthorName string  `json:"authorName"`
	AuthorRole Role    `json:"authorRole"`
	Title      string  `json:"title"`
	Body       string  `json:"body"`
	CreatedAt  string  `json:"createdAt"`
	LikeCount  int     `json:"likeCount"`
	Liked      bool    `json:"liked"`
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
	ID          string  `json:"id"`
	CourseID    string  `json:"courseId"`
	LessonID    *string `json:"lessonId"`
	Title       string  `json:"title"`
	Description string  `json:"description"`
	// Value is the max points a student can earn from this quiz — a
	// student's grade for it is (score% * Value), see Store.RecordQuizGrade.
	Value     int            `json:"value"`
	Questions []QuizQuestion `json:"questions"`
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

// QuizUsage identifies a quiz referenced via a [[id]] wiki-link — the quiz
// counterpart to LessonUsage, used for lightweight link previews (no
// Questions payload).
type QuizUsage struct {
	QuizID      string `json:"quizId"`
	CourseID    string `json:"courseId"`
	QuizTitle   string `json:"quizTitle"`
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
