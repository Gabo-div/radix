import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { ForumPost, LibraryItem, LessonUsage, QuizUsage } from "../types";
import { Card } from "../components/ui";
import ForumPostItem from "../components/ForumPostItem";
import { ArrowLeft, Lock } from "lucide-react";

export default function ForumThread() {
  const { courseId, postId } = useParams<{ courseId: string; postId: string }>();
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [linkedItems, setLinkedItems] = useState<LibraryItem[]>([]);
  const [linkedLessons, setLinkedLessons] = useState<LessonUsage[]>([]);
  const [linkedQuizzes, setLinkedQuizzes] = useState<QuizUsage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    if (!courseId) return;
    setError("");
    api.getForumPosts(courseId)
      .then((p) => { setPosts(p); setLoaded(true); })
      .catch((err) => { setError(err.message); setLoaded(true); });
    // Same course-wide link bundle the forum list uses — ids are globally
    // unique, so it resolves every post's [[id]] refs, this thread's included.
    api.getForumLinks(courseId).then(({ libraryItems, lessons, quizzes }) => {
      setLinkedItems(libraryItems);
      setLinkedLessons(lessons);
      setLinkedQuizzes(quizzes);
    }).catch(() => {});
  };

  useEffect(() => { load(); }, [courseId, postId]);

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
        <Link to={`/courses/${courseId}?tab=forum`} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={16} /> Volver al foro
        </Link>
        <Card className="flex flex-col items-center gap-3 py-12 text-center">
          <Lock size={32} className="text-slate-500" />
          <p className="text-slate-300">No estás inscrito en este curso.</p>
        </Card>
      </div>
    );
  }

  if (!loaded) return <p className="text-slate-400">Cargando publicación...</p>;

  const root = posts.find((p) => p.id === postId);
  if (!root) return <p className="text-slate-400">Publicación no encontrada.</p>;

  return (
    <div className="space-y-4">
      <Link to={`/courses/${courseId}?tab=forum`} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Volver al foro
      </Link>
      <ForumPostItem
        post={root}
        posts={posts}
        canPost={canPost}
        onChange={load}
        depth={0}
        itemMap={itemMap}
        lessonMap={lessonMap}
        quizMap={quizMap}
      />
    </div>
  );
}
