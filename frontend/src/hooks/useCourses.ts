import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useCourses() {
  return useQuery({
    queryKey: ["courses"],
    queryFn: api.getCourses,
  });
}

export function useCourse(id: string | undefined) {
  return useQuery({
    queryKey: ["courses", id],
    queryFn: () => api.getCourse(id!),
    enabled: !!id,
  });
}

export function useAddCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ title, description, category }: { title: string; description: string; category: string }) =>
      api.addCourse(title, description, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}

export function useEnrolledStudents(courseId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["courses", courseId, "students"],
    queryFn: () => api.getEnrolledStudents(courseId!),
    enabled: !!courseId && enabled,
  });
}

export function useAvailableStudents(courseId: string | undefined) {
  return useQuery({
    queryKey: ["courses", courseId, "students", "available"],
    queryFn: () => api.getAvailableStudents(courseId!),
    enabled: !!courseId,
  });
}

export function useEnrollStudent(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.enrollStudent(courseId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses", courseId, "students"] });
    },
  });
}

export function useUnenrollStudent(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.unenrollStudent(courseId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses", courseId, "students"] });
    },
  });
}

export function useCourseResources(courseId: string | undefined) {
  return useQuery({
    queryKey: ["courses", courseId, "resources"],
    queryFn: () => api.getCourseResources(courseId!),
    enabled: !!courseId,
  });
}
