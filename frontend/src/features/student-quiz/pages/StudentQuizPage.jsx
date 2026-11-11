import { useState, useContext, useCallback, useEffect } from "react";
import { useParams, useNavigate, useBeforeUnload } from "react-router-dom";
import toast from "react-hot-toast";
import { LoadingScreen } from "../../../components/layout/LoadingScreen";
import { AuthContext } from "../../../app/providers/AuthProvider";
import { StudentTopbar } from "../components/StudentTopbar";
import { StudentQuizWarnings } from "../components/StudentQuizWarnings";
import { StudentQuizStage } from "../components/StudentQuizStage";
import {
  useDeleteStudentQuizAttempt,
  useSubmitStudentQuiz,
} from "../api/mutations.js";
import { useStudentQuiz } from "../api/queries.js";
import {
  loadProgress,
  saveProgress,
  clearAttempt,
} from "../lib/attemptStorage.js";

export function StudentQuizPage() {
  // ----------------------------------------------------------------
  // STATES AND FRIENDS
  // ----------------------------------------------------------------
  const { quizToken } = useParams();
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // one read/parse of this attempt's saved progress seeds all three states
  const [initialProgress] = useState(() => loadProgress(quizToken));
  const [answers, setAnswers] = useState(initialProgress.answers);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(
    initialProgress.selectedQuestionIndex,
  );
  const [answeredQuestions, setAnsweredQuestions] = useState(
    initialProgress.answeredQuestions,
  );
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [showLogoutWarning, setShowLogoutWarning] = useState(false);

  // Fetch quiz data
  const { data: quizData, isLoading, error } = useStudentQuiz(quizToken);

  // Extract quiz data for readability
  const quiz = quizData?.quiz;
  const questions = quizData?.questions;
  const attemptId = quizData?.attemptId;
  const attemptCount = quizData?.totalAttempts;
  const maxAttempts = quiz?.maxAttempts;
  const selectedQuestion = questions?.[selectedQuestionIndex] || null;

  // intercept backward navigation
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
  }, []);

  // If navigating back
  // Ask user to stay or submit quiz before navigation
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      setShowExitWarning(true);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // ----------------------------------------------------------
  // MUTATION FUNCTIONS
  // ----------------------------------------------------------
  const submitQuizMutation = useSubmitStudentQuiz();

  const deleteAttemptMutation = useDeleteStudentQuizAttempt();

  const handleQuestionSelect = (index) => {
    setSelectedQuestionIndex(index);
    saveProgress(quizToken, {
      answers,
      selectedQuestionIndex: index,
      answeredQuestions,
    });
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
    const updatedAnswers = { ...answers, [selectedQuestion.id]: ans };
    const updatedAnsweredQuestions = new Set(answeredQuestions);
    updatedAnsweredQuestions.add(selectedQuestion.id);

    setAnswers(updatedAnswers);
    setAnsweredQuestions(updatedAnsweredQuestions);
    saveProgress(quizToken, {
      answers: updatedAnswers,
      selectedQuestionIndex,
      answeredQuestions: updatedAnsweredQuestions,
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

  // warn before closing or refreshing tab
  useBeforeUnload(
    useCallback((e) => {
      e.preventDefault();
    }, []),
  );

  const handleQuizSubmit = async () => {
    return submitQuizMutation.mutateAsync(
      {
        questions,
        answers,
        quiz,
        attemptId,
      },
      {
        onSuccess: () => {
          clearAttempt({
            quizToken,
            attemptId,
            questionIds: questions.map((question) => question.id),
          });
          toast.success("Attempt received!");
          navigate("/student", { replace: true });
        },
        onError: (error) => console.error(error),
      },
    );
  };

  const hasActiveQuizProgress = () => {
    const { answers: savedAnswers } = loadProgress(quizToken);

    return Boolean(
      attemptId ||
      Object.keys(savedAnswers).length > 0 ||
      answeredQuestions.size > 0,
    );
  };

  const deleteAttempt = () => {
    deleteAttemptMutation.mutate(quizToken, {
      onSuccess: () => {
        clearAttempt({
          quizToken,
          attemptId,
          questionIds: questions.map((question) => question.id),
        });
        navigate("/student");
      },
      onError: (deleteError) =>
        console.error("Failed delete attempt", deleteError),
    });
  };

  const handleLogout = async () => {
    if (hasActiveQuizProgress()) {
      return setShowLogoutWarning(true);
    }
    try {
      await logout();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while logging out");
    }
  };

  const submitAndLogout = async () => {
    try {
      await handleQuizSubmit();
      await logout();
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong on submit and logout");
    }
  };

  // -------------------------------------------------------------------
  // ERROR BOUNDARIES
  // -------------------------------------------------------------------
  if (isLoading) {
    return <LoadingScreen fullScreen />;
  }

  if (submitQuizMutation.isPending) {
    return <LoadingScreen fullScreen message="Submitting your exam..." />;
  }

  if (error) {
    return (
      <div className="h-dvh flex items-center justify-center bg-canvas text-inkondark">
        <div className="text-center">
          <p className="text-red-400">{error?.message}</p>
          <button
            onClick={() => {
              deleteAttempt();
            }}
            className="mt-4 bg-accept text-inkondark hover:bg-green-600 font-display font-bold px-4 py-2 rounded-md transition-all hover:-translate-y-0.5 active:translate-y-0.5"
          >
            Back to Student Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col bg-canvas text-inkondark lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      <StudentTopbar onLogout={handleLogout} />
      <StudentQuizWarnings
        showExitWarning={showExitWarning}
        setShowExitWarning={setShowExitWarning}
        onSubmitAndExit={() => {
          setShowExitWarning(false);
          handleQuizSubmit();
        }}
        showLogoutWarning={showLogoutWarning}
        setShowLogoutWarning={setShowLogoutWarning}
        onSubmitAndLogout={() => {
          setShowLogoutWarning(false);
          submitAndLogout();
        }}
      />
      <StudentQuizStage
        questions={questions}
        onQuestionSelect={handleQuestionSelect}
        selectedQuestionIndex={selectedQuestionIndex}
        answeredQuestions={answeredQuestions}
        onQuizSubmit={handleQuizSubmit}
        selectedQuestion={selectedQuestion}
        onPrev={handlePrev}
        onNext={handleNext}
        answers={answers}
        onAnswerChange={handleAnswerChange}
        onTimeout={handleTimeout}
        attemptCount={attemptCount}
        maxAttempts={maxAttempts}
        attemptId={attemptId}
      />
    </div>
  );
}
