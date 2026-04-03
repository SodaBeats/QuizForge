
//STILL NEED TO WORK ON CASES WHERE CORRECT ANSWER IS NULL
export interface Question {
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
type ScoreableQuestion = Pick<Question, 'id' | 'correctAnswer'>;

export const getScore = (questions: ScoreableQuestion[], answers: Record<string, string>)=> {

  if (!answers || questions.length === 0) {
    return 0;
  }

  const rawScore = questions.reduce((totalScore, q)=>{

    if(q.correctAnswer === null){
      return totalScore;
    }

    const userAnswer = answers[q.id.toString()];

    //if answer is correct: add +1 to accumulator and return it
    if(userAnswer === q.correctAnswer){
      return totalScore + 1;
    }

    // if answer is not correct: score stays the same and return it
    return totalScore;
  },0);

  const percentile = (rawScore/questions.length) * 100;
  
  return Math.round(percentile);

};
