export const studentQuizService = {
  async fetchStudentQuiz(authFetch, quizToken, backendHost) {
    const response = await authFetch(
      `${backendHost}/api/student/quiz-access/${quizToken}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch quiz");
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to load quiz");
    }

    return {
      quiz: data.quiz,
      questions: data.questions,
      attemptId: data.attemptId,
      totalAttempts: data.totalAttempts,
    };
  },

  async submitStudentQuiz(authFetch, quizToken, backendHost, payload) {
    const response = await authFetch(`${backendHost}/api/student/quiz-submit`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(
        result.errors?.map((e) => e.msg).join(", ") ||
          result?.message ||
          "Failed to submit quiz"
      );
    }

    return await response.json();
  },

  async deleteStudentQuizAttempt(authFetch, quizToken, backendHost) {
    const response = await authFetch(
      `${backendHost}/api/student/quiz-access/${quizToken}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );

    if (!response.ok) {
      const result = await response.json();
      throw new Error(
        result?.errors?.map((e) => e.msg).join(", ") ||
          result?.message ||
          "Failed to delete attempt"
      );
    }

    return await response.json();
  },
};
