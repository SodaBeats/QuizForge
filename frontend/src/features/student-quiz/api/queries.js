/* Student attempt reads (Phase 2.3). */

import { useQuery } from "@tanstack/react-query";
import { attemptKeys } from "../../../lib/queryKeys.js";
import { studentQuizApi } from "./studentQuiz.api.js";

export function useStudentQuiz(quizToken) {
  return useQuery({
    queryKey: attemptKeys.quiz(quizToken),
    queryFn: () => studentQuizApi.fetch(quizToken),
    enabled: Boolean(quizToken),
    // Keep the in-progress attempt from refetching itself mid-quiz.
    refetchOnReconnect: false,
  });
}
