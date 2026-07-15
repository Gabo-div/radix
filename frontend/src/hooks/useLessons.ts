import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useLesson(courseId: string | undefined, lessonId: string | undefined) {
  return useQuery({
    queryKey: ["lessons", lessonId, { courseId }],
    queryFn: () => api.getLesson(courseId!, lessonId!),
    enabled: !!courseId && !!lessonId,
  });
}

export function useAllLessons() {
  return useQuery({
    queryKey: ["lessons"],
    queryFn: api.getAllLessons,
  });
}

export function useLessonUsage(id: string | undefined) {
  return useQuery({
    queryKey: ["lessons", id, "usage"],
    queryFn: () => api.getLessonUsage(id!),
    enabled: !!id,
  });
}

export function useLessonLinks(id: string | undefined) {
  return useQuery({
    queryKey: ["lessons", id, "links"],
    queryFn: () => api.getLessonLinks(id!),
    enabled: !!id,
  });
}

export function useAddLesson(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ title, contentText }: { title: string; contentText: string }) =>
      api.addLesson(courseId, title, contentText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses", courseId] });
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
    },
  });
}

export function useUpdateLesson(id: string, courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ title, contentText }: { title: string; contentText: string }) =>
      api.updateLesson(id, title, contentText),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses", courseId] });
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
    },
  });
}
