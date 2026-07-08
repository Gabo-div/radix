import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { canTakeQuiz, canSeeQuiz, canEdit } from "../lib/rbac";
import { extractToc } from "../lib/markdown";
import type { TocEntry } from "../lib/markdown";
import type { LibraryItem, LessonUsage } from "../types";
import { Card, Button } from "../components/ui";
import LessonSidebar from "../components/layout/LessonSidebar";
import WikiContent from "../components/WikiContent";
import QuizTaker from "../components/QuizTaker";
import { ArrowLeft, Edit } from "lucide-react";

export default function LessonViewer() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const { currentUser } = useAuth();
  const [data, setData] = useState<{ lesson: any; quiz?: any } | null>(null);
  const [linkedItems, setLinkedItems] = useState<LibraryItem[]>([]);
  const [linkedLessons, setLinkedLessons] = useState<LessonUsage[]>([]);
  const [usage, setUsage] = useState<LessonUsage[]>([]);

  const load = () => {
    if (courseId && lessonId) {
      api.getLesson(courseId, lessonId).then(setData).catch(() => { });
      // Scoped to this lesson's own [[id]] refs — not a full library/lesson fetch.
      api.getLessonLinks(lessonId).then(({ libraryItems, lessons }) => {
        setLinkedItems(libraryItems);
        setLinkedLessons(lessons);
      }).catch(() => { });
      api.getLessonUsage(lessonId).then(setUsage).catch(() => { });
    }
  };

  useEffect(() => { load(); }, [courseId, lessonId]);

  const isStudent = currentUser && canTakeQuiz(currentUser.role);
  const showQuiz = currentUser && canSeeQuiz(currentUser.role);
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

  if (!data) return <p className="text-slate-400">Cargando lección...</p>;

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-6">
        <Link to={`/courses/${courseId}`} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={16} /> Volver al curso
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white" id="top">{data.lesson.title}</h1>
          {isAdmin && (
            <Link to={`/courses/${courseId}/lessons/${lessonId}/edit`}>
              <Button variant="secondary">
                <Edit size={14} className="mr-1 inline" /> Editar
              </Button>
            </Link>
          )}
        </div>

        <div className="flex w-full gap-4">
          <div className="flex flex-col flex-1 gap-4">
            <Card>
              <WikiContent text={lessonText} itemMap={itemMap} lessonMap={lessonMap} />
            </Card>

            {data.quiz && (
              <QuizTaker
                quiz={data.quiz}
                canSee={!!showQuiz}
                canSubmit={!!isStudent}
                onSubmitted={(res) => { if (currentUser) currentUser.points = res.totalPoints; }}
              />
            )}
          </div>

          <div className="min-w-64 shrink-0 hidden lg:block">
            <LessonSidebar toc={toc} linkedItems={linkedItems} relatedLessons={relatedLessons} />
          </div>
        </div>
      </div>
    </div>
  );
}
