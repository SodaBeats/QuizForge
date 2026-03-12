
import { useEffect, useState, useContext } from 'react';
import { useLocation, useParams } from "react-router-dom";
import { AuthContext } from '../components/AuthProvider';
import StudentTopbar from "../components/StudentTopbar";
import StudentSidebar from '../components/StudentSidebar';
import StudentQuizWindow from '../components/StudentQuizWindow';
import StudentTimeLimit from '../components/StudentTimeLimit';

export default function StudentQuizPage(){
  const location = useLocation();
  const {quizToken} = useParams();
  const {authFetch} = useContext(AuthContext);

  //get data passed from the navigation
  const [quiz, setQuiz] = useState(location.state?.quizData || null);
  const [questions, setQuestions] = useState(location.state?.questions || null);
  const [answers, setAnswers] = useState({});
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  const canPrev = true;
  const canNext = true;
  const selectedQuestion = questions?.[selectedQuestionIndex];

  //console.log('question list: ',typeof(questions), questions);
  //console.log('answer list: ', typeof(answers), answers);
  //console.log('Set of answered questions: ', answeredQuestions);
  console.log('quiz info: ', typeof(quiz), quiz);

  //fetch from backend in case quiz data is lost from state
  useEffect(()=>{
    if(!quiz && quizToken){
      authFetch(`http://localhost:3000/api/student/quiz-access/${quizToken}`)
        .then(res => res.json())
        .then(data=>setQuiz(data.quiz))
        .then(data=>setQuestions(data.questions));
    }
  }, [quiz, quizToken, authFetch]);

  const handleQuestionSelect = (index) => {
    setSelectedQuestionIndex(index);
  };
  
  const handlePrev = () => {
    if(selectedQuestionIndex > 0){
      setSelectedQuestionIndex(prev=> prev-1);
    }
  };
  const handleNext = () => {
    if(selectedQuestionIndex < questions.length-1){
      setSelectedQuestionIndex(prev => prev+1);
    }
  };

  const handleAnswerChange = (ans) => {
    setAnswers({...answers, [selectedQuestion.id]: ans});
    setAnsweredQuestions((prev)=> {
      const newSet = new Set(prev);
      newSet.add(selectedQuestion.id);
      return newSet;
    });
  };

  const handleQuizSubmit = async()=> {
    try{
      const response = await authFetch('http://localhost:3000/api/student/quiz-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({questions, answers, quiz}),
        credentials: 'include'
      })

      const result = await response.json();

      if(!result.success){
        console.log('Oh nyo, something went wrong while submitting attempt');
        return;
      }

      console.log(result);


    }catch(error){
      console.error(error);
      alert('Something went wrong while submitting attempt');
    }
  };

  return(
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100">
      
      <StudentTopbar />
      <div className="flex h-screen overflow-hidden bg-black">

        {/* The Question List*/}
        <StudentSidebar
          questions={questions}
          onQuestionSelect={handleQuestionSelect}
          currentQuestionIndex={selectedQuestionIndex}
          answeredQuestions={answeredQuestions}
          onQuizSubmit={handleQuizSubmit}
        />

        {/* The Question Stage (Center) */}
        <StudentQuizWindow
          question={selectedQuestion}
          canPrev={canPrev}
          onPrev={handlePrev}
          canNext={canNext}
          onNext={handleNext}
          answers={answers}
          onAnswerChange={handleAnswerChange}
        />

        {/* The Timer Sidebar (Right) */}
        <StudentTimeLimit
          quiz={quiz}
        />
      </div>
    </div>
  );
};