import { StudentSidebar } from "./StudentSidebar";
import { StudentQuizWindow } from "./StudentQuizWindow";
import { StudentTimeLimit } from "./StudentTimeLimit";

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
  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <StudentSidebar
        questions={questions}
        onQuestionSelect={onQuestionSelect}
        currentQuestionIndex={selectedQuestionIndex}
        answeredQuestions={answeredQuestions}
        onQuizSubmit={onQuizSubmit}
      />

      <StudentQuizWindow
        question={selectedQuestion}
        canPrev={false}
        onPrev={onPrev}
        canNext={true}
        onNext={onNext}
        answers={answers}
        onAnswerChange={onAnswerChange}
      />

      <StudentTimeLimit
        key={selectedQuestionIndex}
        timeLimit={selectedQuestion?.timeLimit ?? null}
        onTimeout={onTimeout}
        attemptCount={attemptCount}
        maxAttempts={maxAttempts}
        attemptId={attemptId}
        questionId={selectedQuestion?.id}
      />
    </div>
  );
}
