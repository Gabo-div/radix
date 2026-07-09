import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { canTakeQuiz, canSeeQuiz, canEdit } from "../lib/rbac";
import { extractToc } from "../lib/markdown";
import type { TocEntry } from "../lib/markdown";
import type { LibraryItem, LessonUsage, Quiz } from "../types";
import { Card, Button } from "../components/ui";
import WikiContent from "../components/WikiContent";
import QuizTaker from "../components/QuizTaker";
import LessonSidebar from "../components/layout/LessonSidebar";
import { ArrowLeft, Edit, Lock } from "lucide-react";

export default function QuizViewer() {
  const { courseId, quizId } = useParams<{ courseId: string; quizId: string }>();
  const { currentUser } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [linkedItems, setLinkedItems] = useState<LibraryItem[]>([]);
  const [linkedLessons, setLinkedLessons] = useState<LessonUsage[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!quizId) return;
    setError("");
    api.getQuiz(quizId).then(setQuiz).catch((err) => setError(err.message));
    api.getQuizLinks(quizId).then(({ libraryItems, lessons }) => {
      setLinkedItems(libraryItems);
      setLinkedLessons(lessons);
    }).catch(() => { });
  }, [quizId]);

  const isStudent = currentUser && canTakeQuiz(currentUser.role);
  const showQuiz = currentUser && canSeeQuiz(currentUser.role);
  const isAdmin = currentUser && canEdit(currentUser.role);

  const toc: TocEntry[] = useMemo(() => extractToc(quiz?.description || ""), [quiz]);

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

  if (error) {
    return (
      <div className="space-y-6">
        <Link to={`/courses/${courseId}?tab=quizzes`} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={16} /> Volver al curso
        </Link>
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <Lock size={32} className="text-slate-500" />
          <p className="text-slate-300">No estás inscrito en este curso.</p>
        </Card>
      </div>
    );
  }

  if (!quiz) return <p className="text-slate-400">Cargando cuestionario...</p>;

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0 space-y-6">
        <Link to={`/courses/${courseId}?tab=quizzes`} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={16} /> Volver al curso
        </Link>

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">{quiz.title}</h1>
          {isAdmin && (
            <Link to={`/courses/${courseId}/quizzes/${quizId}/edit`}>
              <Button variant="secondary">
                <Edit size={14} className="mr-1 inline" /> Editar
              </Button>
            </Link>
          )}
        </div>

        <div className="flex w-full gap-4">
          <div className="flex flex-col flex-1 gap-4">
            {quiz.description && (
              <Card>
                <WikiContent text={quiz.description} itemMap={itemMap} lessonMap={lessonMap} />
              </Card>
            )}

            <QuizTaker quiz={quiz} canSee={!!showQuiz} canSubmit={!!isStudent} />
          </div>

          <div className="min-w-64 shrink-0 hidden lg:block">
            <LessonSidebar toc={toc} linkedItems={linkedItems} relatedLessons={linkedLessons} />
          </div>
        </div>
      </div>
    </div>
  );
}
