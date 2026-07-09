import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { Lesson, Quiz, CourseStudent, LibraryItem } from "../types";
import { canCreateCourse } from "../lib/rbac";
import { Card, Button, Badge } from "../components/ui";
import StudentPickerModal from "../components/common/StudentPickerModal";
import Forum from "../components/Forum";
import {
  ArrowLeft, BookOpen, FileQuestion, Users, Paperclip, MessageSquare, PlusCircle, Play, Edit, Lock, X,
  FileVideo, FileAudio, FileImage, FileText, File,
} from "lucide-react";

type Tab = "lessons" | "quizzes" | "students" | "resources" | "forum";

const typeIcon: Record<string, typeof FileVideo> = {
  video: FileVideo, audio: FileAudio, image: FileImage,
  pdf: FileText, text: FileText, document: File,
};

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const [course, setCourse] = useState<{ course: any; lessons: Lesson[] } | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [students, setStudents] = useState<CourseStudent[]>([]);
  const [resources, setResources] = useState<LibraryItem[]>([]);
  const [error, setError] = useState("");
  const [showStudentPicker, setShowStudentPicker] = useState(false);

  const tabParam = searchParams.get("tab");
  const tab: Tab =
    tabParam === "quizzes" || tabParam === "students" || tabParam === "resources" || tabParam === "forum"
      ? tabParam
      : "lessons";
  const setTab = (t: Tab) => setSearchParams(t === "lessons" ? {} : { tab: t });

  const canEdit = currentUser && canCreateCourse(currentUser.role);

  const loadStudents = () => {
    if (courseId) api.getEnrolledStudents(courseId).then(setStudents).catch(() => { });
  };

  useEffect(() => {
    if (!courseId) return;
    setError("");
    api.getCourse(courseId).then(setCourse).catch((err) => setError(err.message));
    api.getCourseQuizzes(courseId).then(setQuizzes).catch(() => { });
    api.getCourseResources(courseId).then(setResources).catch(() => { });
  }, [courseId]);

  useEffect(() => {
    if (tab === "students" && canEdit) loadStudents();
  }, [tab, canEdit, courseId]);

  if (error) {
    return (
      <div className="space-y-6">
        <Link to="/courses" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={16} /> Volver a cursos
        </Link>
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <Lock size={32} className="text-slate-500" />
          <p className="text-slate-300">No estás inscrito en este curso.</p>
        </Card>
      </div>
    );
  }

  if (!course) return <p className="text-slate-400">Cargando...</p>;

  const handleEnroll = (userId: string) => {
    if (!courseId) return;
    api.enrollStudent(courseId, userId).then(loadStudents).catch((err) => alert(err.message));
  };

  const handleUnenroll = (userId: string) => {
    if (!courseId) return;
    api.unenrollStudent(courseId, userId).then(loadStudents).catch((err) => alert(err.message));
  };

  return (
    <div className="space-y-6">
      {showStudentPicker && courseId && (
        <StudentPickerModal courseId={courseId} onSelect={handleEnroll} onClose={() => setShowStudentPicker(false)} />
      )}

      <Link to="/courses" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={16} />
        Volver a cursos
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{course.course.title}</h1>
          <p className="text-slate-400 mt-1">{course.course.description}</p>
        </div>
        {canEdit && (
          tab === "lessons" ? (
            <Link to={`/courses/${courseId}/lessons/new`}>
              <Button>
                <PlusCircle size={16} className="mr-1.5 inline" />
                Nueva Lección
              </Button>
            </Link>
          ) : tab === "quizzes" ? (
            <Link to={`/courses/${courseId}/quizzes/new`}>
              <Button>
                <PlusCircle size={16} className="mr-1.5 inline" />
                Nuevo Cuestionario
              </Button>
            </Link>
          ) : tab === "students" ? (
            <Button onClick={() => setShowStudentPicker(true)}>
              <PlusCircle size={16} className="mr-1.5 inline" />
              Agregar Estudiante
            </Button>
          ) : null
        )}
      </div>

      <div className="flex border-b border-slate-700">
        <button onClick={() => setTab("lessons")}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${tab === "lessons" ? "text-indigo-400 border-b-2 border-indigo-500" : "text-slate-400 hover:text-white"}`}>
          <BookOpen size={14} /> Lecciones ({course.lessons.length})
        </button>
        <button onClick={() => setTab("quizzes")}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${tab === "quizzes" ? "text-indigo-400 border-b-2 border-indigo-500" : "text-slate-400 hover:text-white"}`}>
          <FileQuestion size={14} /> Cuestionarios ({quizzes.length})
        </button>
        <button onClick={() => setTab("resources")}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${tab === "resources" ? "text-indigo-400 border-b-2 border-indigo-500" : "text-slate-400 hover:text-white"}`}>
          <Paperclip size={14} /> Recursos ({resources.length})
        </button>
        <button onClick={() => setTab("forum")}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${tab === "forum" ? "text-indigo-400 border-b-2 border-indigo-500" : "text-slate-400 hover:text-white"}`}>
          <MessageSquare size={14} /> Foro
        </button>
        {canEdit && (
          <button onClick={() => setTab("students")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${tab === "students" ? "text-indigo-400 border-b-2 border-indigo-500" : "text-slate-400 hover:text-white"}`}>
            <Users size={14} /> Estudiantes ({students.length})
          </button>
        )}
      </div>

      {tab === "lessons" && (
        <div className="flex flex-col space-y-3">
          {course.lessons.map((lesson, idx) => (
            <div key={lesson.id} className="flex items-center gap-2">
              <Link to={`/courses/${courseId}/lessons/${lesson.id}`} className="flex-1">
                <Card className="flex items-center justify-between hover:border-indigo-500/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs text-slate-400 font-medium">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white">{lesson.title}</h3>
                      <p className="text-xs text-slate-500">
                        {lesson.quizId ? "Con evaluación" : "Solo texto"}
                      </p>
                    </div>
                  </div>
                  <Play size={16} className="text-slate-500" />
                </Card>
              </Link>
              {canEdit && (
                <Link to={`/courses/${courseId}/lessons/${lesson.id}/edit`}
                  className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-indigo-300 transition-colors"
                  title="Editar lección">
                  <Edit size={16} />
                </Link>
              )}
            </div>
          ))}
          {course.lessons.length === 0 && (
            <p className="text-slate-500 text-sm">Este curso aún no tiene lecciones.</p>
          )}
        </div>
      )}

      {tab === "quizzes" && (
        <div className="flex flex-col space-y-3">
          {quizzes.map((quiz, idx) => (
            <div key={quiz.id} className="flex items-center gap-2">
              <Link to={`/courses/${courseId}/quizzes/${quiz.id}`} className="flex-1">
                <Card className="flex items-center justify-between hover:border-indigo-500/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs text-slate-400 font-medium">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white">{quiz.title}</h3>
                      <p className="text-xs text-slate-500">
                        {quiz.lessonId ? "Vinculado a una lección" : "Independiente"} · {quiz.questions.length} preguntas · Vale {quiz.value} pts
                      </p>
                    </div>
                  </div>
                  <Play size={16} className="text-slate-500" />
                </Card>
              </Link>
              {canEdit && (
                <Link to={`/courses/${courseId}/quizzes/${quiz.id}/edit`}
                  className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-indigo-300 transition-colors"
                  title="Editar cuestionario">
                  <Edit size={16} />
                </Link>
              )}
            </div>
          ))}
          {quizzes.length === 0 && (
            <p className="text-slate-500 text-sm">Este curso aún no tiene cuestionarios.</p>
          )}
        </div>
      )}

      {tab === "resources" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {resources.map((item) => {
            const Icon = typeIcon[item.type] || File;
            return (
              <Link key={item.id} to={`/library/${item.id}`}>
                <Card className="flex items-start gap-4 h-full hover:border-indigo-500/50 transition-colors cursor-pointer">
                  <Icon size={28} className="text-indigo-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-white truncate">{item.title}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge>{item.type}</Badge>
                      <Badge>{item.category}</Badge>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
          {resources.length === 0 && (
            <p className="text-slate-500 text-sm col-span-full">Ninguna lección o cuestionario de este curso enlaza archivos todavía.</p>
          )}
        </div>
      )}

      {tab === "forum" && courseId && (
        <Forum courseId={courseId} canPost={!!currentUser && currentUser.role !== "guest"} />
      )}

      {tab === "students" && canEdit && (
        <Card>
          {students.length === 0 ? (
            <p className="text-slate-500 text-sm">Ningún estudiante inscrito todavía.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 uppercase tracking-wider border-b border-slate-700">
                  <th className="py-2 pr-4 font-medium">Nombre</th>
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pr-4 font-medium">Puntos</th>
                  <th className="py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-slate-700/50 last:border-0">
                    <td className="py-2.5 pr-4 text-white">{s.name}</td>
                    <td className="py-2.5 pr-4 text-slate-400">{s.email}</td>
                    <td className="py-2.5 pr-4 text-slate-300">{s.points}</td>
                    <td className="py-2.5 text-right">
                      <button onClick={() => handleUnenroll(s.id)}
                        className="p-1.5 rounded hover:bg-slate-700 text-slate-500 hover:text-red-400 transition-colors"
                        title="Quitar del curso">
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </div>
  );
}
