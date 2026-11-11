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
