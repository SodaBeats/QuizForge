
//STILL NEED TO WORK ON CASES WHERE CORRECT ANSWER IS NULL
interface Question {
  id: number,
  documentId: number,
  questionText: string,
  questionType: QuestionType,
  correctAnswer: string | null,
  optionA: string | null,
  optionB: string | null,
  optionC: string | null,
  optionD: string | null,
}
enum QuestionType{
  MultipleChoice = 'multiple-choice',
  TrueFalse = 'true-false'
}

export const getScore = (questions: Question[], answers: Record<string, string>)=> {

  if(!answers){
    console.log('no answers');
    return 0;
  }

  return questions.reduce((totalScore, q)=>{

    const userAnswer = answers[q.id.toString()];

    //if answer is correct: add +1 to accumulator and return it
    if(userAnswer === q.correctAnswer){
      return totalScore + 1;
    }

    // if answer is not correct: score stays the same and return it
    return totalScore;
  },0);

};
