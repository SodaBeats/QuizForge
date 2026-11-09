/* Exam attempts page reads. Hooks own the cache keys so no component does. */

import { useQuery } from "@tanstack/react-query";
import { attemptKeys } from "../../../lib/queryKeys.js";
import { examAttemptsApi } from "./examAttempts.api.js";

/** Exam metadata for the details panel (404 → not-found state). */
export function useExamDetails(quizId) {
  return useQuery({
    queryKey: attemptKeys.examDetail(quizId),
    queryFn: () => examAttemptsApi.examDetails(quizId),
    enabled: Boolean(quizId),
  });
}

/** Full completed-attempts list + the students who made them. */
export function useExamAttempts(quizId) {
  return useQuery({
    queryKey: attemptKeys.examList(quizId),
    queryFn: () => examAttemptsApi.attemptList(quizId),
    enabled: Boolean(quizId),
  });
}
