import { Navigate } from "react-router-dom";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { getRedirectPath } from "./lib/rbac";
import ProtectedRoute from "./components/common/ProtectedRoute";
import RootLayout from "./components/layout/RootLayout";
import Login from "./pages/Login";
import StudentDashboard from "./pages/student/Dashboard";
import Library from "./pages/Library";
import LibraryDetail from "./pages/LibraryDetail";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import LessonEditor from "./pages/LessonEditor";
import LessonViewer from "./pages/LessonViewer";
import QuizEditor from "./pages/QuizEditor";
import QuizViewer from "./pages/QuizViewer";
import ForumThread from "./pages/ForumThread";
import AdminPanel from "./pages/admin/AdminPanel";
import Monitor from "./pages/admin/Monitor";
import Logs from "./pages/admin/Logs";
import NotFound from "./pages/NotFound";

function HomeRedirect() {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <Navigate to={getRedirectPath(currentUser.role)} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={<ProtectedRoute><RootLayout /></ProtectedRoute>}
      >
        <Route index element={<HomeRedirect />} />
        <Route path="dashboard" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
        <Route path="library" element={<Library />} />
        <Route path="library/:id" element={<LibraryDetail />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/:courseId" element={<CourseDetail />} />
        <Route path="courses/:courseId/lessons/new" element={<ProtectedRoute role="admin"><LessonEditor /></ProtectedRoute>} />
        <Route path="courses/:courseId/lessons/:lessonId/edit" element={<ProtectedRoute role="admin"><LessonEditor /></ProtectedRoute>} />
        <Route path="courses/:courseId/lessons/:lessonId" element={<LessonViewer />} />
        <Route path="courses/:courseId/quizzes/new" element={<ProtectedRoute role="admin"><QuizEditor /></ProtectedRoute>} />
        <Route path="courses/:courseId/quizzes/:quizId/edit" element={<ProtectedRoute role="admin"><QuizEditor /></ProtectedRoute>} />
        <Route path="courses/:courseId/quizzes/:quizId" element={<QuizViewer />} />
        <Route path="courses/:courseId/forum/:postId" element={<ForumThread />} />
        <Route path="admin" element={<ProtectedRoute role="admin"><AdminPanel /></ProtectedRoute>} />
        <Route path="admin/monitor" element={<ProtectedRoute role="admin"><Monitor /></ProtectedRoute>} />
        <Route path="admin/logs" element={<ProtectedRoute role="admin"><Logs /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
