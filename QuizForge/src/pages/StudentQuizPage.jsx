
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
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(null);
  const [canPrev, setCanPrev] = useState(true);
  const [canNext, setCanNext] = useState(true);
  const selectedQuestion = questions?.[selectedQuestionIndex];

  //fetch from backend in case quiz data is lost
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

  return(
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100">
      
      <StudentTopbar />
      <div className="flex h-screen overflow-hidden bg-black">

        {/* The Question List*/}
        <StudentSidebar
          questions={questions}
          onQuestionSelect={handleQuestionSelect}
          currentQuestionIndex={selectedQuestionIndex}
        />

        {/* The Question Stage (Center) */}
        <StudentQuizWindow
          question={selectedQuestion}
          canPrev={canPrev}
          onPrev={handlePrev}
          canNext={canNext}
          onNext={handleNext}
        />

        {/* The Timer Sidebar (Right) */}
        <StudentTimeLimit />
      </div>
    </div>
  );
};