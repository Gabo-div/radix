import { useState } from "react";
import { api } from "../lib/api";
import { roleLabels } from "../lib/rbac";
import type { ForumPost, LibraryItem, LessonUsage, QuizUsage } from "../types";
import { Badge } from "./ui";
import WikiContent from "./WikiContent";
import ForumComposer from "./ForumComposer";
import { Heart, MessageSquare } from "lucide-react";

const roleBadgeColor: Record<string, "emerald" | "indigo" | "amber"> = {
  admin: "emerald",
  student: "indigo",
  guest: "amber",
};

interface Props {
  post: ForumPost;
  posts: ForumPost[];
  canPost: boolean;
  onChange: () => void;
  depth: number;
  itemMap: Record<string, LibraryItem>;
  lessonMap: Record<string, LessonUsage>;
  quizMap: Record<string, QuizUsage>;
}

export default function ForumPostItem({ post, posts, canPost, onChange, depth, itemMap, lessonMap, quizMap }: Props) {
  const [showReply, setShowReply] = useState(false);
  const [liking, setLiking] = useState(false);

  const children = posts
    .filter((p) => p.parentId === post.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const toggleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      if (post.liked) await api.unlikeForumPost(post.id);
      else await api.likeForumPost(post.id);
      onChange();
    } catch (err) {
      alert((err as Error).message);
    }
    setLiking(false);
  };

  return (
    <div className={depth > 0 ? "ml-6 pl-4 border-l border-slate-700" : ""}>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4">
        {post.parentId === null && (
          <h3 className="text-base font-semibold text-white mb-2">{post.title}</h3>
        )}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-sm font-medium text-white">{post.authorName}</span>
          <Badge color={roleBadgeColor[post.authorRole] || "slate"}>{roleLabels[post.authorRole]}</Badge>
          <span className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleString("es-ES")}</span>
        </div>
        <WikiContent text={post.body} itemMap={itemMap} lessonMap={lessonMap} quizMap={quizMap} />
        <div className="flex items-center gap-4 mt-1">
          <button onClick={toggleLike} disabled={liking}
            className={`flex items-center gap-1 text-xs transition-colors ${post.liked ? "text-rose-400" : "text-slate-500 hover:text-rose-400"}`}>
            <Heart size={14} className={post.liked ? "fill-current" : ""} /> {post.likeCount}
          </button>
          {canPost && (
            <button onClick={() => setShowReply(!showReply)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-400 transition-colors">
              <MessageSquare size={14} /> Responder
            </button>
          )}
        </div>
        {showReply && (
          <div className="mt-3">
            <ForumComposer
              courseId={post.courseId}
              placeholder="Escribe una respuesta..."
              submitLabel="Responder"
              autoFocus
              onCancel={() => setShowReply(false)}
              onSubmit={async ({ body }) => {
                await api.createForumPost(post.courseId, { parentId: post.id, body });
                setShowReply(false);
                onChange();
              }}
            />
          </div>
        )}
      </div>
      {children.length > 0 && (
        <div className="mt-2 space-y-2">
          {children.map((child) => (
            <ForumPostItem
              key={child.id}
              post={child}
              posts={posts}
              canPost={canPost}
              onChange={onChange}
              depth={depth + 1}
              itemMap={itemMap}
              lessonMap={lessonMap}
              quizMap={quizMap}
            />
          ))}
        </div>
      )}
    </div>
  );
}
