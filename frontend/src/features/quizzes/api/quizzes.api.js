/* Every /api/quizzes* and /api/questions* network call (Phase 2.3 / F2/F6).
   Components import the hooks in queries.js / mutations.js, never this file. */

import { ApiError, apiRequest } from "../../../lib/api.js";

const jsonRequest = (method, body) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

function assertSuccess(payload, fallback) {
  if (payload?.success === false) {
    throw new ApiError(payload?.message || fallback, { payload });
  }
  return payload;
}

export const quizzesApi = {
  async list() {
    const result = await apiRequest(
      "/api/quizzes",
      {},
      { fallbackMessage: "Failed to fetch quizzes" },
    );
    return result.userQuizzes;
  },

  listPaged(page = 0) {
    const offset = page * 5;
    const limit = 5;
    return apiRequest(
      `/api/quizzes?limit=${limit}&offset=${offset}`,
      {},
      { fallbackMessage: "Failed to fetch quizzes" },
    );
  },

  create(quiz) {
    return apiRequest("/api/quizzes", jsonRequest("POST", quiz), {
      fallbackMessage: "Failed to create quiz",
    });
  },

  update(quizId, quiz) {
    return apiRequest(`/api/quizzes/${quizId}`, jsonRequest("PATCH", quiz), {
      fallbackMessage: "Failed to update quiz",
    });
  },

  remove(quizId) {
    return apiRequest(`/api/quizzes/${quizId}`, { method: "DELETE" }, {
      fallbackMessage: "Failed to delete quiz",
    });
  },

  questions(quizId) {
    return apiRequest(
      `/api/quizzes/questions?quizId=${quizId}`,
      {},
      { fallbackMessage: "Failed to fetch questions" },
    );
  },

  createQuestion(question) {
    return apiRequest("/api/questions", jsonRequest("POST", question), {
      fallbackMessage: "Failed to submit question",
    });
  },

  /** Editor form → PATCH /api/questions/:id */
  updateQuestion(question) {
    return apiRequest(
      `/api/questions/${question.id}`,
      jsonRequest("PATCH", question),
      { fallbackMessage: "Failed to update question" },
    );
  },

  /** Inline quizzes-page form → PATCH /api/quizzes/:quizId/question/:id */
  updateQuizQuestion(quizId, question) {
    return apiRequest(
      `/api/quizzes/${quizId}/question/${question.id}`,
      jsonRequest("PATCH", question),
      { fallbackMessage: "Failed to update question" },
    );
  },

  deleteQuestion(questionId) {
    return apiRequest(`/api/questions/${questionId}`, { method: "DELETE" }, {
      fallbackMessage: "Failed to delete question",
    });
  },

  generateQuestions({ quizId, generateOptions }) {
    return apiRequest(
      "/api/questions/generate",
      jsonRequest("POST", { generateOptions, quizId }),
      { fallbackMessage: "Failed to generate questions" },
    );
  },

  async attemptsExist(quizId) {
    try {
      const result = await apiRequest(
        `/api/quizzes/${quizId}/attempts`,
        {},
        { fallbackMessage: "Failed to check attempts" },
      );
      return Boolean(result?.success);
    } catch (error) {
      // No attempts yet is a normal state, not an error (backend answers 404).
      if (error?.status === 404) return false;
      throw error;
    }
  },

  /** Raw dashboard payload; the results page turns it into chart-ready data. */
  async dashboard(quizId) {
    if (!(await quizzesApi.attemptsExist(quizId))) {
      return null;
    }

    const [metrics, students, questions, scores, classesAverage] =
      await Promise.all([
        apiRequest(`/api/quizzes/${quizId}/metrics`, {}, {
          fallbackMessage: "Something went wrong while fetching metrics",
        }),
        apiRequest(`/api/quizzes/${quizId}/students`, {}, {
          fallbackMessage: "Something went wrong while fetching student ranking",
        }),
        apiRequest(`/api/quizzes/${quizId}/questions`, {}, {
          fallbackMessage:
            "Something went wrong while fetching questions data",
        }),
        apiRequest(`/api/quizzes/${quizId}/score`, {}, {
          fallbackMessage:
            "Something went wrong while fetching score distribution data",
        }),
        apiRequest(`/api/quizzes/${quizId}/classesavg`, {}, {
          fallbackMessage:
            "Something went wrong while fetching classes average ranking",
        }),
      ]);

    assertSuccess(metrics, "Something went wrong while fetching metrics");
    assertSuccess(students, "Something went wrong while fetching student ranking");
    assertSuccess(questions, "Something went wrong while fetching questions data");
    assertSuccess(scores, "Something went wrong while fetching score distribution data");
    assertSuccess(
      classesAverage,
      "Something went wrong while fetching classes average ranking",
    );

    return {
      metrics,
      students: students.data,
      questions: questions.data,
      scores: scores.data,
      classesAverage: classesAverage.data,
    };
  },
};
