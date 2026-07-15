import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Quiz } from "@/types";
import { api } from "@/lib/api";

export function useQuiz(id: string | undefined) {
  return useQuery({
    queryKey: ["quizzes", id],
    queryFn: () => api.getQuiz(id!),
    enabled: !!id,
  });
}

export function useCourseQuizzes(courseId: string | undefined) {
  return useQuery({
    queryKey: ["courses", courseId, "quizzes"],
    queryFn: () => api.getCourseQuizzes(courseId!),
    enabled: !!courseId,
  });
}

export function useQuizLinks(id: string | undefined) {
  return useQuery({
    queryKey: ["quizzes", id, "links"],
    queryFn: () => api.getQuizLinks(id!),
    enabled: !!id,
  });
}

export function useCreateQuiz() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { courseId?: string; lessonId?: string | null; title: string; description?: string; value?: number; questions: Quiz["questions"] }) =>
      api.createQuiz(data),
    onSuccess: (_data, variables) => {
      if (variables.courseId) {
        queryClient.invalidateQueries({ queryKey: ["courses", variables.courseId] });
      }
      if (variables.lessonId) {
        queryClient.invalidateQueries({ queryKey: ["lessons", variables.lessonId] });
      }
    },
  });
}

export function useUpdateQuiz(id: string, courseId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title?: string; description?: string; value?: number; questions?: Quiz["questions"] }) =>
      api.updateQuiz(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizzes", id] });
      if (courseId) queryClient.invalidateQueries({ queryKey: ["courses", courseId] });
    },
  });
}

export function useSubmitQuiz(id: string) {
  return useMutation({
    mutationFn: (answers: number[]) => api.submitQuiz(id, answers),
  });
}
