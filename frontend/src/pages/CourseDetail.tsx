import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { Lesson, Quiz } from "../types";
import { canCreateCourse } from "../lib/rbac";
import { Card, Button } from "../components/ui";
import { ArrowLeft, BookOpen, FileQuestion, PlusCircle, Play, Edit } from "lucide-react";

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const [course, setCourse] = useState<{ course: any; lessons: Lesson[] } | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  const tab = searchParams.get("tab") === "quizzes" ? "quizzes" : "lessons";
  const setTab = (t: "lessons" | "quizzes") => setSearchParams(t === "lessons" ? {} : { tab: t });

  const load = () => {
    if (!courseId) return;
    api.getCourse(courseId).then(setCourse).catch(() => { });
    api.getCourseQuizzes(courseId).then(setQuizzes).catch(() => { });
  };

  useEffect(() => { load(); }, [courseId]);

  if (!course) return <p className="text-slate-400">Cargando...</p>;

  const canEdit = currentUser && canCreateCourse(currentUser.role);

  return (
    <div className="space-y-6">
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
          ) : (
            <Link to={`/courses/${courseId}/quizzes/new`}>
              <Button>
                <PlusCircle size={16} className="mr-1.5 inline" />
                Nuevo Cuestionario
              </Button>
            </Link>
          )
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
      </div>

      {tab === "lessons" ? (
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
      ) : (
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
                        {quiz.lessonId ? "Vinculado a una lección" : "Independiente"} · {quiz.questions.length} preguntas
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
    </div>
  );
}
