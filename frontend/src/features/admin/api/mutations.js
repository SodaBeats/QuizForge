/* Admin-panel writes. Every mutation invalidates the whole admin prefix:
   one user change can move the stat cards AND whichever list is on screen
   (users page tabs, dashboard pending teachers, exams).

   The Add-User modal renders server errors itself (e.g. duplicate email),
   so createUser opts out of the global mutation toast. Everything else
   surfaces failures through the global toast in queryClient.js. */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminKeys } from "../../../lib/queryKeys.js";
import { adminApi } from "./admin.api.js";

function useInvalidateAdmin() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: adminKeys.all });
}

export function useCreateUser() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (body) => adminApi.createUser(body),
    meta: { skipGlobalError: true },
    onSuccess: invalidate,
  });
}

/** PATCH /admin/users/:id — { role } or { is_verified }. */
export function useUpdateUser() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: ({ id, body }) => adminApi.updateUser(id, body),
    onSuccess: invalidate,
  });
}

export function useSuspendUser() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (id) => adminApi.suspendUser(id),
    onSuccess: invalidate,
  });
}

export function useUnsuspendUser() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (id) => adminApi.unsuspendUser(id),
    onSuccess: invalidate,
  });
}

export function useDeleteUser() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: (id) => adminApi.deleteUser(id),
    onSuccess: invalidate,
  });
}
