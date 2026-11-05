/* Teacher-dashboard reads (mock data — no network). Hooks own the cache
   keys so no component does; call sites inherit the global query defaults
   (no per-call staleTime / refetchOnWindowFocus overrides). */

import { useQuery } from "@tanstack/react-query";
import { dashboardKeys } from "../../../lib/queryKeys.js";
import { dashboardApi } from "./dashboard.api.js";

/** Stat cards: active exams, total students, average score, drafts. */
export function useDashboardStats({ enabled = true } = {}) {
  return useQuery({
    queryKey: dashboardKeys.stats,
    queryFn: () => dashboardApi.getStats(),
    enabled,
  });
}

/** Paginated active-exams list (title / due date / submission rate). */
export function useActiveExams(page = 1, { enabled = true } = {}) {
  return useQuery({
    queryKey: dashboardKeys.activeExams({ page }),
    queryFn: () => dashboardApi.getActiveExams({ page }),
    enabled,
  });
}

/** Paginated expiring-soon list (title / due date / time left, 72h window). */
export function useExpiringExams(page = 1, { enabled = true } = {}) {
  return useQuery({
    queryKey: dashboardKeys.expiring({ page }),
    queryFn: () => dashboardApi.getExpiringExams({ page }),
    enabled,
  });
}
