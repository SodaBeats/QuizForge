//STILL NEED TO WORK ON CASES WHERE CORRECT ANSWER IS NULL
// Types -----------------------------------------------------------------------
export interface Question {
  id: number;
  documentId: number;
  questionText: string;
  questionType: QuestionType;
  correctAnswer: string | null;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
}

export enum QuestionType {
  MultipleChoice = 'multiple-choice',
  TrueFalse = 'true-false',
  ShortAnswer = 'short-answer',
}
type ScoreableQuestion = Pick<
  Question,
  'id' | 'correctAnswer' | 'questionType' | 'questionText'
>;

// main function --------------------------------------------------------------
export const getScore = async (
  questions: ScoreableQuestion[],
  answers: Record<string, string> | null,
) => {
  if (!answers || questions.length === 0) {
    return 0;
  }

  try {
    const rawScore = questions.reduce((totalScore, q) => {
      if (q.correctAnswer === null) {
        return totalScore;
      }

      const userAnswer = answers[q.id.toString()];

      //if answer is correct: add +1 to accumulator and return it
      if (userAnswer === q.correctAnswer) {
        return totalScore + 1;
      }

      // if answer is not correct: score stays the same and return it
      return totalScore;
    }, 0);

    //const percentile = (rawScore / questions.length) * 100;

    return rawScore;
  } catch (err: any) {
    console.error(err);
    throw new Error(`Failed to grade answers: ${err.message}`);
  }
};
