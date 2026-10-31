// StudentQuizSidebar.jsx
import { useState } from "react";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

export default function StudentSidebar({
  questions,
  currentQuestionIndex,
  //onQuestionSelect,
  answeredQuestions,
  onQuizSubmit,
}) {
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const totalQuestions = questions?.length ?? 0;
  const answeredCount = answeredQuestions?.size || 0;
  const unansweredCount = totalQuestions - answeredCount;
  const progressPercentage =
    totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const handleSubmitClick = () => {
    if (unansweredCount > 0) {
      setShowSubmitConfirm(true);
      return;
    }
    onQuizSubmit();
  };

  return (
    <div className="w-80 border-r-2 border-accent/50 bg-specialsurface flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-muted/20 p-4">
        <h2 className="text-lg font-semibold text-inkondark">Questions</h2>
        <p className="text-xs text-muted mt-1">
          {answeredCount} of {totalQuestions} answered
        </p>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-3 border-b border-muted/20">
        <div className="w-full bg-muted/20 rounded-full h-2">
          <div
            className="bg-accent h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Questions List - Now a vertical list */}
      <div className="flex-1 p-2 overflow-y-auto">
        <div className="flex flex-col gap-1">
          {questions?.map((question, index) => {
            const isSelected = index === currentQuestionIndex;
            const isAnswered = answeredQuestions?.has(question.id);

            return (
              <button
                key={question.id}
                //onClick={() => onQuestionSelect(index)}
                className={`
                  flex items-center gap-3 p-3 rounded-lg text-sm transition-all text-left
                  ${
                    isSelected
                      ? "bg-accent/20 text-accent border border-accent/50"
                      : "text-muted hover:bg-muted/10 border border-transparent"
                  }
                `}
              >
                {/* Status Indicator Circle */}
                <div
                  className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0
                  ${isAnswered ? "bg-accept text-inkondark" : "bg-surface text-muted"}
                  ${isSelected ? "ring-2 ring-accent ring-offset-2 ring-offset-specialsurface" : ""}
                `}
                >
                  {index + 1}
                </div>

                <span className="truncate font-medium">
                  {`Question ${index + 1}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit Quiz Button */}
      <div className="border-t border-muted/20 p-4">
        <button
          className="w-full px-4 py-3 bg-accept text-inkondark hover:bg-green-600 rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSubmitClick}
        >
          Submit Quiz
        </button>
      </div>

      <ConfirmDialog
        open={showSubmitConfirm}
        title="Submit quiz?"
        message={`You have ${unansweredCount} unanswered question(s). Submit anyway?`}
        confirmLabel="Submit anyway"
        onConfirm={() => {
          setShowSubmitConfirm(false);
          onQuizSubmit();
        }}
        onCancel={() => setShowSubmitConfirm(false)}
      />
    </div>
  );
}
