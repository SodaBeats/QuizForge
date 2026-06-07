import { useState, useContext } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { AuthContext } from "../components/AuthProvider";
import { studentQuizService } from "../services/studentQuizService";
import StudentTopbar from "../components/StudentTopbar";
import StudentSidebar from "../components/StudentSidebar";
import StudentQuizWindow from "../components/StudentQuizWindow";
import StudentTimeLimit from "../components/StudentTimeLimit";
import LoadingScreen from "../components/LoadingScreen";

const backendHost = import.meta.env.VITE_BACKEND_HOST;

export default function StudentQuizPage() {
  const { quizToken } = useParams();
  const { authFetch } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState({});
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());

  // Fetch quiz data
  const {
    data: quizData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["studentQuiz", quizToken],
    queryFn: () =>
      studentQuizService.fetchStudentQuiz(authFetch, quizToken, backendHost),
    enabled: !!quizToken && !!authFetch && !!backendHost,
    staleTime: Infinity,
    cacheTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Extract data for readability
  const quiz = quizData?.quiz;
  const questions = quizData?.questions;
  const attemptId = quizData?.attemptId;
  const attemptCount = quizData?.totalAttempts;
  const maxAttempts = quiz?.maxAttempts;
  const selectedQuestion = questions?.[selectedQuestionIndex] || null;

  const canPrev = false;
  const canNext = true;

  // Mutation for quiz submission
  const submitQuizMutation = useMutation({
    mutationFn: (payload) =>
      studentQuizService.submitStudentQuiz(
        authFetch,
        quizToken,
        backendHost,
        payload,
      ),
    onSuccess: () => {
      // Invalidate the quiz query
      queryClient.invalidateQueries({ queryKey: ["studentQuiz", quizToken] });
      toast.success("Attempt received!");
      navigate("/student", { replace: true });
    },
    onError: (error) => {
      console.error(error);
      alert("Something went wrong while submitting attempt");
    },
  });

  // Mutation for attempt deletion
  const deleteAttemptMutation = useMutation({
    mutationFn: () =>
      studentQuizService.deleteStudentQuizAttempt(
        authFetch,
        quizToken,
        backendHost,
      ),
    onSuccess: () => {
      // Invalidate the quiz query
      queryClient.invalidateQueries({ queryKey: ["studentQuiz", quizToken] });
      navigate("/student");
    },
    onError: (error) => {
      console.error("Failed delete attempt", error);
      toast.error("Failed to delete attempt");
    },
  });

  const handleQuestionSelect = (index) => {
    setSelectedQuestionIndex(index);
  };

  const handlePrev = () => {
    if (selectedQuestionIndex > 0) {
      setSelectedQuestionIndex((prev) => prev - 1);
    }
  };
  const handleNext = () => {
    if (selectedQuestionIndex < questions.length - 1) {
      setSelectedQuestionIndex((prev) => prev + 1);
    }
  };

  const handleAnswerChange = (ans) => {
    setAnswers({ ...answers, [selectedQuestion.id]: ans });
    setAnsweredQuestions((prev) => {
      const newSet = new Set(prev);
      newSet.add(selectedQuestion.id);
      return newSet;
    });
  };

  // auto advance to next question when time runs out
  // auto submit if there is no next question
  const handleTimeout = () => {
    if (selectedQuestionIndex < questions.length - 1) {
      setSelectedQuestionIndex((prev) => prev + 1);
    } else {
      handleQuizSubmit();
    }
  };

  const handleQuizSubmit = () => {
    submitQuizMutation.mutate({
      questions,
      answers,
      quiz,
      attemptId,
    });
  };

  const deleteAttempt = () => {
    deleteAttemptMutation.mutate();
  };

  if (isLoading) {
    return <LoadingScreen fullScreen />;
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-gray-100">
        <div className="text-center">
          <p className="text-red-400">{error?.message}</p>
          <button
            onClick={() => {
              deleteAttempt();
            }}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
          >
            Back to Student Page
          </button>
        </div>
      </div>
    );
  }

  if (!backendHost) {
    return <Navigate to="/error" replace />;
  }

  return (
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
          key={selectedQuestionIndex}
          timeLimit={selectedQuestion?.timeLimit ?? null}
          onTimeout={handleTimeout}
          attemptCount={attemptCount}
          maxAttempts={maxAttempts}
        />
      </div>
    </div>
  );
}
