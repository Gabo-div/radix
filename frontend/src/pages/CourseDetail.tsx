import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { Lesson } from "../types";
import { canCreateCourse } from "../lib/rbac";
import { Card, Button } from "../components/ui";
import { ArrowLeft, BookOpen, PlusCircle, Play, Edit } from "lucide-react";

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const { currentUser } = useAuth();
  const [course, setCourse] = useState<{ course: any; lessons: Lesson[] } | null>(null);

  const load = () => {
    if (courseId) api.getCourse(courseId).then(setCourse).catch(() => { });
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
          <Link to={`/courses/${courseId}/lessons/new`}>
            <Button>
              <PlusCircle size={16} className="mr-1.5 inline" />
              Nueva Lección
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-col space-y-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <BookOpen size={18} />
          Lecciones ({course.lessons.length})
        </h2>
        {course.lessons.map((lesson, idx) => (
          <div className="flex items-center gap-2">
            <Link to={`/courses/${courseId}/lessons/${lesson.id}`} className="flex-1">
              <Card className="flex items-center justify-between hover:border-indigo-500/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center text-xs text-slate-400 font-medium">
                    {idx + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">{lesson.title}</h3>
                    <p className="text-xs text-slate-500">
                      {lesson.libraryItemId ? "Con contenido multimedia" : "Solo texto"}
                      {lesson.quizId ? " · Con evaluación" : ""}
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
    </div>
  );
}
