/* Global React Query defaults (Phase 2.2 / F5) and one mutation-error
   vocabulary (Phase 2.5 / F16).

   Call sites no longer repeat `staleTime` / `refetchOnWindowFocus`; they
   inherit these. Mutation errors are surfaced once here unless the mutation
   opts out with `meta: { skipGlobalError: true }` (used where a flow owns a
   more specific message). */

import { MutationCache, QueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

function handleMutationError(error, _variables, _context, mutation) {
  if (mutation?.meta?.skipGlobalError) return;
  // The API client already ends the session on a failed refresh.
  if (error?.status === 401) return;
  toast.error(error?.message || "Something went wrong. Please try again.");
}

export function createQueryClient() {
  return new QueryClient({
    mutationCache: new MutationCache({ onError: handleMutationError }),
    defaultOptions: {
      queries: {
        staleTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export const queryClient = createQueryClient();
