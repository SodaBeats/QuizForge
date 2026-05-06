export type Question = {
  id: number;
  quizId: number;
  questionText: string;
  questionType: QuestionType;
  timeLimit: number; // in seconds
  correctAnswer: string | null;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
};

export enum QuestionType {
  MultipleChoice = 'multiple-choice',
  TrueFalse = 'true-false',
  ShortAnswer = 'short-answer',
}
