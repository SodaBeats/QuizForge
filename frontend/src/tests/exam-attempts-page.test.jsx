import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext } from "../app/providers/AuthProvider";
import { ExamAttemptsPage } from "../features/exam-attempts/pages/ExamAttemptsPage";
import { examAttemptsApi } from "../features/exam-attempts/api/examAttempts.api.js";
import { ApiError } from "../lib/api.js";
import {
  MOCK_ATTEMPTS,
  MOCK_EXAMS,
  MOCK_STUDENTS,
} from "../features/exam-attempts/lib/mockData.js";

// The API module is mocked so a single test can simulate a known exam with
// zero submissions (and another a server error); every other test runs
// against the real mock fixtures shaped like the live endpoints.
vi.mock("../features/exam-attempts/api/examAttempts.api.js", () => ({
  examAttemptsApi: {
    examDetails: vi.fn(),
    attemptList: vi.fn(),
  },
}));

// The page reads quizId from route params, so render it under a real Route
// plus a QueryClient (queries must not retry in tests).
const renderAt = (quizId) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <AuthContext.Provider
        value={{ token: "token", userInfo: { role: "teacher" }, logout: vi.fn() }}
      >
        <MemoryRouter initialEntries={[`/teacher/quizzes/${quizId}/attempts`]}>
          <Routes>
            <Route
              path="/teacher/quizzes/:quizId/attempts"
              element={<ExamAttemptsPage />}
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );

beforeEach(() => {
  // Default: fixtures shaped like the live payloads. Unknown quizIds get a
  // 404, exactly like the ownership-checked routes.
  examAttemptsApi.examDetails.mockImplementation(async (quizId) => {
    const exam = MOCK_EXAMS[String(quizId)];
    if (!exam) throw new ApiError("Quiz not found", { status: 404 });
    return exam;
  });
  examAttemptsApi.attemptList.mockImplementation(async (quizId) => {
    const exam = MOCK_EXAMS[String(quizId)];
    if (!exam) throw new ApiError("Quiz not found", { status: 404 });
    const attempts = MOCK_ATTEMPTS[String(quizId)] ?? [];
    const withAttempts = new Set(attempts.map((attempt) => attempt.studentId));
    return {
      attempts,
      students: MOCK_STUDENTS.filter((student) => withAttempts.has(student.id)),
    };
  });
});

describe("ExamAttemptsPage", () => {
  it("renders the read-only details panel and the full attempts list", async () => {
    renderAt("1");

    // Panel 1 — exam details
    expect(
      await screen.findByRole("heading", { level: 1, name: "Midterm: Algebra II" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Restricted")).toBeInTheDocument();
    expect(screen.getByText("Section A, Section B")).toBeInTheDocument();

    // Panel 2 — grouped attempts; counts reflect the active tab (Section A)
    expect(await screen.findByText("4 students • 6 attempts")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Section A" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Section B" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByText("Alice Nguyen")).toBeInTheDocument();
    expect(screen.getByText("Farah Haddad")).toBeInTheDocument();
    // Both Section A multi-attempt students (Alice + Farah) render boxes.
    expect(screen.getAllByText("2 attempts")).toHaveLength(2);
    expect(screen.getByText("18/25")).toBeInTheDocument();
  });

  it("renders the not-found state in both panels for an unknown quizId", async () => {
    renderAt("999");

    expect(
      await screen.findAllByText("No attempt data for this exam"),
    ).toHaveLength(2);
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    expect(screen.queryByText("Alice Nguyen")).toBeNull();
    expect(screen.queryByRole("button", { name: "Section A" })).toBeNull();
  });

  it("shows a centered spinner in both panels while queries are pending", async () => {
    let resolveDetails;
    examAttemptsApi.examDetails.mockReturnValue(
      new Promise((resolve) => {
        resolveDetails = resolve;
      }),
    );

    const { container } = renderAt("1");

    expect(container.querySelectorAll(".animate-spin")).toHaveLength(2);

    resolveDetails(MOCK_EXAMS["1"]);
    expect(
      await screen.findByRole("heading", { level: 1, name: "Midterm: Algebra II" }),
    ).toBeInTheDocument();
  });

  it("shows the error state in both panels when a query fails", async () => {
    examAttemptsApi.examDetails.mockRejectedValue(
      new ApiError("Exam service unavailable", { status: 500 }),
    );
    examAttemptsApi.attemptList.mockRejectedValue(
      new ApiError("Exam service unavailable", { status: 500 }),
    );

    renderAt("1");

    expect(
      await screen.findAllByText("Exam service unavailable"),
    ).toHaveLength(2);
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
  });

  it("filters the list when a class tab is clicked", async () => {
    renderAt("1");

    // Section A is active by default.
    expect(await screen.findByText("4 students • 6 attempts")).toBeInTheDocument();
    expect(screen.queryByText("Diego Fernandez")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Section B" }));

    expect(screen.getByText("3 students • 4 attempts")).toBeInTheDocument();
    expect(screen.getByText("Diego Fernandez")).toBeInTheDocument();
    expect(screen.queryByText("Alice Nguyen")).toBeNull();
    // Farah belongs to both classes, so she survives the tab switch.
    expect(screen.getByText("Farah Haddad")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Section B" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("shows no class tabs and the full list for an open exam", async () => {
    renderAt("2");

    expect(await screen.findByText("10 students • 14 attempts")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Section A" })).toBeNull();
    expect(screen.getByText("Grace Kim")).toBeInTheDocument();
  });

  it("shows the no-match state when a search finds no students", async () => {
    renderAt("2");

    fireEvent.change(
      await screen.findByRole("searchbox", { name: "Search students by name" }),
      { target: { value: "zzz" } },
    );

    expect(screen.getByText("No students match your search")).toBeInTheDocument();
    expect(screen.getByText("0 students • 0 attempts")).toBeInTheDocument();
  });

  it("shows the no-submissions state for a known exam with zero attempts", async () => {
    examAttemptsApi.attemptList.mockResolvedValue({
      attempts: [],
      students: [],
    });

    renderAt("2");

    expect(await screen.findByText("No submissions yet")).toBeInTheDocument();
    expect(screen.getByText("0 students • 0 attempts")).toBeInTheDocument();
    expect(
      screen.queryByText("No students match your search"),
    ).toBeNull();
  });
});
