export type Role = "admin" | "student" | "guest";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  completedLessons: string[];
  enrolledCourses: string[];
}

// CourseStudent.points is scoped to one course (sum of quiz grades within it)
// — there's no global points concept anymore.
export interface CourseStudent {
  id: string;
  name: string;
  email: string;
  points: number;
}

// ForumPost.parentId null = top-level post; otherwise a reply to another post
// (which may itself be a reply) — the tree is built client-side from the flat
// per-course list GET /courses/:id/forum returns.
export interface ForumPost {
  id: string;
  courseId: string;
  parentId: string | null;
  userId: string;
  authorName: string;
  authorRole: Role;
  title: string;
  body: string;
  createdAt: string;
  likeCount: number;
  liked: boolean;
}

export interface LibraryItem {
  id: string;
  title: string;
  type: string;
  category: string;
  sizeKB: number;
  mimeType: string;
  originalFilename: string;
  uploadedBy: string;
  uploadedAt: string;
  modifiedAt: string;
  duration?: string;
  resolution?: string;
}

export interface QuizQuestion {
  text: string;
  options: string[];
  correctIndex: number;
}

export interface Quiz {
  id: string;
  courseId: string;
  lessonId: string | null;
  title: string;
  description: string;
  value: number;
  questions: QuizQuestion[];
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  contentText: string;
  quizId: string | null;
}

export interface LessonUsage {
  lessonId: string;
  courseId: string;
  lessonTitle: string;
  courseTitle: string;
}

export interface QuizUsage {
  quizId: string;
  courseId: string;
  quizTitle: string;
  courseTitle: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
}

/** Un nodo par del que este servidor tira operaciones. */
export interface SyncPeer {
  peer: string;
  nodeId: string;
  /** Hasta dónde se leyó el registro de ese nodo. */
  lastSeq: number;
  lastSyncAt: string;
  lastError: string;
}

export interface SyncQueue {
  /** Operaciones que ningún nodo par confirmó haber leído todavía. */
  transactionCount: number;
  /** Etiquetas de esas operaciones, las más recientes primero. */
  logs: string[];
  peers: SyncPeer[];
}

/** Resultado de tirar una vez de un nodo par. */
export interface SyncResult {
  peer: string;
  nodeId: string;
  pulled: number;
  applied: number;
  skipped: number;
  error?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CourseDetailResponse {
  course: Course;
  lessons: Lesson[];
}

export interface LessonDetailResponse {
  lesson: Lesson;
  quiz?: Quiz;
}

export interface QuizSubmitResponse {
  score: number;
  correct: number;
  total: number;
  grade: number;
  quizValue: number;
  passed: boolean;
  totalPoints: number;
}

export interface MonitorData {
  diskKB: number;
  activeUsers: number;
  syncQueue: SyncQueue;
}

export interface ForceSyncResponse {
  results: SyncResult[];
  message: string;
}

export interface ServerLog {
  id: number;
  timestamp: string;
  level: string;
  message: string;
  fields: string;
}

export interface LogSearchResponse {
  logs: ServerLog[];
  hasMore: boolean;
}

export interface LogSearchFilters {
  level?: string;
  from?: string;
  to?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export interface ServerLogStats {
  total: number;
  byLevel: Record<string, number>;
}

export interface LogStatsResponse {
  stats: ServerLogStats;
  retentionDays: number;
}

export interface TableImport {
  name: string;
  /** Filas que entraron: nuevas, o que reemplazaron a una versión más antigua. */
  applied: number;
  /** Filas descartadas porque la copia local es más nueva. */
  skipped: number;
}

export interface BackupImportResponse {
  tables: TableImport[];
  uploads: number;
}
