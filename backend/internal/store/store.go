package store

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"

	"radix-backend/internal/database/dbgen"
	"radix-backend/internal/models"
)

// ErrNotFound is returned by Get* methods when no row matches.
var ErrNotFound = errors.New("store: not found")

// Store is a hybrid: everything durable goes through the DB (db/queries),
// while sessions stay in memory (no TTL, hot path on every request, no
// multi-instance requirement — a SQL table would only add latency).
type Store struct {
	db      *sql.DB
	queries *dbgen.Queries

	mu       sync.RWMutex
	sessions map[string]models.Session
}

func New(db *sql.DB) *Store {
	return &Store{
		db:       db,
		queries:  dbgen.New(db),
		sessions: make(map[string]models.Session),
	}
}

func generateToken() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func (s *Store) withTx(ctx context.Context, fn func(*dbgen.Queries) error) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if err := fn(s.queries.WithTx(tx)); err != nil {
		return err
	}
	return tx.Commit()
}

// nullString/stringFromNull round-trip the empty-string-means-unset
// convention already used by the JSON API (LibraryItem.Duration, etc).
func nullString(v string) sql.NullString {
	if v == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: v, Valid: true}
}

func stringFromNull(v sql.NullString) string {
	return v.String
}

// nullStringFromPtr/ptrFromNullString round-trip *string <-> NULL for the
// genuinely-nullable derived Lesson.QuizID field.
func nullStringFromPtr(v *string) sql.NullString {
	if v == nil {
		return sql.NullString{}
	}
	return sql.NullString{String: *v, Valid: true}
}

func ptrFromNullString(v sql.NullString) *string {
	if !v.Valid {
		return nil
	}
	s := v.String
	return &s
}

// --- Users / Sessions ---

func userFromRow(row dbgen.User, completedLessons []string) *models.User {
	return &models.User{
		ID:               row.ID,
		Name:             row.Name,
		Email:            row.Email,
		PasswordHash:     row.PasswordHash,
		Role:             models.Role(row.Role),
		Points:           int(row.Points),
		CompletedLessons: completedLessons,
	}
}

func (s *Store) GetUser(ctx context.Context, id string) (*models.User, error) {
	row, err := s.queries.GetUser(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	lessonIDs, err := s.queries.GetCompletedLessonIDs(ctx, id)
	if err != nil {
		return nil, err
	}
	return userFromRow(row, lessonIDs), nil
}

func (s *Store) GetUserByRole(ctx context.Context, role models.Role) (*models.User, error) {
	row, err := s.queries.GetUserByRole(ctx, string(role))
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	lessonIDs, err := s.queries.GetCompletedLessonIDs(ctx, row.ID)
	if err != nil {
		return nil, err
	}
	return userFromRow(row, lessonIDs), nil
}

func (s *Store) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	row, err := s.queries.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	lessonIDs, err := s.queries.GetCompletedLessonIDs(ctx, row.ID)
	if err != nil {
		return nil, err
	}
	return userFromRow(row, lessonIDs), nil
}

// AddUser stores the user with whatever ID the caller already set (guest
// logins mint their own "g_..." ID, seed data uses literal IDs) — the store
// never generates a user ID, unlike the other Add* methods.
func (s *Store) AddUser(ctx context.Context, user *models.User) error {
	return s.withTx(ctx, func(q *dbgen.Queries) error {
		if err := q.AddUser(ctx, dbgen.AddUserParams{
			ID:           user.ID,
			Name:         user.Name,
			Email:        user.Email,
			PasswordHash: user.PasswordHash,
			Role:         string(user.Role),
			Points:       int64(user.Points),
		}); err != nil {
			return err
		}
		for _, lessonID := range user.CompletedLessons {
			if err := q.AddCompletedLesson(ctx, dbgen.AddCompletedLessonParams{UserID: user.ID, LessonID: lessonID}); err != nil {
				return err
			}
		}
		return nil
	})
}

