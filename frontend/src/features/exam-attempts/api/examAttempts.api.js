/* Exam attempts page network calls. Components import the hooks in
   queries.js, never this file. */

import { ApiError, apiRequest } from "../../../lib/api.js";

function assertSuccess(payload, fallback) {
  if (payload?.success === false) {
    throw new ApiError(payload?.message || fallback, { payload });
  }
  return payload;
}

export const examAttemptsApi = {
  /** GET /api/quizzes/:quizId → exam metadata for the left panel. */
  async examDetails(quizId) {
    const result = await apiRequest(`/api/quizzes/${quizId}`, {}, {
      fallbackMessage: "Failed to fetch exam details",
    });
    return assertSuccess(result, "Failed to fetch exam details").exam;
  },

  /** GET /api/quizzes/:quizId/attempts/list → { attempts, students }.
      Empty arrays are a normal state, not an error. */
  async attemptList(quizId) {
    const result = await apiRequest(
      `/api/quizzes/${quizId}/attempts/list`,
      {},
      { fallbackMessage: "Failed to fetch attempts" },
    );
    const payload = assertSuccess(result, "Failed to fetch attempts");
    return { attempts: payload.attempts ?? [], students: payload.students ?? [] };
  },

  /** GET /api/quizzes/:quizId/attempts/:attemptId → { questions, attemptRemarks }.
      The header (score/date/student) reads the list row instead. A stale
      backend that omits attemptRemarks normalizes to null. Empty questions
      is a normal state — e.g. questions added after the submission. */
  async attemptDetail(quizId, attemptId) {
    const result = await apiRequest(
      `/api/quizzes/${quizId}/attempts/${attemptId}`,
      {},
      { fallbackMessage: "Failed to fetch attempt details" },
    );
    const payload = assertSuccess(result, "Failed to fetch attempt details");
    return {
      questions: payload.questions ?? [],
      attemptRemarks: payload.attemptRemarks ?? null,
    };
  },
};
