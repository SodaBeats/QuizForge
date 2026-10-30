/* Student attempt writes (Phase 2.3–2.4). */

import { useMutation } from "@tanstack/react-query";
import { studentQuizApi } from "./studentQuiz.api.js";

export function useSubmitStudentQuiz() {
  return useMutation({
    mutationFn: (payload) => studentQuizApi.submit(payload),
  });
}

export function useDeleteStudentQuizAttempt() {
  return useMutation({
    mutationFn: (quizToken) => studentQuizApi.deleteAttempt(quizToken),
  });
}

export function useRequestQuizAccess() {
  return useMutation({
    mutationFn: (token) => studentQuizApi.requestAccess(token),
    // The token page shows a specific "used up all attempts" message.
    meta: { skipGlobalError: true },
  });
}
