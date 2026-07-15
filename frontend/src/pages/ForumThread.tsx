import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { LibraryItem, LessonUsage, QuizUsage } from "@/types";
import { Card } from "@/components/ui/card";
import { useForumPosts, useForumLinks } from "@/hooks/useForum";
import ForumPostItem from "@/components/ForumPostItem";
import { ArrowLeft, Lock } from "lucide-react";

export default function ForumThread() {
  const { courseId, postId } = useParams<{ courseId: string; postId: string }>();
  const { currentUser } = useAuth();
  const { data: posts, error } = useForumPosts(courseId);
  const { data: links } = useForumLinks(courseId);

  // Same course-wide link bundle the forum list uses — ids are globally
  // unique, so it resolves every post's [[id]] refs, this thread's included.
  const linkedItems = links?.libraryItems ?? [];
  const linkedLessons = links?.lessons ?? [];
  const linkedQuizzes = links?.quizzes ?? [];

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

  const canPost = !!currentUser && currentUser.role !== "guest";

  if (error) {
    return (
      <div className="space-y-6">
        <Link to={`/courses/${courseId}?tab=forum`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={16} /> Volver al foro
        </Link>
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <Lock size={32} className="text-muted-foreground" />
          <p className="text-foreground/90">No estás inscrito en este curso.</p>
        </Card>
      </div>
    );
  }

  if (!posts) return <p className="text-muted-foreground">Cargando publicación...</p>;

  const root = posts.find((p) => p.id === postId);
  if (!root) return <p className="text-muted-foreground">Publicación no encontrada.</p>;

  return (
    <div className="space-y-4">
      <Link to={`/courses/${courseId}?tab=forum`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={16} /> Volver al foro
      </Link>
      <ForumPostItem
        post={root}
        posts={posts}
        canPost={canPost}
        depth={0}
        itemMap={itemMap}
        lessonMap={lessonMap}
        quizMap={quizMap}
      />
    </div>
  );
}
