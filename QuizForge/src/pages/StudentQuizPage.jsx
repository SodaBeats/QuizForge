import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AuthContext } from "../components/AuthProvider";
import StudentTopbar from "../components/StudentTopbar";
import StudentSidebar from "../components/StudentSidebar";
import StudentQuizWindow from "../components/StudentQuizWindow";
import StudentTimeLimit from "../components/StudentTimeLimit";
import LoadingScreen from "../components/LoadingScreen";

const backendHost = import.meta.env.VITE_BACKEND_HOST;

export default function StudentQuizPage() {
  const { quizToken } = useParams();
  const { authFetch } = useContext(AuthContext);

  //get data passed from the last page using LOCATION.STATE
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [attemptId, setAttemptId] = useState(null);
  const [maxAttempts, setMaxAttempts] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState(null);
  const canPrev = false;
  const canNext = true;
  const selectedQuestion = questions?.[selectedQuestionIndex] || null;
  const navigate = useNavigate();

  //fetch from backend in case quiz data is lost from state
  useEffect(() => {
    if (!backendHost) return;
    if (!quizToken || !authFetch) return;

    authFetch(`${backendHost}/api/student/quiz-access/${quizToken}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setFetchErr(data.message || "Failed to load quiz");
          return;
        }
        setQuiz(data.quiz);
        setQuestions(data.questions);
        setAttemptId(data.attemptId);
        setMaxAttempts(data.quiz.maxAttempts);
        setAttemptCount(data.totalAttempts);
      })
      .catch((err) => {
        console.error(err);
        setFetchErr("Something went wrong while fetching the quiz");
      })
      .finally(() => setLoading(false));
  }, [authFetch, quizToken]);

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

  const handleTimeout = () => {
    if (selectedQuestionIndex < questions.length - 1) {
      setSelectedQuestionIndex((prev) => prev + 1);
    } else {
      handleQuizSubmit();
    }
  };

  const handleQuizSubmit = async () => {
    try {
      //console.log("questions: ", questions);
      //console.log("answers: ", answers);
      //console.log("quiz: ", quiz);
      //console.log("attemptId: ", attemptId);
      const response = await authFetch(
        `${backendHost}/api/student/quiz-submit`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questions, answers, quiz, attemptId }),
          credentials: "include",
        },
      );
      if (!response || !response.ok) {
        const result = await response.json();
        throw new Error(
          result.errors?.map((e) => e.msg).join(", ") ||
            result?.message ||
            "failed to submit quiz",
        );
      }

      //console.log(result);

      toast.success("Attempt received!");
      navigate("/student", { replace: true });
    } catch (error) {
      console.error(error);
      alert("Something went wrong while submitting attempt");
    }
  };

  const deleteAttempt = async () => {
    try {
      const response = await authFetch(
        `${backendHost}/api/student/quiz-access/${quizToken}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
      );
      if (!response || !response.ok) {
        const result = await response.json();
        throw new Error(
          result?.errors?.map((e) => e.msg).join(", ") ||
            result?.message ||
            "Failed to delete attempt",
        );
      }
    } catch (err) {
      console.error("Failed delete attempt", err);
      toast.error("Failed to delete attempt");
    }
  };

  if (loading) {
    return <LoadingScreen fullScreen />;
  }

  if (fetchErr) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-gray-100">
        <div className="text-center">
          <p className="text-red-400">{fetchErr}</p>
          <button
            onClick={async () => {
              await deleteAttempt();
              navigate("/student");
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
