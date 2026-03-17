
import { useContext, useState } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "../components/AuthProvider";
import QuizTokenModal from "../components/StudentTokenInput";
import { useNavigate } from "react-router-dom";

export default function StudentTokenPage() {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const { authFetch } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmitToken = async(token)=> {
    try{
      const quizAndQuestionsRes = await authFetch(`http://localhost:3000/api/student/quiz-access`, {
        method: 'POST',
        body: JSON.stringify({token: token}),
        credentials: 'include'
      })

      const quizAndQuestions = await quizAndQuestionsRes.json();

      if(!quizAndQuestions.success){
        toast.error(quizAndQuestions.message || "Access Denied");
        return;
      }
      
      //stop user if already used up all attempts
      if (quizAndQuestions.totalAttempts > quizAndQuestions.maxAttempts) {
        toast.error(`You have used up all ${quizAndQuestions.maxAttempts} available attempts`);
        return;
      }

      toast.success('Quiz found! Starting...');
      setIsModalOpen(false);

      //navigate to quiz page and pass the data from this page into quiz page using location.state
      navigate(`/student/quiz/${quizAndQuestions.quiz.shareToken}`, {
        state: {
          quizData: quizAndQuestions.quiz,
          questions: quizAndQuestions.questions,
          attemptCount: quizAndQuestions.totalAttempts,
          maxAttempts: quizAndQuestions.quiz.maxAttempts,
          attemptId: quizAndQuestions.attemptId,
          attemptStart: quizAndQuestions.attemptStart
        }
      });
      
    }catch(error){
      alert('Something went wrong with token verification');
      console.error(error);
    }
  };

  return(
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100">
      <QuizTokenModal
        isOpen={isModalOpen}
        onClose={()=>setIsModalOpen(false)}
        onSubmit={handleSubmitToken}
      />
      {!isModalOpen && (
        <div className="text-white text-center">
          <h1 className="text-3xl font-bold">Ready to take the quiz!</h1>
        </div>
      )}
    </div>
  );
}