func (s *Store) UpdateUser(ctx context.Context, user *models.User) error {
	return s.withTx(ctx, func(q *dbgen.Queries) error {
		if err := q.UpdateUser(ctx, dbgen.UpdateUserParams{
			Name:   user.Name,
			Role:   string(user.Role),
			Points: int64(user.Points),
			ID:     user.ID,
		}); err != nil {
			return err
		}
		if err := q.DeleteCompletedLessons(ctx, user.ID); err != nil {
			return err
		}
		for _, lessonID := range user.CompletedLessons {
			if err := q.AddCompletedLesson(ctx, dbgen.AddCompletedLessonParams{UserID: user.ID, LessonID: lessonID}); err != nil {
				return err
			}
		}
		return nil
	})
}

func (s *Store) CreateSession(userID, name string, role models.Role) string {
	id := generateToken()
	s.mu.Lock()
	defer s.mu.Unlock()
	s.sessions[id] = models.Session{UserID: userID, Name: name, Role: role}
	return id
}

func (s *Store) GetSession(token string) (models.Session, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	sess, ok := s.sessions[token]
	return sess, ok
}

func (s *Store) DeleteSession(token string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	delete(s.sessions, token)
}

func (s *Store) ActiveSessionCount() int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.sessions)
}

// SaveSessions/LoadSessions persist the in-memory session map to a local file
// across process restarts — dev hot-reload (air) or a redeploy would otherwise
// silently log everyone out since sessions live only in memory (see New).
func (s *Store) SaveSessions(path string) error {
	s.mu.RLock()
	defer s.mu.RUnlock()
	data, err := json.Marshal(s.sessions)
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0600)
}

func (s *Store) LoadSessions(path string) error {
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	return json.Unmarshal(data, &s.sessions)
}

// --- Library ---

// libraryItemRow is the common shape of GetLibraryItemsRow/GetLibraryItemRow
// (both add UploadedByName via a LEFT JOIN against users — library_items.uploaded_by
// stores the user's ID, a real FK to users(id), not a display name).
type libraryItemRow struct {
	ID, Title, Type, Category, MimeType, OriginalFilename, UploadedAt, ModifiedAt, FilePath string
	SizeKb                                                                                  int64
	Duration, Resolution, UploadedByName                                                    sql.NullString
}

func libraryItemFromRow(r libraryItemRow) models.LibraryItem {
	return models.LibraryItem{
		ID:               r.ID,
		Title:            r.Title,
		Type:             r.Type,
		Category:         r.Category,
		SizeKB:           int(r.SizeKb),
		MimeType:         r.MimeType,
		OriginalFilename: r.OriginalFilename,
		UploadedBy:       stringFromNull(r.UploadedByName),
		UploadedAt:       r.UploadedAt,
		ModifiedAt:       r.ModifiedAt,
		Duration:         stringFromNull(r.Duration),
		Resolution:       stringFromNull(r.Resolution),
		FilePath:         r.FilePath,
	}
}

func (s *Store) GetLibraryItems(ctx context.Context) ([]models.LibraryItem, error) {
	rows, err := s.queries.GetLibraryItems(ctx)
	if err != nil {
		return nil, err
	}
	items := make([]models.LibraryItem, len(rows))
	for i, r := range rows {
		items[i] = libraryItemFromRow(libraryItemRow{
			ID: r.ID, Title: r.Title, Type: r.Type, Category: r.Category, SizeKb: r.SizeKb,
			MimeType: r.MimeType, OriginalFilename: r.OriginalFilename, UploadedAt: r.UploadedAt,
			ModifiedAt: r.ModifiedAt, Duration: r.Duration, Resolution: r.Resolution,
			FilePath: r.FilePath, UploadedByName: r.UploadedByName,
		})
	}
	return items, nil
}

