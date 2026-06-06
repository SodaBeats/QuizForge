import { useContext, useState } from "react";
import toast from "react-hot-toast";
import { AuthContext } from "../components/AuthProvider";
import QuizTokenModal from "../components/StudentTokenInput";
import { useNavigate } from "react-router-dom";

export default function StudentTokenPage() {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const { authFetch } = useContext(AuthContext);
  const navigate = useNavigate();
  const backendHost = import.meta.env.VITE_BACKEND_HOST;
  if (!backendHost) throw new Error("Missing backend host");

  const handleSubmitToken = async (token) => {
    const response = await authFetch(`${backendHost}/api/student/quiz-access`, {
      method: "POST",
      header: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      credentials: "include",
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(
        result.errors?.map((e) => e.msg).join(", ") ||
          result.message ||
          "Access Denied",
      );
    }

    const quizAndQuestions = await response.json();

    //stop user if already used up all attempts
    if (quizAndQuestions.totalAttempts >= quizAndQuestions.maxAttempts) {
      throw new Error(
        `You have used up all ${quizAndQuestions.maxAttempts} available attempts`,
      );
    }

    toast.success("Quiz found! Starting...");
    setIsModalOpen(false);

    //navigate to quiz page
    navigate(`/student/quiz/${quizAndQuestions.shareToken}`);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100">
      <QuizTokenModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
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
