import { Navigate } from "react-router-dom";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import AdminPanel from "./pages/admin/AdminPanel";
import Monitor from "./pages/admin/Monitor";
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
        <Route path="admin" element={<ProtectedRoute role="admin"><AdminPanel /></ProtectedRoute>} />
        <Route path="admin/monitor" element={<ProtectedRoute role="admin"><Monitor /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
