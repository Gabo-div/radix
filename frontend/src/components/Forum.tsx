import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { extractWikiRefs, stripWikiLinks } from "../lib/markdown";
import type { ForumPost, LibraryItem, LessonUsage, QuizUsage } from "../types";
import { Card } from "./ui";
import ForumComposer from "./ForumComposer";
import { Heart, MessageSquare, Paperclip, BookOpen, FileQuestion } from "lucide-react";

interface Props {
  courseId: string;
  canPost: boolean;
}

function countReplies(posts: ForumPost[], id: string): number {
  const children = posts.filter((p) => p.parentId === id);
  return children.length + children.reduce((sum, c) => sum + countReplies(posts, c.id), 0);
}

interface LinkBadge {
  key: string;
  to: string;
  label: string;
  icon: typeof Paperclip;
}

// The forum tab is a list of threads only — each links to its own page
// (ForumThread) which shows the root post and its full reply tree.
export default function Forum({ courseId, canPost }: Props) {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [linkedItems, setLinkedItems] = useState<LibraryItem[]>([]);
  const [linkedLessons, setLinkedLessons] = useState<LessonUsage[]>([]);
  const [linkedQuizzes, setLinkedQuizzes] = useState<QuizUsage[]>([]);

  const load = () => {
    api.getForumPosts(courseId).then(setPosts).catch(() => {});
    // One course-wide bundle resolves every post's own [[id]] refs (ids are
    // globally unique) — used here just to render link badges per post.
    api.getForumLinks(courseId).then(({ libraryItems, lessons, quizzes }) => {
      setLinkedItems(libraryItems);
      setLinkedLessons(lessons);
      setLinkedQuizzes(quizzes);
    }).catch(() => {});
  };

  useEffect(() => { load(); }, [courseId]);

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

  const linkBadges = (body: string): LinkBadge[] =>
    extractWikiRefs(body)
      .map((id) => {
        const item = itemMap[id];
        if (item) return { key: id, to: `/library/${id}`, label: item.title, icon: Paperclip };
        const lesson = lessonMap[id];
        if (lesson) return { key: id, to: `/courses/${lesson.courseId}/lessons/${id}`, label: lesson.lessonTitle, icon: BookOpen };
        const quiz = quizMap[id];
        if (quiz) return { key: id, to: `/courses/${quiz.courseId}/quizzes/${id}`, label: quiz.quizTitle, icon: FileQuestion };
        return null;
      })
      .filter((b): b is LinkBadge => b !== null);

  const topLevel = posts
    .filter((p) => p.parentId === null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-4">
      {canPost && (
        <Card>
          <ForumComposer
            courseId={courseId}
            placeholder="Escribe un post para el foro del curso..."
            submitLabel="Publicar"
            requireTitle
            onSubmit={async ({ title, body }) => { await api.createForumPost(courseId, { title, body }); load(); }}
          />
        </Card>
      )}

      <div className="flex flex-col space-y-3">
        {topLevel.map((post) => (
          <Card key={post.id} className="hover:border-indigo-500/50 transition-colors">
            <Link to={`/courses/${courseId}/forum/${post.id}`} className="block">
              <h3 className="text-base font-semibold text-white mb-1">{post.title}</h3>
              <p className="text-sm text-slate-400 line-clamp-2 whitespace-pre-wrap">{stripWikiLinks(post.body)}</p>
            </Link>
            {linkBadges(post.body).length > 0 && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {linkBadges(post.body).map((b) => {
                  const Icon = b.icon;
                  return (
                    <Link key={b.key} to={b.to} onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-slate-600 text-slate-300 hover:border-indigo-500 hover:text-indigo-300 transition-colors">
                      <Icon size={12} /> {b.label}
                    </Link>
                  );
                })}
              </div>
            )}
            <Link to={`/courses/${courseId}/forum/${post.id}`} className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              <span>{post.authorName}</span>
              <span className="flex items-center gap-1">
                <Heart size={12} className={post.liked ? "fill-current text-rose-400" : ""} /> {post.likeCount}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare size={12} /> {countReplies(posts, post.id)}
              </span>
              <span>{new Date(post.createdAt).toLocaleString("es-ES")}</span>
            </Link>
          </Card>
        ))}
        {posts.length === 0 && (
          <p className="text-slate-500 text-sm">Nadie ha publicado en el foro todavía.</p>
        )}
      </div>
    </div>
  );
}
