import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { canTakeQuiz, canSeeQuiz, canEdit } from "@/lib/rbac";
import { extractToc } from "@/lib/markdown";
import type { TocEntry } from "@/lib/markdown";
import type { LibraryItem, LessonUsage } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuiz, useQuizLinks } from "@/hooks/useQuizzes";
import WikiContent from "@/components/WikiContent";
import QuizTaker from "@/components/QuizTaker";
import LessonSidebar from "@/components/layout/LessonSidebar";
import ReadingLayout from "@/components/layout/ReadingLayout";
import { Edit, Lock } from "lucide-react";
import BackLink from "../components/common/BackLink";

export default function QuizViewer() {
  const { courseId, quizId } = useParams<{ courseId: string; quizId: string }>();
  const { currentUser } = useAuth();

  const { data: quiz, error } = useQuiz(quizId);
  const { data: links } = useQuizLinks(quizId);
  const linkedItems: LibraryItem[] = links?.libraryItems || [];
  const linkedLessons: LessonUsage[] = links?.lessons || [];

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
        <BackLink fallback={`/courses/${courseId}?tab=quizzes`} />
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <Lock size={32} className="text-muted-foreground" />
          <p className="text-foreground/90">No estás inscrito en este curso.</p>
        </Card>
      </div>
    );
  }

  if (!quiz) return <p className="text-muted-foreground">Cargando cuestionario...</p>;

  return (
    <ReadingLayout
      sidebar={<LessonSidebar toc={toc} linkedItems={linkedItems} relatedLessons={linkedLessons} />}
    >
      <BackLink fallback={`/courses/${courseId}?tab=quizzes`} />

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-foreground">{quiz.title}</h1>
        {isAdmin && (
          <Link to={`/courses/${courseId}/quizzes/${quizId}/edit`}>
            <Button variant="secondary">
              <Edit size={14} /> Editar
            </Button>
          </Link>
        )}
      </div>

      {quiz.description && (
        <Card>
          <WikiContent text={quiz.description} itemMap={itemMap} lessonMap={lessonMap} />
        </Card>
      )}

      <QuizTaker quiz={quiz} canSee={!!showQuiz} canSubmit={!!isStudent} />
    </ReadingLayout>
  );
}
