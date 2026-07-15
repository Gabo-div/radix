import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useLibrary(type?: string, category?: string) {
  return useQuery({
    queryKey: ["library", { type, category }],
    queryFn: () => api.getLibrary(type, category),
  });
}

export function useLibraryItem(id: string | undefined) {
  return useQuery({
    queryKey: ["library", id],
    queryFn: () => api.getLibraryItem(id!),
    enabled: !!id,
  });
}

export function useLibraryItemUsage(id: string | undefined) {
  return useQuery({
    queryKey: ["library", id, "usage"],
    queryFn: () => api.getLibraryItemUsage(id!),
    enabled: !!id,
  });
}

export function useAddLibraryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ title, category, file }: { title: string; category: string; file: File }) =>
      api.addLibraryItem(title, category, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library"] });
    },
  });
}

export function useUpdateLibraryItem(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title?: string; category?: string }) => api.updateLibraryItem(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(["library", id], updated);
      queryClient.invalidateQueries({ queryKey: ["library"], exact: false });
    },
  });
}
