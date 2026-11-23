/* Quiz reads (Phase 2.3). Hooks own the cache keys so no component does. */

import { useQuery } from "@tanstack/react-query";
import { quizKeys, tokenUsageKeys } from "../../../lib/queryKeys.js";
import { quizzesApi } from "./quizzes.api.js";
import { tokenUsageApi } from "./tokenUsage.api.js";

/** Unpaginated quiz list (quizzes page). */
export function useQuizzes() {
  return useQuery({
    queryKey: quizKeys.list(),
    queryFn: quizzesApi.list,
  });
}

/** Paginated quiz list (quiz picker modal). */
export function usePagedQuizzes(page) {
  return useQuery({
    queryKey: quizKeys.list({ page }),
    queryFn: () => quizzesApi.listPaged(page),
  });
}

export function useQuizQuestions(quizId, { enabled = true } = {}) {
  return useQuery({
    queryKey: quizKeys.questions(quizId),
    queryFn: () => quizzesApi.questions(quizId),
    enabled: Boolean(quizId) && enabled,
  });
}

export function useQuizDashboard(quizId) {
  return useQuery({
    queryKey: quizKeys.dashboard(quizId),
    queryFn: () => quizzesApi.dashboard(quizId),
    enabled: Boolean(quizId),
    retry: false,
  });
}

/** Today's embedding/generation token budget for the current teacher. */
export function useTokenUsage() {
  return useQuery({
    queryKey: tokenUsageKeys.usage,
    queryFn: tokenUsageApi.get,
  });
}
