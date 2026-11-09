import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
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
import { buildAttemptDetail } from "../features/exam-attempts/lib/questionDetail.js";
import { formatSubmittedAt } from "../features/exam-attempts/lib/format.js";

// The page's list/detail queries go through the API module — mock it so the
// modal tests drive the real list UI against the static fixtures.
vi.mock("../features/exam-attempts/api/examAttempts.api.js", () => ({
  examAttemptsApi: {
    examDetails: vi.fn(),
    attemptList: vi.fn(),
  },
}));

/* ------------------------------------------------------------------ *
   buildAttemptDetail — the generator is pure and deterministic, so    *
   every invariant that could silently corrupt the modal is asserted   *
   here over ALL mock attempts of both exams.                          *
 * ------------------------------------------------------------------ */

// TYPE_PATTERN cycles multiple-choice ×3 → true-false → short-answer,
// keyed by question index only, so every attempt of an exam agrees.
const EXPECTED_TYPE_COUNTS = {
  "1": { "multiple-choice": 15, "true-false": 5, "short-answer": 5 },
  "2": { "multiple-choice": 6, "true-false": 2, "short-answer": 2 },
};

const CASES = ["1", "2"].flatMap((examId) =>
  MOCK_ATTEMPTS[examId].map((attempt) => ({
    examId,
    exam: MOCK_EXAMS[examId],
    attempt,
  })),
);

describe("buildAttemptDetail", () => {
  it("returns one question per exam question and scores sum to the raw score", () => {
    for (const { examId, exam, attempt } of CASES) {
      const ctx = `exam ${examId} attempt ${attempt.id}`;
      const detail = buildAttemptDetail(attempt, exam);
      expect(detail, ctx).toHaveLength(exam.questionCount);
      expect(
        detail.reduce((n, q) => n + q.score, 0),
        ctx,
      ).toBe(attempt.rawScore);
    }
  });

  it("is deterministic — rebuilding the same attempt is deep-equal", () => {
    for (const { examId, exam, attempt } of CASES) {
      const ctx = `exam ${examId} attempt ${attempt.id}`;
      const first = buildAttemptDetail(attempt, exam);
      expect(buildAttemptDetail(attempt, exam), ctx).toEqual(first);
    }
  });

  it("uses the fixed type pattern per exam, identical across every attempt", () => {
    for (const examId of ["1", "2"]) {
      const exam = MOCK_EXAMS[examId];
      const typeLists = MOCK_ATTEMPTS[examId].map((attempt) =>
        buildAttemptDetail(attempt, exam).map((q) => q.type),
      );
      // Same question index → same type in every attempt of the exam.
      for (const types of typeLists) {
        expect(types, `exam ${examId}`).toEqual(typeLists[0]);
      }
      const counts = {
        "multiple-choice": 0,
        "true-false": 0,
        "short-answer": 0,
      };
      for (const type of typeLists[0]) counts[type] += 1;
      expect(counts, `exam ${examId}`).toEqual(EXPECTED_TYPE_COUNTS[examId]);
    }
  });

  it("shapes each type: MCQ four options, T/F True|False, short-answer text", () => {
    for (const { examId, exam, attempt } of CASES) {
      const ctx = `exam ${examId} attempt ${attempt.id}`;
      for (const q of buildAttemptDetail(attempt, exam)) {
        if (q.type === "multiple-choice") {
          expect(q.options, ctx).toEqual([
            "Option A",
            "Option B",
            "Option C",
            "Option D",
          ]);
          expect(q.correctIndex, ctx).toBeGreaterThanOrEqual(0);
          expect(q.correctIndex, ctx).toBeLessThan(4);
          expect(
            q.chosenIndex === null || (q.chosenIndex >= 0 && q.chosenIndex < 4),
            ctx,
          ).toBe(true);
        } else if (q.type === "true-false") {
          expect(q.options, ctx).toEqual(["True", "False"]);
          expect([0, 1], ctx).toContain(q.correctIndex);
          expect(
            q.chosenIndex === null || [0, 1].includes(q.chosenIndex),
            ctx,
          ).toBe(true);
        } else if (q.type === "short-answer") {
          expect(
            "options" in q || "correctIndex" in q || "chosenIndex" in q,
            ctx,
          ).toBe(false);
          expect(typeof q.correctText, ctx).toBe("string");
          expect(q.correctText.length, ctx).toBeGreaterThan(0);
          expect(
            q.chosenText === null || typeof q.chosenText === "string",
            ctx,
          ).toBe(true);
        } else {
          throw new Error(`${ctx}: unexpected question type "${q.type}"`);
        }
      }
    }
  });

  it("matches answers to the score; skipped answers always score 0", () => {
    let skipped = 0;
    for (const { examId, exam, attempt } of CASES) {
      for (const q of buildAttemptDetail(attempt, exam)) {
        const ctx = `exam ${examId} attempt ${attempt.id} q${q.id}`;
        const isSkipped =
          q.type === "short-answer"
            ? q.chosenText === null
            : q.chosenIndex === null;

        if (q.score === 1) {
          expect(isSkipped, ctx).toBe(false);
          if (q.type === "short-answer") {
            expect(q.chosenText, ctx).toBe(q.correctText);
          } else {
            expect(q.chosenIndex, ctx).toBe(q.correctIndex);
          }
        } else if (isSkipped) {
          skipped += 1;
        } else {
          expect(q.chosenText ?? q.chosenIndex, ctx).not.toBe(
            q.correctText ?? q.correctIndex,
          );
        }
      }
    }
    // The fixtures exercise the skipped path (Skipped shown as the answer).
    expect(skipped).toBeGreaterThan(0);
  });

  it("gives remarks only as null or non-empty strings, with some in the fixtures", () => {
    let remarked = 0;
    for (const { examId, exam, attempt } of CASES) {
      const ctx = `exam ${examId} attempt ${attempt.id}`;
      for (const q of buildAttemptDetail(attempt, exam)) {
        if (q.remarks === null) continue;
        expect(typeof q.remarks, `${ctx} q${q.id}`).toBe("string");
        expect(q.remarks.trim().length, `${ctx} q${q.id}`).toBeGreaterThan(0);
        remarked += 1;
      }
    }
    expect(remarked).toBeGreaterThan(0);
  });
});

