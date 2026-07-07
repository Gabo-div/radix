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

type Quiz struct {
	ID        string         `json:"id"`
	LessonID  string         `json:"lessonId"`
	Questions []QuizQuestion `json:"questions"`
}

type Lesson struct {
	ID            string  `json:"id"`
	CourseID      string  `json:"courseId"`
	Title         string  `json:"title"`
	ContentText   string  `json:"contentText"`
	LibraryItemID *string `json:"libraryItemId"`
	QuizID        *string `json:"quizId"`
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
