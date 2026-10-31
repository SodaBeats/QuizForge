// Characterization test for the student quiz submit payload (plan.md §0.4.1).
// It locks the contract that StudentQuizPage.handleQuizSubmit passes to the
// student-quiz API — { questions, answers, quiz, attemptId } — so the Phase 2
// service extraction / useMutation conversion can't silently change the
// request body the backend receives.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import StudentQuizPage from "../features/student-quiz/pages/StudentQuizPage";
import { AuthContext } from "../app/providers/AuthProvider";
import { studentQuizApi } from "../features/student-quiz/api/studentQuiz.api";

vi.mock("../features/student-quiz/api/studentQuiz.api", () => ({
  studentQuizApi: {
    fetch: vi.fn(),
    submit: vi.fn(),
    deleteAttempt: vi.fn(),
  },
}));

const QUIZ_TOKEN = "TOKEN1";
const progressKey = `quiz_progress_${QUIZ_TOKEN}`;

const quiz = { id: "quiz-1", title: "Fixture Quiz", maxAttempts: 3 };
const questions = [
  {
    id: "question-1",
    questionText: "Which option is Beta?",
    questionType: "multiple-choice",
    optionA: "Alpha",
    optionB: "Beta",
    optionC: "Gamma",
    optionD: "Delta",
    // 0 so StudentTimeLimit starts no interval and never auto-submits
    timeLimit: 0,
  },
];
const attemptId = "att-1";

const logout = vi.fn();

function renderStudentQuizPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const authValue = {
    logout,
    token: "test-token",
    userInfo: { role: "student" },
    loading: false,
  };

  return render(
    <AuthContext.Provider value={authValue}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[`/student/quiz/${QUIZ_TOKEN}`]}>
          <Routes>
            <Route
              path="/student/quiz/:quizToken"
              element={<StudentQuizPage />}
            />
            <Route path="/student" element={<div>student home</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </AuthContext.Provider>,
  );
}

beforeEach(() => {
  sessionStorage.clear();
  logout.mockReset();
  studentQuizApi.fetch.mockResolvedValue({
    quiz,
    questions,
    attemptId,
    totalAttempts: 0,
  });
  studentQuizApi.submit.mockResolvedValue({ success: true });
  studentQuizApi.deleteAttempt.mockResolvedValue({ success: true });
});

afterEach(() => {
  sessionStorage.clear();
});

describe("StudentQuizPage submit", () => {
  it("sends { questions, answers, quiz, attemptId } and clears progress on success", async () => {
    renderStudentQuizPage();

    await screen.findByText("Which option is Beta?");
    fireEvent.click(screen.getByRole("button", { name: /Beta/ }));

    // progress was persisted to sessionStorage when the answer was selected
    expect(sessionStorage.getItem(progressKey)).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Submit Quiz" }));

    await waitFor(() =>
      expect(studentQuizApi.submit).toHaveBeenCalledTimes(1),
    );

    expect(studentQuizApi.submit.mock.calls[0][0]).toEqual({
      questions,
      answers: { "question-1": "b" },
      quiz,
      attemptId,
    });

    // success side effects: navigation + storage cleanup
    await screen.findByText("student home");
    expect(sessionStorage.getItem(progressKey)).toBeNull();
    expect(
      Object.keys(sessionStorage).filter((k) =>
        k.startsWith(`quiz_timer_${attemptId}_`),
      ),
    ).toHaveLength(0);
  });

  it("does not submit when the unanswered-questions confirm is cancelled", async () => {
    renderStudentQuizPage();
    await screen.findByText("Which option is Beta?");

    // no answer selected → 1 unanswered → confirm dialog must appear
    fireEvent.click(screen.getByRole("button", { name: "Submit Quiz" }));

    expect(
      await screen.findByText(
        "You have 1 unanswered question(s). Submit anyway?",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    // still on the quiz page, service untouched
    expect(screen.queryByText("student home")).not.toBeInTheDocument();
    expect(studentQuizApi.submit).not.toHaveBeenCalled();
  });
});
