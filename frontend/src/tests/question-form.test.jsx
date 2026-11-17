import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuestionForm } from "../features/quizzes/components/QuestionForm.jsx";

const noop = () => {};

const baseQuestion = {
  questionText: "",
  questionType: "multiple-choice",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctAnswer: "",
  timeLimit: 60,
};

function renderForm(question, setQuestion = noop) {
  return render(
    <QuestionForm
      question={question}
      setQuestion={setQuestion}
      onSubmit={noop}
      onCancel={noop}
      submitLabel="Done"
    />,
  );
}

// Labels in QuestionForm aren't associated via htmlFor, so locate the
// correct-answer control structurally: it lives in the label's parent block.
function correctAnswerControl() {
  return screen
    .getByText("Correct answer")
    .parentElement.querySelector("textarea, select");
}

describe("QuestionForm correct-answer inputs", () => {
  it.each([
    "short-answer",
    "general-open-ended-objective",
    "code-explain-open-ended-objective",
    "code-output-predict-open-ended-objective",
  ])("shows a reference-answer textarea for %s", (questionType) => {
    renderForm({
      ...baseQuestion,
      questionType,
      correctAnswer: "A closure bundles a function with its lexical scope.",
    });

    const control = correctAnswerControl();
    expect(control.tagName).toBe("TEXTAREA");
    expect(control.value).toBe(
      "A closure bundles a function with its lexical scope.",
    );
    expect(
      screen.getByPlaceholderText("Enter the reference answer..."),
    ).not.toBeNull();
    // Time limit must still render alongside the new field.
    expect(screen.getByPlaceholderText("Enter time in seconds")).not.toBeNull();
  });

  it("writes typed reference answers back through setQuestion", () => {
    const setQuestion = vi.fn();
    renderForm({ ...baseQuestion, questionType: "short-answer" }, setQuestion);

    fireEvent.change(
      screen.getByPlaceholderText("Enter the reference answer..."),
      { target: { value: "Any valid answer: it returns 42" } },
    );

    expect(setQuestion).toHaveBeenCalledWith(
      expect.objectContaining({
        correctAnswer: "Any valid answer: it returns 42",
      }),
    );
  });

  it("keeps the A-D select for multiple-choice", () => {
    renderForm({ ...baseQuestion, questionType: "multiple-choice" });

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
    renderForm({ ...baseQuestion, questionType: "true-false" });

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
