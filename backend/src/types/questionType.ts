export type Question = {
  id: number;
  quizId: number;
  questionText: string;
  questionType: QuestionType;
  timeLimit: number; // in seconds
  correctAnswer?: string | null;
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
};

export type QuestionType =
  | 'multiple-choice'
  | 'true-false'
  | 'short-answer'
  | 'general-open-ended-objective'
  | 'code-explain-open-ended-objective'
  | 'code-output-predict-open-ended-objective';

// Question types graded by the LLM on a 0-10 scale (instead of exact-match 1 pt)
export const reasoningQuestionTypes = [
  'short-answer',
  'general-open-ended-objective',
  'code-explain-open-ended-objective',
  'code-output-predict-open-ended-objective',
] as const satisfies readonly QuestionType[];

// Accepts a plain string because question_type is a varchar column — DB rows
// are not narrowed to QuestionType. Unknown types fall through as non-reasoning.
export const isReasoningQuestionType = (questionType: string): boolean =>
  (reasoningQuestionTypes as readonly string[]).includes(questionType);
