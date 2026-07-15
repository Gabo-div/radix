import { useState } from "react";
import { roleLabels } from "@/lib/rbac";
import type { ForumPost, LibraryItem, LessonUsage, QuizUsage } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCreateForumPost, useToggleForumLike } from "@/hooks/useForum";
import WikiContent from "./WikiContent";
import ForumComposer from "./ForumComposer";
import { Heart, MessageSquare } from "lucide-react";

const roleBadgeVariant: Record<string, "success" | "default" | "warning"> = {
  admin: "success",
  student: "default",
  guest: "warning",
};

interface Props {
  post: ForumPost;
  posts: ForumPost[];
  canPost: boolean;
  depth: number;
  itemMap: Record<string, LibraryItem>;
  lessonMap: Record<string, LessonUsage>;
  quizMap: Record<string, QuizUsage>;
}

export default function ForumPostItem({ post, posts, canPost, depth, itemMap, lessonMap, quizMap }: Props) {
  const [showReply, setShowReply] = useState(false);
  const toggleLike = useToggleForumLike(post.courseId);
  const createReply = useCreateForumPost(post.courseId);

  const children = posts
    .filter((p) => p.parentId === post.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (
    <div className={depth > 0 ? "ml-6 pl-4 border-l border-border" : ""}>
      <Card>
        {post.parentId === null && (
          <h3 className="text-base font-semibold text-foreground mb-2">{post.title}</h3>
        )}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">{post.authorName}</span>
          <Badge variant={roleBadgeVariant[post.authorRole] || "secondary"}>{roleLabels[post.authorRole]}</Badge>
          <span className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleString("es-ES")}</span>
        </div>
        <WikiContent text={post.body} itemMap={itemMap} lessonMap={lessonMap} quizMap={quizMap} />
        <div className="flex items-center gap-4 mt-1">
          <button
            onClick={() => toggleLike.mutate({ id: post.id, liked: post.liked })}
            disabled={toggleLike.isPending}
            className={`flex items-center gap-1 text-xs transition-colors ${post.liked ? "text-destructive" : "text-muted-foreground hover:text-destructive"}`}>
            <Heart size={14} className={post.liked ? "fill-current" : ""} /> {post.likeCount}
          </button>
          {canPost && (
            <button onClick={() => setShowReply(!showReply)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
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
                await createReply.mutateAsync({ parentId: post.id, body });
                setShowReply(false);
              }}
            />
          </div>
        )}
      </Card>
      {children.length > 0 && (
        <div className="mt-2 space-y-2">
          {children.map((child) => (
            <ForumPostItem
              key={child.id}
              post={child}
              posts={posts}
              canPost={canPost}
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
