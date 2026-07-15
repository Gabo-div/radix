import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ForumPost } from "@/types";
import { api } from "@/lib/api";

export function useForumPosts(courseId: string | undefined) {
  return useQuery({
    queryKey: ["courses", courseId, "forum"],
    queryFn: () => api.getForumPosts(courseId!),
    enabled: !!courseId,
  });
}

export function useForumLinks(courseId: string | undefined) {
  return useQuery({
    queryKey: ["courses", courseId, "forum", "links"],
    queryFn: () => api.getForumLinks(courseId!),
    enabled: !!courseId,
  });
}

export function useCreateForumPost(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { parentId?: string; title?: string; body: string }) =>
      api.createForumPost(courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses", courseId, "forum"] });
    },
  });
}

export function useToggleForumLike(courseId: string) {
  const queryClient = useQueryClient();
  const key = ["courses", courseId, "forum"];
  return useMutation({
    mutationFn: ({ id, liked }: { id: string; liked: boolean }) =>
      liked ? api.unlikeForumPost(id) : api.likeForumPost(id),
    onMutate: async ({ id, liked }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ForumPost[]>(key);
      queryClient.setQueryData<ForumPost[]>(key, (old) =>
        old?.map((p) =>
          p.id === id ? { ...p, liked: !liked, likeCount: p.likeCount + (liked ? -1 : 1) } : p
        )
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
