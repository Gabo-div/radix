import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { canEdit } from "../lib/rbac";
import { extractToc } from "../lib/markdown";
import type { TocEntry } from "../lib/markdown";
import type { LibraryItem, LessonUsage, QuizUsage } from "../types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLesson, useLessonLinks, useLessonUsage } from "@/hooks/useLessons";
import { readingWidthClass, useAppearance } from "../context/AppearanceContext";
import LessonSidebar from "../components/layout/LessonSidebar";
import WikiContent from "../components/WikiContent";
import { Edit, Lock } from "lucide-react";
import BackLink from "../components/common/BackLink";

export default function LessonViewer() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const { currentUser } = useAuth();
  const { width } = useAppearance();

  const { data, error, isPending } = useLesson(courseId, lessonId);
  const { data: links } = useLessonLinks(lessonId);
  const { data: usage = [] } = useLessonUsage(lessonId);

  const linkedItems = links?.libraryItems ?? [];
  const linkedLessons = links?.lessons ?? [];
  // Solo los cuestionarios enlazados con [[id]], igual que los archivos y las
  // lecciones. El cuestionario adjunto por quizzes.lesson_id no se muestra
  // aquí: vive en la pestaña "Cuestionarios" del curso.
  const linkedQuizzes = links?.quizzes ?? [];

  const isAdmin = currentUser && canEdit(currentUser.role);

  const lessonText = data?.lesson?.contentText || "";
  const relatedLessons = useMemo(() => {
    const map: Record<string, LessonUsage> = {};
    for (const l of [...linkedLessons, ...usage]) if (l.lessonId !== lessonId) map[l.lessonId] = l;
    return Object.values(map);
  }, [linkedLessons, usage, lessonId]);
  const toc: TocEntry[] = extractToc(lessonText);

  const itemMap = useMemo(() => {
    const m: Record<string, LibraryItem> = {};
    for (const item of linkedItems) m[item.id] = item;
    return m;
  }, [linkedItems]);

  const lessonMap = useMemo(() => {
    const m: Record<string, LessonUsage> = {};
    for (const l of linkedLessons) m[l.lessonId] = l;
    return m;
  }, [linkedLessons]);

  const quizMap = useMemo(() => {
    const m: Record<string, QuizUsage> = {};
    for (const q of linkedQuizzes) m[q.quizId] = q;
    return m;
  }, [linkedQuizzes]);

  if (error) {
    return (
      <div className="space-y-6">
        <BackLink fallback={`/courses/${courseId}`} />
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <Lock size={32} className="text-muted-foreground" />
          <p className="text-foreground/90">No estás inscrito en este curso.</p>
        </Card>
      </div>
    );
  }

  if (isPending || !data) return <p className="text-muted-foreground">Cargando lección...</p>;

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-6">
        <BackLink fallback={`/courses/${courseId}`} />

        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground" id="top">{data.lesson.title}</h1>
          {isAdmin && (
            <Link to={`/courses/${courseId}/lessons/${lessonId}/edit`}>
              <Button variant="secondary">
                <Edit size={14} /> Editar
              </Button>
            </Link>
          )}
        </div>

        <div className="flex w-full gap-4">
          {/* La anchura de lectura del panel de apariencia se aplica acá: es la
              columna del contenido, no la página entera. */}
          <div className={`flex flex-col flex-1 gap-4 ${readingWidthClass(width)}`}>
            <Card>
              <WikiContent text={lessonText} itemMap={itemMap} lessonMap={lessonMap} quizMap={quizMap} />
            </Card>
          </div>

          <div className="min-w-64 shrink-0 hidden lg:block">
            <LessonSidebar toc={toc} linkedItems={linkedItems} relatedLessons={relatedLessons} linkedQuizzes={linkedQuizzes} />
          </div>
        </div>
      </div>
    </div>
  );
}
