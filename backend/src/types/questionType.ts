
export type Question = {
  id: number,
  documentId: number,
  questionText: string,
  questionType: QuestionType,
  correctAnswer: string | null,
  optionA: string | null,
  optionB: string | null,
  optionC: string | null,
  optionD: string | null,
};

export enum QuestionType{
  MultipleChoice = 'multiple-choice',
  TrueFalse = 'true-false'
};