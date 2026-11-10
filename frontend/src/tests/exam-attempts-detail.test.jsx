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
import { mapAnswerRows } from "../features/exam-attempts/lib/attemptQuestions.js";
import { formatSubmittedAt } from "../features/exam-attempts/lib/format.js";

// The page's exam/list queries and the detail view's query all go through
// the API module — mock it so the detail-view tests drive the real list UI
// and the real fetch-on-select flow against inline API-shaped fixture rows.
vi.mock("../features/exam-attempts/api/examAttempts.api.js", () => ({
  examAttemptsApi: {
    examDetails: vi.fn(),
    attemptList: vi.fn(),
    attemptDetail: vi.fn(),
  },
}));

/* ------------------------------------------------------------------ *
   mapAnswerRows — pure, so every mapping invariant that could        *
   silently corrupt the detail view is asserted here directly.          *
 * ------------------------------------------------------------------ */

const MCQ_ROW = {
  questionId: 7,
  questionText: "What is 2 + 2?",
  questionType: "multiple-choice",
  options: ["3", "4", "5", "6"],
  chosenAnswer: "c",
  correctAnswer: "b",
  isCorrect: false,
  points: 0,
  maxPoints: 1,
  remarks: null,
};

const TF_ROW = {
  questionId: 8,
  questionText: "The sky is green.",
  questionType: "true-false",
  options: [],
  chosenAnswer: "true",
  correctAnswer: "true",
  isCorrect: true,
  points: 1,
  maxPoints: 1,
  remarks: null,
};

const SHORT_ROW = {
  questionId: 9,
  questionText: "Name the capital of France.",
  questionType: "short-answer",
  options: [],
  chosenAnswer: "an answer",
  correctAnswer: "the expected answer",
  isCorrect: true,
  points: 7,
  maxPoints: 10,
  remarks: "Include only the city name.",
};

describe("mapAnswerRows", () => {
  it("maps MCQ letters to option indexes and passes row fields through", () => {
    const [q] = mapAnswerRows([MCQ_ROW]);
    expect(q).toEqual({
      id: 7,
      type: "multiple-choice",
      text: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      correctIndex: 1, // 'b'
      chosenIndex: 2, // 'c'
      correctText: null,
      chosenText: null,
      points: 0,
      maxPoints: 1,
      isCorrect: false,
      remarks: null,
    });
  });

  it("maps a null MCQ chosen answer to a skipped index", () => {
    const [q] = mapAnswerRows([{ ...MCQ_ROW, chosenAnswer: null }]);
    expect(q.chosenIndex).toBeNull();
    expect(q.correctIndex).toBe(1); // correct answer still resolves
  });

  it("treats unexpected MCQ values (indexOf -1) as null", () => {
    const [q] = mapAnswerRows([
      { ...MCQ_ROW, correctAnswer: "e", chosenAnswer: "x" },
    ]);
    expect(q.correctIndex).toBeNull();
    expect(q.chosenIndex).toBeNull();
  });

  it("maps true-false answers to 0/1 with nulls kept skipped", () => {
    const [trueRow] = mapAnswerRows([TF_ROW]);
    expect(trueRow).toMatchObject({
      options: null, // the view synthesizes ["True", "False"]
      correctIndex: 0,
      chosenIndex: 0,
      correctText: null,
      chosenText: null,
      maxPoints: 1,
    });

    const [falseRow] = mapAnswerRows([
      { ...TF_ROW, correctAnswer: "false", chosenAnswer: "false" },
    ]);
    expect(falseRow.correctIndex).toBe(1);
    expect(falseRow.chosenIndex).toBe(1);

    const [skipped] = mapAnswerRows([{ ...TF_ROW, chosenAnswer: null }]);
    expect(skipped.chosenIndex).toBeNull();
  });

  it("passes short-answer text through, including the skipped null", () => {
    const [q] = mapAnswerRows([SHORT_ROW]);
    expect(q).toEqual({
      id: 9,
      type: "short-answer",
      text: "Name the capital of France.",
      options: null,
      correctIndex: null,
      chosenIndex: null,
      correctText: "the expected answer",
      chosenText: "an answer",
      points: 7,
      maxPoints: 10,
      isCorrect: true,
      remarks: "Include only the city name.",
    });

    const [skipped] = mapAnswerRows([{ ...SHORT_ROW, chosenAnswer: null }]);
    expect(skipped.chosenText).toBeNull();
    expect(skipped.correctText).toBe("the expected answer");
  });

  it("maps every row in order", () => {
    const mapped = mapAnswerRows([MCQ_ROW, TF_ROW, SHORT_ROW]);
    expect(mapped.map((q) => q.id)).toEqual([7, 8, 9]);
  });
});

