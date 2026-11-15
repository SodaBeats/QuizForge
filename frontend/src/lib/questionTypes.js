// Mirrors backend/src/types/questionType.ts → reasoningQuestionTypes.
// These are LLM-graded 0–10; exact-match (1 pt) types are multiple-choice
// and true-false.
export const REASONING_QUESTION_TYPES = Object.freeze([
  "short-answer",
  "general-open-ended-objective",
  "code-explain-open-ended-objective",
  "code-output-predict-open-ended-objective",
]);

export function isReasoningQuestionType(questionType) {
  return REASONING_QUESTION_TYPES.includes(questionType);
}