/* ------------------------------------------------------------------ *
   AttemptDetailModal — open/close/targeting through the real page.    *
   Rows are buttons: single-attempt rows carry the student name, rows  *
   inside a multi-attempt box carry only score + date.                  *
 * ------------------------------------------------------------------ */

const BRIAN_ATTEMPT = MOCK_ATTEMPTS["1"].find((a) => a.id === 1003);
const ALICE_ATTEMPT = MOCK_ATTEMPTS["1"].find((a) => a.id === 1002); // 22/25, in her box

beforeEach(() => {
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

describe("AttemptDetailModal", () => {
  it("opens from a single-attempt row with the header and full breakdown", async () => {
    renderAt("1");
    fireEvent.click(
      await screen.findByRole("button", { name: /Brian Okafor/ }),
    );

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { level: 2, name: "Brian Okafor" }),
    ).toBeInTheDocument();
    // Fixed header: raw/max score + submission date (same Intl format as rows).
    expect(
      within(dialog).getByText(
        `${BRIAN_ATTEMPT.rawScore}/${BRIAN_ATTEMPT.maxPossibleScore} • ${formatSubmittedAt(BRIAN_ATTEMPT.submittedAt)}`,
      ),
    ).toBeInTheDocument();

    // All 25 questions, each with an x/1 badge — 15 correct = his raw score.
    expect(within(dialog).getAllByRole("article")).toHaveLength(25);
    expect(within(dialog).getAllByText("1/1")).toHaveLength(15);
    expect(within(dialog).getAllByText("0/1")).toHaveLength(10);
  });

  it("labels every question type and lists options only where they exist", async () => {
    renderAt("1");
    fireEvent.click(
      await screen.findByRole("button", { name: /Brian Okafor/ }),
    );
    const dialog = screen.getByRole("dialog");

    expect(within(dialog).getAllByText("Multiple choice")).toHaveLength(15);
    expect(within(dialog).getAllByText("True/False")).toHaveLength(5);
    expect(within(dialog).getAllByText("Short answer")).toHaveLength(5);

    // 20 option lists (25 questions − 5 short-answer): 15×4 and 5×2 items.
    const lists = within(dialog).getAllByRole("list");
    expect(lists).toHaveLength(20);
    const sizes = lists.map((list) => within(list).getAllByRole("listitem").length);
    expect(sizes.filter((n) => n === 4)).toHaveLength(15);
    expect(sizes.filter((n) => n === 2)).toHaveLength(5);

    // Short-answer cards show generated answer text instead of options.
    expect(
      within(dialog).getAllByText(/Expected answer for question/).length,
    ).toBeGreaterThanOrEqual(5);
  });

  it("shows a remarks line only for questions that have remarks", async () => {
    renderAt("1");
    fireEvent.click(
      await screen.findByRole("button", { name: /Brian Okafor/ }),
    );
    const dialog = screen.getByRole("dialog");

    const remarked = buildAttemptDetail(BRIAN_ATTEMPT, MOCK_EXAMS["1"]).filter(
      (q) => q.remarks,
    );
    expect(remarked.length).toBeGreaterThan(0); // fixture check: attempt 1003 has 7
    expect(within(dialog).getAllByText(/^Remarks:/)).toHaveLength(
      remarked.length,
    );
    for (const text of new Set(remarked.map((q) => q.remarks))) {
      expect(within(dialog).getAllByText(text).length).toBeGreaterThan(0);
    }
  });

  it("opens the specific attempt from a row inside a multi-attempt box", async () => {
    renderAt("1");
    // Box rows carry score + date only; the student name header is inert.
    fireEvent.click(
      await screen.findByRole("button", {
        name: new RegExp(`${ALICE_ATTEMPT.rawScore}/${ALICE_ATTEMPT.maxPossibleScore}`),
      }),
    );

    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { level: 2, name: "Alice Nguyen" }),
    ).toBeInTheDocument();
    expect(within(dialog).getAllByText("1/1")).toHaveLength(
      ALICE_ATTEMPT.rawScore,
    );
    // Her older 18/25 attempt stays out of this modal.
    expect(within(dialog).queryByText(/18\/25/)).toBeNull();
  });

  it("dismisses from the close button and from Escape, keeping the list intact", async () => {
    renderAt("1");
    const row = await screen.findByRole("button", { name: /Brian Okafor/ });

    fireEvent.click(row);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Close attempt details" }),
    );
    expect(screen.queryByRole("dialog")).toBeNull();

    fireEvent.click(row);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();

    // The attempts list survives the open/close cycle untouched.
    expect(screen.getByText("4 students • 6 attempts")).toBeInTheDocument();
  });
});
