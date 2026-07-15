import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { LogSearchFilters } from "@/types";
import { api } from "@/lib/api";

export const LOG_SEARCH_PAGE_SIZE = 25;

export function useLiveLogs() {
  return useQuery({
    queryKey: ["logs", "live"],
    queryFn: api.getLogs,
    refetchInterval: 1500,
  });
}

export function useLogStats() {
  return useQuery({
    queryKey: ["logs", "stats"],
    queryFn: () => api.getLogStats(),
  });
}

export function useLogSearch(filters: LogSearchFilters | null) {
  return useInfiniteQuery({
    queryKey: ["logs", "search", filters],
    queryFn: ({ pageParam }) =>
      api.searchLogs({ ...filters, limit: LOG_SEARCH_PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length * LOG_SEARCH_PAGE_SIZE : undefined,
    enabled: filters !== null,
  });
}
