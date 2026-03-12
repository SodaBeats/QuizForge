
//STILL NEED TO WORK ON CASES WHERE CORRECT ANSWER IS NULL
interface Question {
  id: number,
  document_id: number,
  question_text: string,
  question_type: QuestionType,
  correct_answer: string | null,
  option_a: string | null,
  option_b: string | null,
  option_c: string | null,
  option_d: string | null,
}
enum QuestionType{
  MultipleChoice = 'multiple-choice',
  TrueFalse = 'true-false'
}

export const getScore = (questions: Question[], answers: Record<string, string>)=> {

  return questions.reduce((totalScore, q)=>{

    const userAnswer = answers[q.id.toString()];

    //if answer is correct: add +1 to accumulator and return it
    if(userAnswer === q.correct_answer){
      return totalScore + 1;
    }

    // if answer is not correct: score stays the same and return it
    return totalScore;
  },0);

};