func (s *Store) GetLibraryItem(ctx context.Context, id string) (*models.LibraryItem, error) {
	r, err := s.queries.GetLibraryItem(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	item := libraryItemFromRow(libraryItemRow{
		ID: r.ID, Title: r.Title, Type: r.Type, Category: r.Category, SizeKb: r.SizeKb,
		MimeType: r.MimeType, OriginalFilename: r.OriginalFilename, UploadedAt: r.UploadedAt,
		ModifiedAt: r.ModifiedAt, Duration: r.Duration, Resolution: r.Resolution,
		FilePath: r.FilePath, UploadedByName: r.UploadedByName,
	})
	return &item, nil
}

func (s *Store) AddLibraryItem(ctx context.Context, item models.LibraryItem) (string, error) {
	item.ID = uuid.NewString()
	err := s.queries.AddLibraryItem(ctx, dbgen.AddLibraryItemParams{
		ID:               item.ID,
		Title:            item.Title,
		Type:             item.Type,
		Category:         item.Category,
		SizeKb:           int64(item.SizeKB),
		MimeType:         item.MimeType,
		OriginalFilename: item.OriginalFilename,
		UploadedAt:       item.UploadedAt,
		ModifiedAt:       item.ModifiedAt,
		Duration:         nullString(item.Duration),
		Resolution:       nullString(item.Resolution),
		FilePath:         item.FilePath,
		UploadedBy:       nullString(item.UploadedBy),
	})
	if err != nil {
		return "", err
	}
	return item.ID, nil
}

func (s *Store) UpdateLibraryItem(ctx context.Context, item *models.LibraryItem) error {
	return s.queries.UpdateLibraryItem(ctx, dbgen.UpdateLibraryItemParams{
		Title:            item.Title,
		Category:         item.Category,
		SizeKb:           int64(item.SizeKB),
		MimeType:         item.MimeType,
		OriginalFilename: item.OriginalFilename,
		Duration:         nullString(item.Duration),
		Resolution:       nullString(item.Resolution),
		FilePath:         item.FilePath,
		ID:               item.ID,
	})
}

func (s *Store) TotalDiskKB(ctx context.Context) (int, error) {
	v, err := s.queries.TotalDiskKB(ctx)
	if err != nil {
		return 0, err
	}
	if n, ok := v.(int64); ok {
		return int(n), nil
	}
	return 0, nil
}

// --- Courses / Lessons ---

func (s *Store) GetCourses(ctx context.Context) ([]*models.Course, error) {
	rows, err := s.queries.GetCourses(ctx)
	if err != nil {
		return nil, err
	}
	courses := make([]*models.Course, len(rows))
	for i, r := range rows {
		courses[i] = &models.Course{ID: r.ID, Title: r.Title, Description: r.Description, Category: r.Category}
	}
	return courses, nil
}

func (s *Store) GetCourse(ctx context.Context, id string) (*models.Course, error) {
	r, err := s.queries.GetCourse(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &models.Course{ID: r.ID, Title: r.Title, Description: r.Description, Category: r.Category}, nil
}

func (s *Store) AddCourse(ctx context.Context, course *models.Course) error {
	course.ID = uuid.NewString()
	return s.queries.AddCourse(ctx, dbgen.AddCourseParams{
		ID:          course.ID,
		Title:       course.Title,
		Description: course.Description,
		Category:    course.Category,
	})
}

// lessonFromRow assembles a Lesson with QuizID derived from a LEFT JOIN
// against quizzes — there is no lessons.quiz_id column (see quizzes.lesson_id,
// the single source of truth for that relationship).
func lessonFromRow(id, courseID, title, contentText string, quizID sql.NullString) *models.Lesson {
	return &models.Lesson{
		ID:          id,
		CourseID:    courseID,
		Title:       title,
		ContentText: contentText,
		QuizID:      ptrFromNullString(quizID),
	}
}

func (s *Store) GetLessonsForCourse(ctx context.Context, courseID string) ([]*models.Lesson, error) {
	rows, err := s.queries.GetLessonsForCourse(ctx, courseID)
	if err != nil {
		return nil, err
	}
	lessons := make([]*models.Lesson, len(rows))
	for i, r := range rows {
		lessons[i] = lessonFromRow(r.ID, r.CourseID, r.Title, r.ContentText, r.QuizID)
	}
	return lessons, nil
}

func (s *Store) GetLesson(ctx context.Context, id string) (*models.Lesson, error) {
	r, err := s.queries.GetLesson(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return lessonFromRow(r.ID, r.CourseID, r.Title, r.ContentText, r.QuizID), nil
}

func (s *Store) AddLesson(ctx context.Context, lesson *models.Lesson) error {
	lesson.ID = uuid.NewString()
	return s.queries.AddLesson(ctx, dbgen.AddLessonParams{
		ID:          lesson.ID,
		CourseID:    lesson.CourseID,
		Title:       lesson.Title,
		ContentText: lesson.ContentText,
	})
}

func (s *Store) UpdateLesson(ctx context.Context, lesson *models.Lesson) error {
	return s.queries.UpdateLesson(ctx, dbgen.UpdateLessonParams{
		Title:       lesson.Title,
		ContentText: lesson.ContentText,
		ID:          lesson.ID,
	})
}

// GetLessonsUsingLibraryItem finds lessons whose content embeds itemID via
// the [[id]] wiki-link syntax — computed live from content_text on every
// call, so it never drifts when a lesson is edited or (in the future) deleted.
func (s *Store) GetLessonsUsingLibraryItem(ctx context.Context, itemID string) ([]models.LessonUsage, error) {
	rows, err := s.queries.GetLessonsReferencingLibraryItem(ctx, "%[["+itemID+"]]%")
	if err != nil {
		return nil, err
	}
	usage := make([]models.LessonUsage, len(rows))
	for i, r := range rows {
		usage[i] = models.LessonUsage{
			LessonID:    r.ID,
			CourseID:    r.CourseID,
			LessonTitle: r.Title,
			CourseTitle: r.CourseTitle,
		}
	}
	return usage, nil
}

// --- Quizzes ---

func (s *Store) GetQuiz(ctx context.Context, id string) (*models.Quiz, error) {
	row, err := s.queries.GetQuiz(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	questionRows, err := s.queries.GetQuizQuestions(ctx, id)
	if err != nil {
		return nil, err
	}
	questions := make([]models.QuizQuestion, len(questionRows))
	for i, q := range questionRows {
		var options []string
		if err := json.Unmarshal([]byte(q.OptionsJson), &options); err != nil {
			return nil, err
		}
		questions[i] = models.QuizQuestion{Text: q.Text, Options: options, CorrectIndex: int(q.CorrectIndex)}
	}
	return &models.Quiz{ID: row.ID, LessonID: row.LessonID, Questions: questions}, nil
}

func (s *Store) AddQuiz(ctx context.Context, quiz *models.Quiz) error {
	quiz.ID = uuid.NewString()
	return s.withTx(ctx, func(q *dbgen.Queries) error {
		if err := q.AddQuiz(ctx, dbgen.AddQuizParams{ID: quiz.ID, LessonID: quiz.LessonID}); err != nil {
			return err
		}
		for i, question := range quiz.Questions {
			optionsJSON, err := json.Marshal(question.Options)
			if err != nil {
				return err
			}
			if err := q.AddQuizQuestion(ctx, dbgen.AddQuizQuestionParams{
				ID:           uuid.NewString(),
				QuizID:       quiz.ID,
				Ordinal:      int64(i),
				Text:         question.Text,
				OptionsJson:  string(optionsJSON),
				CorrectIndex: int64(question.CorrectIndex),
			}); err != nil {
				return err
			}
		}
		return nil
	})
}

// --- Sync log ---

func (s *Store) GetSyncQueue(ctx context.Context) (models.SyncQueue, error) {
	count, err := s.queries.CountSyncLog(ctx)
	if err != nil {
		return models.SyncQueue{}, err
	}
	logs, err := s.queries.ListSyncLog(ctx)
	if err != nil {
		return models.SyncQueue{}, err
	}
	return models.SyncQueue{TransactionCount: int(count), Logs: logs}, nil
}

func (s *Store) EnqueueSync(ctx context.Context, action string) error {
	return s.queries.AddSyncLog(ctx, dbgen.AddSyncLogParams{
		Action:    action,
		CreatedAt: time.Now().Format(time.RFC3339),
	})
}

func (s *Store) ClearSyncQueue(ctx context.Context) (int, error) {
	var count int64
	err := s.withTx(ctx, func(q *dbgen.Queries) error {
		var err error
		count, err = q.CountSyncLog(ctx)
		if err != nil {
			return err
		}
		return q.ClearSyncLog(ctx)
	})
	if err != nil {
		return 0, err
	}
	return int(count), nil
}

// --- Server logs ---
//
// Durable, queryable counterpart to middleware.LogBuffer's in-memory tail.
// Writes always arrive batched via AddServerLogs (see middleware.LogPersister)
// so the request hot path never blocks on this table.

// nullableString round-trips a Go zero-value-means-unset filter field into
// the sql.NullString params sqlc generates for its optional
// "COALESCE(narg, col)" filter pattern — Valid=false is what makes the
// COALESCE fall through to the unfiltered column.
func nullableString(v string) sql.NullString {
	if v == "" {
		return sql.NullString{}
	}
	return sql.NullString{String: v, Valid: true}
}

func serverLogFromRow(r dbgen.ServerLog) models.ServerLog {
	return models.ServerLog{
		ID:        r.ID,
		Timestamp: r.Timestamp,
		Level:     r.Level,
		Message:   r.Message,
		Fields:    r.Fields,
	}
}

// AddServerLogs inserts a batch in one transaction — the persister calls this
// every few seconds instead of once per call site.
func (s *Store) AddServerLogs(ctx context.Context, logs []models.ServerLog) error {
	if len(logs) == 0 {
		return nil
	}
	return s.withTx(ctx, func(q *dbgen.Queries) error {
		for _, l := range logs {
			if err := q.AddServerLog(ctx, dbgen.AddServerLogParams{
				Timestamp: l.Timestamp,
				Level:     l.Level,
				Message:   l.Message,
				Fields:    l.Fields,
			}); err != nil {
				return err
			}
		}
		return nil
	})
}

// ListServerLogs applies exact-match filters plus, when search is non-empty,
// a full-text match against the FTS5 index over message. It fetches one row
// past limit to report hasMore without a separate COUNT query.
func (s *Store) ListServerLogs(ctx context.Context, filter models.ServerLogFilter, search string, limit, offset int) ([]models.ServerLog, bool, error) {
	fetchLimit := int64(limit + 1)
	level := nullableString(filter.Level)
	from := nullableString(filter.From)
	to := nullableString(filter.To)

	var rows []dbgen.ServerLog
	var err error
	if search != "" {
		// Wrap as a quoted FTS5 phrase so raw user input (which may contain
		// FTS operators like AND/OR/-/*) is always treated as literal text.
		phrase := `"` + strings.ReplaceAll(search, `"`, `""`) + `"`
		rows, err = s.queries.SearchServerLogs(ctx, dbgen.SearchServerLogsParams{
			Query: phrase, Level: level, FromTs: from, ToTs: to,
			Limit: fetchLimit, Offset: int64(offset),
		})
	} else {
		rows, err = s.queries.ListServerLogs(ctx, dbgen.ListServerLogsParams{
			Level: level, FromTs: from, ToTs: to,
			Limit: fetchLimit, Offset: int64(offset),
		})
	}
	if err != nil {
		return nil, false, err
	}

	hasMore := len(rows) > limit
	if hasMore {
		rows = rows[:limit]
	}
	logs := make([]models.ServerLog, len(rows))
	for i, r := range rows {
		logs[i] = serverLogFromRow(r)
	}
	return logs, hasMore, nil
}

// DeleteOldServerLogs removes entries older than cutoff (RFC3339) — called
// periodically by middleware.LogPersister per LOG_RETENTION_DAYS.
func (s *Store) DeleteOldServerLogs(ctx context.Context, cutoff string) (int64, error) {
	return s.queries.DeleteOldServerLogs(ctx, cutoff)
}

// GetServerLogStats aggregates counts over [from, to] (RFC3339) for the
// observability dashboard.
func (s *Store) GetServerLogStats(ctx context.Context, from, to string) (models.ServerLogStats, error) {
	total, err := s.queries.CountServerLogsTotal(ctx, dbgen.CountServerLogsTotalParams{Timestamp: from, Timestamp_2: to})
	if err != nil {
		return models.ServerLogStats{}, err
	}
	byLevel, err := s.queries.CountServerLogsByLevel(ctx, dbgen.CountServerLogsByLevelParams{Timestamp: from, Timestamp_2: to})
	if err != nil {
		return models.ServerLogStats{}, err
	}

	stats := models.ServerLogStats{
		Total:   total,
		ByLevel: make(map[string]int64, len(byLevel)),
	}
	for _, r := range byLevel {
		stats.ByLevel[r.Level] = r.Count
	}
	return stats, nil
}
