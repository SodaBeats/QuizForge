/* Student attempt network calls (Phase 2.3). */

import { ApiError, apiRequest } from "../../../lib/api.js";

function assertSuccess(payload, fallback) {
  if (payload?.success === false) {
    throw new ApiError(payload?.message || fallback, { payload });
  }
  return payload;
}

export const studentQuizApi = {
  requestAccess(token) {
    return apiRequest(
      "/api/student/quiz-access",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      },
      { fallbackMessage: "Access denied" },
    );
  },

  async fetch(quizToken) {
    const data = await apiRequest(
      `/api/student/quiz-access/${quizToken}`,
      {},
      { fallbackMessage: "Failed to fetch quiz" },
    );

    assertSuccess(data, "Failed to load quiz");

    return {
      quiz: data.quiz,
      questions: data.questions,
      attemptId: data.attemptId,
      totalAttempts: data.totalAttempts,
    };
  },

  submit(payload) {
    return apiRequest(
      "/api/student/quiz-submit",
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
      { fallbackMessage: "Failed to submit quiz" },
    );
  },

  deleteAttempt(quizToken) {
    return apiRequest(
      `/api/student/quiz-access/${quizToken}`,
      { method: "DELETE" },
      { fallbackMessage: "Failed to delete attempt" },
    );
  },
};
