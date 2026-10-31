import { useState, useContext, useCallback, useEffect } from "react";
import { useParams, useNavigate, useBeforeUnload } from "react-router-dom";
import toast from "react-hot-toast";
import LoadingScreen from "../../components/layout/LoadingScreen";
import { AuthContext } from "../../app/providers/AuthProvider";
import StudentTopbar from "../../components/student/StudentTopbar";
import StudentSidebar from "../../components/student/StudentSidebar";
import StudentQuizWindow from "../../components/student/StudentQuizWindow";
import StudentTimeLimit from "../../components/student/StudentTimeLimit";
import {
  useDeleteStudentQuizAttempt,
  useSubmitStudentQuiz,
} from "../../features/student-quiz/api/mutations.js";
import { useStudentQuiz } from "../../features/student-quiz/api/queries.js";

export default function StudentQuizPage() {
  // ----------------------------------------------------------------
  // STATES AND FRIENDS
  // ----------------------------------------------------------------
  const { quizToken } = useParams();
  const storageKey = `quiz_progress_${quizToken}`;
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [answers, setAnswers] = useState(() => {
    const saved = sessionStorage.getItem(storageKey);
    return saved ? JSON.parse(saved).answers : {};
  });
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(() => {
    const saved = sessionStorage.getItem(storageKey);
    return saved ? JSON.parse(saved).selectedQuestionIndex : 0;
  });
  const [answeredQuestions, setAnsweredQuestions] = useState(() => {
    const saved = sessionStorage.getItem(storageKey);
    // sessionStorage can't store a Set
    // save it as an array and convert back
    return saved ? new Set(JSON.parse(saved).answeredQuestions) : new Set();
  });
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

  const canPrev = false;
  const canNext = true;

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

  // save user progress to session
  const saveProgress = (
    updatedAnswers,
    updatedIndex,
    updatedAnsweredQuestions,
  ) => {
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        answers: updatedAnswers,
        selectedQuestionIndex: updatedIndex,
        // Convert Set to array for serialization
        answeredQuestions: [...updatedAnsweredQuestions],
      }),
    );
  };

  // function to clear timers on session storage
  const clearTimerStorage = useCallback(() => {
    if (!attemptId) return;

    const timerPrefix = `quiz_timer_${attemptId}_`;

    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const storageKey = sessionStorage.key(index);

      if (storageKey?.startsWith(timerPrefix)) {
        sessionStorage.removeItem(storageKey);
      }
    }
  }, [attemptId]);

  // ----------------------------------------------------------
  // MUTATION FUNCTIONS
  // ----------------------------------------------------------
  const submitQuizMutation = useSubmitStudentQuiz();

  const deleteAttemptMutation = useDeleteStudentQuizAttempt();

  const handleQuestionSelect = (index) => {
    setSelectedQuestionIndex(index);
    saveProgress(answers, index, answeredQuestions);
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
    saveProgress(
      updatedAnswers,
      selectedQuestionIndex,
      updatedAnsweredQuestions,
    );
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
          // Remove session storage
          sessionStorage.removeItem(storageKey);
          clearTimerStorage();
          toast.success("Attempt received!");
          navigate("/student", { replace: true });
        },
        onError: (error) => console.error(error),
      },
    );
  };

  const hasActiveQuizProgress = () => {
    const savedProgress = sessionStorage.getItem(storageKey);
    const savedAnswers = savedProgress
      ? JSON.parse(savedProgress)?.answers || {}
      : {};

    return Boolean(
      attemptId ||
      Object.keys(savedAnswers).length > 0 ||
      answeredQuestions.size > 0,
    );
  };

  const deleteAttempt = () => {
    deleteAttemptMutation.mutate(quizToken, {
      onSuccess: () => {
        // Remove session storage
        sessionStorage.removeItem(storageKey);
        clearTimerStorage();
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

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-canvas text-inkondark">
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
    <div className="h-screen flex flex-col bg-canvas text-inkondark">
      <StudentTopbar onLogout={handleLogout} />
      <div className="flex h-screen overflow-hidden bg-canvas">
        {showExitWarning && (
          <div className="fixed inset-0 bg-modalback/70 flex items-center justify-center z-50">
            <div className="bg-specialsurface border border-muted p-6 rounded-lg max-w-sm text-center space-y-4">
              <h2 className="text-inkondark text-lg font-semibold">
                Leave Quiz?
              </h2>
              <p className="text-inkondark text-sm">
                Your quiz will be auto-submitted if you navigate away.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowExitWarning(false)}
                  className="px-4 py-2 rounded bg-surface text-inkondark border border-muted/30 hover:bg-muted/20 transition-colors"
                >
                  Stay
                </button>
                <button
                  onClick={() => {
                    setShowExitWarning(false);
                    handleQuizSubmit();
                  }}
                  className="px-4 py-2 rounded bg-accept text-inkondark hover:bg-green-600 transition-colors"
                >
                  Submit & Exit
                </button>
              </div>
            </div>
          </div>
        )}
        {showLogoutWarning && (
          <div className="fixed inset-0 bg-modalback/70 flex items-center justify-center z-50">
            <div className="bg-specialsurface border border-muted p-6 rounded-lg max-w-sm text-center space-y-4">
              <h2 className="text-inkondark text-lg font-semibold">
                Leave Quiz?
              </h2>
              <p className="text-inkondark text-sm">
                Your quiz will be auto-submitted if you navigate away.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowLogoutWarning(false)}
                  className="px-4 py-2 rounded bg-surface text-inkondark border border-muted/30 hover:bg-muted/20 transition-colors"
                >
                  Stay
                </button>
                <button
                  onClick={() => {
                    setShowLogoutWarning(false);
                    submitAndLogout();
                  }}
                  className="px-4 py-2 rounded bg-accept text-inkondark hover:bg-green-600 transition-colors"
                >
                  Submit & Logout
                </button>
              </div>
            </div>
          </div>
        )}
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
          attemptId={attemptId}
          questionId={selectedQuestion?.id}
        />
      </div>
    </div>
  );
}
