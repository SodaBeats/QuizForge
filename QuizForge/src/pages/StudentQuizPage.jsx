
import { useEffect, useState, useContext } from 'react';
import { useLocation, useParams } from "react-router-dom";
import StudentTopbar from "../components/StudentTopbar";
import { AuthContext } from '../components/AuthProvider';

export default function StudentQuizPage(){
  const location = useLocation();
  const {quizToken} = useParams();
  const {authFetch} = useContext(AuthContext);

  //get data passed from the navigation
  const [quiz, setQuiz] = useState(location.state?.quizData || null);
  
  //fetch from backend in case quiz data is lost
  useEffect(()=>{
    if(!quiz && quizToken){
      authFetch(`http://localhost:3000/api/student/quiz-access/${quizToken}`)
        .then(res => res.json())
        .then(data=>setQuiz(data.quiz));
    }
  }, [quiz, quizToken, authFetch]);

  return(
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100">
      <StudentTopbar />
    </div>
  );
};