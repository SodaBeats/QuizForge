import { useEffect, useState } from "react";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { StudentSidebar } from "./StudentSidebar";
import { StudentQuizWindow } from "./StudentQuizWindow";
import { StudentTimeLimit } from "./StudentTimeLimit";
import { getQuestionTimeRemainingMs } from "../lib/attemptStorage";

export function StudentQuizStage({
  questions,
  onQuestionSelect,
  selectedQuestionIndex,
  answeredQuestions,
  onQuizSubmit,
  selectedQuestion,
  onPrev,
  onNext,
  answers,
  onAnswerChange,
  onTimeout,
  attemptCount,
  maxAttempts,
  attemptId,
}) {
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [timerNow, setTimerNow] = useState(() => Date.now());
  const unansweredCount =
    (questions?.length ?? 0) - (answeredQuestions?.size ?? 0);
  const previousQuestion =
    selectedQuestionIndex > 0 ? questions?.[selectedQuestionIndex - 1] : null;

  useEffect(() => {
    if (!previousQuestion || previousQuestion.timeLimit <= 0) return;

    const intervalId = setInterval(() => setTimerNow(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, [previousQuestion]);

  const canPrev =
    selectedQuestionIndex > 0 &&
    Boolean(previousQuestion) &&
    getQuestionTimeRemainingMs({
      attemptId,
      questionId: previousQuestion.id,
      timeLimit: previousQuestion.timeLimit,
      now: timerNow,
    }) > 0;
  const canNext =
    selectedQuestionIndex >= 0 &&
    selectedQuestionIndex < (questions?.length ?? 0) - 1;

  const handleRequestSubmit = () => {
    setShowSubmitConfirm(true);
  };

  return (
    <div className="flex flex-1 flex-col overflow-visible bg-specialsurface lg:min-h-0 lg:flex-row lg:overflow-hidden">
      <StudentTimeLimit
        className="lg:order-3"
        key={selectedQuestionIndex}
        timeLimit={selectedQuestion?.timeLimit ?? null}
        onTimeout={onTimeout}
        attemptCount={attemptCount}
        maxAttempts={maxAttempts}
        attemptId={attemptId}
        questionId={selectedQuestion?.id}
      />

      <StudentSidebar
        questions={questions}
        onQuestionSelect={onQuestionSelect}
        currentQuestionIndex={selectedQuestionIndex}
        answeredQuestions={answeredQuestions}
        onRequestSubmit={handleRequestSubmit}
        className="lg:order-1"
      />

      <StudentQuizWindow
        question={selectedQuestion}
        canPrev={canPrev}
        onPrev={onPrev}
        canNext={canNext}
        onNext={onNext}
        answers={answers}
        onAnswerChange={onAnswerChange}
        onSubmitQuiz={handleRequestSubmit}
        className="lg:order-2"
      />
      <ConfirmDialog
        open={showSubmitConfirm}
        title="Submit quiz?"
        message={
          unansweredCount === 0
            ? "Submit attempt?"
            : `You have ${unansweredCount} unanswered question(s). Submit anyway?`
        }
        confirmLabel={unansweredCount === 0 ? "Submit quiz" : "Submit anyway"}
        onConfirm={() => {
          setShowSubmitConfirm(false);
          onQuizSubmit();
        }}
        onCancel={() => setShowSubmitConfirm(false)}
      />
    </div>
  );
}
