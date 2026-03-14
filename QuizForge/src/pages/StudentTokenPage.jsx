
import { useContext, useState } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "../components/AuthProvider";
import QuizTokenModal from "../components/StudentTokenInput";
import { useNavigate } from "react-router-dom";

export default function StudentTokenPage() {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const { authFetch, userInfo } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmitToken = async(token)=> {
    try{
      const [quizAndQuestionsRes, attemptsRes] = await Promise.all(
        [authFetch(`http://localhost:3000/api/student/quiz-access`, {
          method: 'POST',
          body: JSON.stringify({token: token}),
          credentials: 'include'
        }),
        authFetch(`http://localhost:3000/api/student/quiz-access/${token}/${userInfo.id}`, {
          credentials: 'include'
        })]
    )

      const [quizAndQuestions, attempts] = await Promise.all([
        quizAndQuestionsRes.json(),
        attemptsRes.json()
      ]);

      if(!quizAndQuestions.success){
        toast.error(quizAndQuestions.message || "Access Denied");
        return;
      }
      if(!attempts.success){
        toast.error(attempts.message || "Access Denied");
        return;
      }
      
      //stop user if already used up all attempts
      if (attempts.attemptCount >= attempts.maxAttempts) {
        toast.error(`You have used up all ${attempts.maxAttempts} available attempts`);
        return;
      }

      toast.success('Quiz found! Starting...');
      setIsModalOpen(false);

      navigate(`/student/quiz/${quizAndQuestions.quiz.shareToken}`, {
        state: {
          quizData: quizAndQuestions.quiz,
          questions: quizAndQuestions.questions,
          attemptCount: attempts.attemptCount,
          maxAttempts: attempts.maxAttempts
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