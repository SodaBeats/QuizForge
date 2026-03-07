
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
      const response = await authFetch(`http://localhost:3000/api/student/quiz-access`, {
        method: 'POST',
        body: JSON.stringify({token: token}),
        credentials: 'include'
      })

      const result = await response.json();

      if(!result.success){
        toast.error(`${result.message}`);
        return;
      }

      toast.success('Quiz found! Starting...');
      setIsModalOpen(false);
      navigate(`/student/quiz/${result.quiz.share_token}`, {state: {quizData: result.quiz}});
      
    }catch(error){
      toast.error('Something went wrong with token verification')
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