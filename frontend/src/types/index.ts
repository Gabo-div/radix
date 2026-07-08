export type Role = "admin" | "student" | "guest";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  points: number;
  completedLessons: string[];
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

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
}

export interface SyncQueue {
  transactionCount: number;
  logs: string[];
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
  earnedXP: number;
  passed: boolean;
  totalPoints: number;
}

export interface MonitorData {
  diskKB: number;
  activeUsers: number;
  syncQueue: SyncQueue;
}

export interface ForceSyncResponse {
  synced: number;
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
