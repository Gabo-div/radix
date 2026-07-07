import type {
  User,
  LibraryItem,
  Quiz,
  Lesson,
  Course,
  LoginResponse,
  CourseDetailResponse,
  LessonDetailResponse,
  QuizSubmitResponse,
  MonitorData,
  ForceSyncResponse,
} from "../types";

let _token: string | null = localStorage.getItem("radix_token");

export function setToken(token: string | null) {
  _token = token;
  if (token) localStorage.setItem("radix_token", token);
  else localStorage.removeItem("radix_token");
}

export function getToken(): string | null {
  return _token;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {};
  const isFormData = options?.body instanceof FormData;
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (_token) headers["Authorization"] = `Bearer ${_token}`;
  const res = await fetch(path, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  if (res.status === 204 || res.headers.get("content-length") === "0") return undefined as T;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res as unknown as T;
}

export const api = {
  login: (role: string) =>
    request<LoginResponse>("/api/v1/auth/login", { method: "POST", body: JSON.stringify({ role }) }),

  logout: () => request<void>("/api/v1/auth/logout", { method: "POST" }),

  getLibrary: (type?: string, category?: string) => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (category) params.set("category", category);
    const qs = params.toString();
    return request<LibraryItem[]>(`/api/v1/library${qs ? "?" + qs : ""}`);
  },

  getLibraryItem: (id: string) =>
    request<LibraryItem>(`/api/v1/library/${id}`),

  updateLibraryItem: (id: string, data: { title?: string; category?: string }) =>
    request<LibraryItem>(`/api/v1/library/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  getLibraryFileUrl: (id: string) =>
    `/api/v1/library/${id}/file?token=${getToken()}`,

  addLibraryItem: (title: string, category: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", title);
    fd.append("category", category);
    return request<LibraryItem>("/api/v1/library", { method: "POST", body: fd });
  },

  addLibraryItemLegacy: (title: string, type: string, category: string) =>
    request<LibraryItem>("/api/v1/library", {
      method: "POST",
      body: JSON.stringify({ title, type, category }),
    }),

  getCourses: () => request<Course[]>("/api/v1/courses"),

  getCourse: (id: string) => request<CourseDetailResponse>(`/api/v1/courses/${id}`),

  addCourse: (title: string, description: string, category: string) =>
    request<Course>("/api/v1/courses", { method: "POST", body: JSON.stringify({ title, description, category }) }),

  addLesson: (courseId: string, title: string, contentText: string) =>
    request<Lesson>(`/api/v1/courses/${courseId}/lessons`, { method: "POST", body: JSON.stringify({ title, contentText }) }),

  getLesson: (courseId: string, lessonId: string) =>
    request<LessonDetailResponse>(`/api/v1/courses/${courseId}/lessons/${lessonId}`),

  updateLesson: (id: string, title: string, contentText: string) =>
    request<Lesson>(`/api/v1/lessons/${id}`, { method: "PUT", body: JSON.stringify({ title, contentText }) }),

  linkLibraryItem: (lessonId: string, libraryItemId: string) =>
    request<Lesson>(`/api/v1/lessons/${lessonId}/link`, { method: "PATCH", body: JSON.stringify({ libraryItemId }) }),

  createQuiz: (lessonId: string, questions: Quiz["questions"]) =>
    request<Quiz>("/api/v1/quizzes", { method: "POST", body: JSON.stringify({ lessonId, questions }) }),

  getQuiz: (id: string) => request<Quiz>(`/api/v1/quizzes/${id}`),

  submitQuiz: (id: string, answers: number[]) =>
    request<QuizSubmitResponse>(`/api/v1/quizzes/${id}/submit`, { method: "POST", body: JSON.stringify({ answers }) }),

  getMonitor: () => request<MonitorData>("/api/v1/monitor"),

  forceSync: () => request<ForceSyncResponse>("/api/v1/monitor/sync", { method: "POST" }),

  getLogs: () => request<string[]>("/api/v1/logs"),
};