/* ------------------------------------------------------------------ *
   AttemptDetailView — inline in the attempts panel: a list-row click *
   swaps the panel to the detail (fetch-on-select) and the header     *
   arrow returns to the list. Rows are buttons: single-attempt rows   *
   carry the student name, rows inside a multi-attempt box carry only *
   score + date.                                                       *
 * ------------------------------------------------------------------ */

// Inline API-shaped fixture rows for the detail endpoint (6 questions:
// 3 MCQ — correct/wrong/skipped, 1 T/F correct, 2 short-answer — partial
// with remarks and skipped). Every row click resolves these.
const DETAIL_ROWS = [
  {
    questionId: 1,
    questionText: "What is 2 + 2?",
    questionType: "multiple-choice",
    options: ["3", "4", "5", "6"],
    chosenAnswer: "b",
    correctAnswer: "b",
    isCorrect: true,
    points: 1,
    maxPoints: 1,
    remarks: "Clean answer.",
  },
  {
    questionId: 2,
    questionText: "Which planet is the largest?",
    questionType: "multiple-choice",
    options: ["Mars", "Earth", "Jupiter", "Venus"],
    chosenAnswer: "a",
    correctAnswer: "c",
    isCorrect: false,
    points: 0,
    maxPoints: 1,
    remarks: null,
  },
  {
    questionId: 3,
    questionText: "What does H2O stand for?",
    questionType: "multiple-choice",
    options: ["Water", "Salt", "Acid", "Base"],
    chosenAnswer: null,
    correctAnswer: "a",
    isCorrect: false,
    points: 0,
    maxPoints: 1,
    remarks: null,
  },
  {
    questionId: 4,
    questionText: "The sky is green.",
    questionType: "true-false",
    options: [],
    chosenAnswer: "false",
    correctAnswer: "false",
    isCorrect: true,
    points: 1,
    maxPoints: 1,
    remarks: null,
  },
  {
    questionId: 5,
    questionText: "Name the capital of France.",
    questionType: "short-answer",
    options: [],
    chosenAnswer: "Paris, France",
    correctAnswer: "Paris",
    isCorrect: true,
    points: 7,
    maxPoints: 10,
    remarks: "Include only the city name.",
  },
  {
    questionId: 6,
    questionText: "Explain photosynthesis briefly.",
    questionType: "short-answer",
    options: [],
    chosenAnswer: null,
    correctAnswer: "Plants convert light into chemical energy",
    isCorrect: false,
    points: 0,
    maxPoints: 10,
    remarks: null,
  },
];

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
  examAttemptsApi.attemptDetail.mockResolvedValue(DETAIL_ROWS);
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

