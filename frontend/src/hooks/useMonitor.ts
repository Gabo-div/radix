import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useMonitor() {
  return useQuery({
    queryKey: ["monitor"],
    queryFn: api.getMonitor,
    refetchInterval: 3000,
  });
}

export function useForceSync() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.forceSync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitor"] });
    },
  });
}

// An import replaces every table, so every cached query is stale — invalidate
// the whole cache rather than listing keys that would drift out of date.
export function useImportBackup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => api.importBackup(file),
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });
}
