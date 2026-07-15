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
