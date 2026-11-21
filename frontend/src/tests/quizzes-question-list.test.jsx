import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuestionList } from "../features/quizzes/components/QuizzesQuestionList.jsx";

const noop = () => {};

const editingQuestion = {
  id: 7,
  questionText: "Explain closures",
  questionType: "short-answer",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "A closure bundles a function with its lexical scope.",
  timeLimit: 60,
};

function renderEditView(question, setEditingQuestion = noop) {
  return render(
    <QuestionList
      isFetching={false}
      questions={[]}
      onUpdateQuestion={noop}
      selectedQuiz={{ id: 1, attemptCount: 0 }}
      editingQuestion={question}
      setEditingQuestion={setEditingQuestion}
    />,
  );
}

// Labels here aren't associated via htmlFor, so locate the correct-answer
// control structurally: it lives in the label's parent block.
function correctAnswerControl() {
  return screen
    .getByText("Correct answer")
    .parentElement.querySelector("textarea, select");
}

describe("QuestionList edit view correct-answer field", () => {
  it.each([
    "short-answer",
    "general-open-ended-objective",
    "code-explain-open-ended-objective",
    "code-output-predict-open-ended-objective",
  ])("shows a reference-answer textarea for %s", (questionType) => {
    renderEditView({ ...editingQuestion, questionType });

    const control = correctAnswerControl();
    expect(control.tagName).toBe("TEXTAREA");
    expect(control.value).toBe(
      "A closure bundles a function with its lexical scope.",
    );
    expect(
      screen.getByPlaceholderText("Enter the reference answer..."),
    ).not.toBeNull();
  });

  it("writes typed reference answers back through setEditingQuestion", () => {
    const setEditingQuestion = vi.fn();
    renderEditView(editingQuestion, setEditingQuestion);

    fireEvent.change(
      screen.getByPlaceholderText("Enter the reference answer..."),
      { target: { value: "Any valid answer: it returns 42" } },
    );

    expect(setEditingQuestion).toHaveBeenCalledWith(
      expect.objectContaining({
        correctAnswer: "Any valid answer: it returns 42",
      }),
    );
  });

  it("keeps the A-D select for multiple-choice", () => {
    renderEditView({ ...editingQuestion, questionType: "multiple-choice" });

    const control = correctAnswerControl();
    expect(control.tagName).toBe("SELECT");
    expect(Array.from(control.options).map((o) => o.value)).toEqual([
      "",
      "a",
      "b",
      "c",
      "d",
    ]);
    expect(
      screen.queryByPlaceholderText("Enter the reference answer..."),
    ).toBeNull();
  });

  it("keeps the True/False select for true-false", () => {
    renderEditView({ ...editingQuestion, questionType: "true-false" });

    const control = correctAnswerControl();
    expect(control.tagName).toBe("SELECT");
    expect(Array.from(control.options).map((o) => o.value)).toEqual([
      "",
      "true",
      "false",
    ]);
    expect(
      screen.queryByPlaceholderText("Enter the reference answer..."),
    ).toBeNull();
  });
});
