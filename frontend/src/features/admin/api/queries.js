/* Admin-panel reads. Hooks own the cache keys so no component does; call
   sites inherit the global query defaults (no per-call staleTime /
   refetchOnWindowFocus overrides). */

import { useQuery } from "@tanstack/react-query";
import { adminKeys } from "../../../lib/queryKeys.js";
import { adminApi } from "./admin.api.js";

/** Stat cards: teachers, students, exams, pendingTeachers. */
export function useAdminStats({ enabled = true } = {}) {
  return useQuery({
    queryKey: adminKeys.stats,
    queryFn: () => adminApi.getStats(),
    enabled,
  });
}

/** Paginated user list -> { data, total }. */
export function useAdminUsers(
  { role, page = 1, limit = 10, verified } = {},
  { enabled = true } = {},
) {
  const params = { role, page, limit, verified };
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => adminApi.getUsers(params),
    enabled,
  });
}

/** Paginated exam list, newest first (sort=created_at_desc) -> { data, total }. */
export function useAdminExams(
  { page = 1, limit = 10 } = {},
  { enabled = true } = {},
) {
  const params = { page, limit };
  return useQuery({
    queryKey: adminKeys.exams(params),
    queryFn: () => adminApi.getExams(params),
    enabled,
  });
}