describe("AttemptDetailView", () => {
  // No dialog anymore: the detail lives in the attempts panel as a
  // labelled region wrapping the header arrow + question cards.
  const detailRegion = () =>
    screen.getByRole("region", { name: "Attempt details" });

  it("does not fetch detail until a row is clicked, then fetches that attempt", async () => {
    renderAt("1");
    expect(await screen.findByText("4 students • 6 attempts")).toBeInTheDocument();
    expect(examAttemptsApi.attemptDetail).not.toHaveBeenCalled();

    fireEvent.click(
      await screen.findByRole("button", { name: /Brian Okafor/ }),
    );

    expect(examAttemptsApi.attemptDetail).toHaveBeenCalledTimes(1);
    expect(examAttemptsApi.attemptDetail).toHaveBeenCalledWith("1", 1003);
  });

  it("opens from a single-attempt row with the header and full breakdown", async () => {
    renderAt("1");
    fireEvent.click(
      await screen.findByRole("button", { name: /Brian Okafor/ }),
    );

    const panel = detailRegion();
    // The panel swaps to the detail — the list row (and any dialog) is gone.
    expect(screen.queryByRole("button", { name: /Brian Okafor/ })).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(
      within(panel).getByRole("heading", { level: 2, name: "Brian Okafor" }),
    ).toBeInTheDocument();
    // Header: raw/max score + submission date (same Intl format as rows).
    expect(
      within(panel).getByText(
        `${BRIAN_ATTEMPT.rawScore}/${BRIAN_ATTEMPT.maxPossibleScore} • ${formatSubmittedAt(BRIAN_ATTEMPT.submittedAt)}`,
      ),
    ).toBeInTheDocument();

    // All 6 fixture questions, badges from points/maxPoints:
    // 2× "1/1" (MCQ correct + T/F correct), 2× "0/1" (wrong + skipped),
    // "7/10" (partial short-answer), "0/10" (skipped short-answer).
    expect(await within(panel).findAllByRole("article")).toHaveLength(6);
    expect(within(panel).getAllByText("1/1")).toHaveLength(2);
    expect(within(panel).getAllByText("0/1")).toHaveLength(2);
    expect(within(panel).getAllByText("7/10")).toHaveLength(1);
    expect(within(panel).getAllByText("0/10")).toHaveLength(1);
    // Skipped answers keep the amber "Skipped" line.
    expect(within(panel).getAllByText("Skipped")).toHaveLength(2);
  });

  it("labels every question type and lists options only where they exist", async () => {
    renderAt("1");
    fireEvent.click(
      await screen.findByRole("button", { name: /Brian Okafor/ }),
    );
    const panel = detailRegion();
    await within(panel).findAllByRole("article");

    expect(within(panel).getAllByText("Multiple choice")).toHaveLength(3);
    expect(within(panel).getAllByText("True/False")).toHaveLength(1);
    expect(within(panel).getAllByText("Short answer")).toHaveLength(2);

    // 4 option lists (3 MCQ × 4 items + 1 T/F × 2 items); short-answer
    // cards show the expected answer text instead of options.
    const lists = within(panel).getAllByRole("list");
    expect(lists).toHaveLength(4);
    const sizes = lists.map((list) => within(list).getAllByRole("listitem").length);
    expect(sizes.filter((n) => n === 4)).toHaveLength(3);
    expect(sizes.filter((n) => n === 2)).toHaveLength(1);
    expect(
      within(panel).getByText("Plants convert light into chemical energy"),
    ).toBeInTheDocument();
  });

  it("shows a remarks line only for questions that have remarks", async () => {
    renderAt("1");
    fireEvent.click(
      await screen.findByRole("button", { name: /Brian Okafor/ }),
    );
    const panel = detailRegion();
    await within(panel).findAllByRole("article");

    expect(within(panel).getAllByText(/^Remarks:/)).toHaveLength(2);
    expect(within(panel).getByText("Clean answer.")).toBeInTheDocument();
    expect(
      within(panel).getByText("Include only the city name."),
    ).toBeInTheDocument();
  });

  it("opens the specific attempt from a row inside a multi-attempt box", async () => {
    renderAt("1");
    // Box rows carry score + date only; the student name header is inert.
    fireEvent.click(
      await screen.findByRole("button", {
        name: new RegExp(`${ALICE_ATTEMPT.rawScore}/${ALICE_ATTEMPT.maxPossibleScore}`),
      }),
    );

    const panel = detailRegion();
    expect(
      within(panel).getByRole("heading", { level: 2, name: "Alice Nguyen" }),
    ).toBeInTheDocument();
    expect(
      within(panel).getByText(
        `${ALICE_ATTEMPT.rawScore}/${ALICE_ATTEMPT.maxPossibleScore} • ${formatSubmittedAt(ALICE_ATTEMPT.submittedAt)}`,
      ),
    ).toBeInTheDocument();
    // Her older 18/25 attempt stays out of this view.
    expect(within(panel).queryByText(/18\/25/)).toBeNull();
    expect(await within(panel).findAllByRole("article")).toHaveLength(6);
  });

  it("returns to the list from the arrow, then opens another attempt", async () => {
    renderAt("1");
    fireEvent.click(
      await screen.findByRole("button", { name: /Brian Okafor/ }),
    );
    const panel = detailRegion();
    // Focus lands on the arrow so the view is reachable without a mouse.
    expect(
      document.activeElement,
    ).toBe(within(panel).getByRole("button", { name: "Back to attempts list" }));

    fireEvent.click(
      within(panel).getByRole("button", { name: "Back to attempts list" }),
    );

    expect(screen.queryByRole("region", { name: "Attempt details" })).toBeNull();
    // Focus returns to the list container, not <body>.
    expect(document.activeElement).toHaveAttribute("tabindex", "-1");
    // The attempts list survives the round trip untouched.
    expect(screen.getByText("4 students • 6 attempts")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Brian Okafor/ }),
    ).toBeInTheDocument();

    // A different attempt opens from the restored list.
    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(`${ALICE_ATTEMPT.rawScore}/${ALICE_ATTEMPT.maxPossibleScore}`),
      }),
    );
    expect(
      within(detailRegion()).getByRole("heading", {
        level: 2,
        name: "Alice Nguyen",
      }),
    ).toBeInTheDocument();
    expect(await within(detailRegion()).findAllByRole("article")).toHaveLength(6);
  });

  it("shows a spinner in the body while the detail is loading", async () => {
    examAttemptsApi.attemptDetail.mockReturnValue(new Promise(() => {}));

    renderAt("1");
    fireEvent.click(
      await screen.findByRole("button", { name: /Brian Okafor/ }),
    );

    const panel = detailRegion();
    // Header renders immediately from the clicked list row; body waits.
    expect(
      within(panel).getByRole("heading", { level: 2, name: "Brian Okafor" }),
    ).toBeInTheDocument();
    expect(panel.querySelector(".animate-spin")).not.toBeNull();
    expect(within(panel).queryAllByRole("article")).toHaveLength(0);
    // The arrow stays available during loading.
    expect(
      within(panel).getByRole("button", { name: "Back to attempts list" }),
    ).toBeInTheDocument();
  });

  it("shows the server error message when the detail fetch fails", async () => {
    examAttemptsApi.attemptDetail.mockRejectedValue(
      new ApiError("Attempt not found", { status: 404 }),
    );

    renderAt("1");
    fireEvent.click(
      await screen.findByRole("button", { name: /Brian Okafor/ }),
    );

    const panel = detailRegion();
    expect(
      await within(panel).findByText("Attempt not found"),
    ).toBeInTheDocument();
    expect(within(panel).queryAllByRole("article")).toHaveLength(0);

    // Back still works from the error state.
    fireEvent.click(
      within(panel).getByRole("button", { name: "Back to attempts list" }),
    );
    expect(screen.queryByRole("region", { name: "Attempt details" })).toBeNull();
  });

  it("shows an empty state when the attempt has no answer rows", async () => {
    examAttemptsApi.attemptDetail.mockResolvedValue([]);

    renderAt("1");
    fireEvent.click(
      await screen.findByRole("button", { name: /Brian Okafor/ }),
    );

    expect(
      await screen.findByText("No answers recorded for this attempt"),
    ).toBeInTheDocument();
    expect(screen.queryAllByRole("article")).toHaveLength(0);
  });
});
