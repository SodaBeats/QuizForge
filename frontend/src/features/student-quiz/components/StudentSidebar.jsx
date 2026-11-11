export function StudentSidebar({
  questions,
  onQuestionSelect,
  currentQuestionIndex,
  answeredQuestions,
  onRequestSubmit,
  className = "",
}) {
  const totalQuestions = questions?.length ?? 0;
  const answeredCount = answeredQuestions?.size || 0;
  const progressPercentage =
    totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  return (
    <div className={`w-full shrink-0 border-b-2 border-accent/50 bg-specialsurface flex flex-col lg:h-full lg:w-56 lg:border-b-0 lg:border-r-2 lg:w-80 ${className}`}>
      {/* Header */}
      <div className="border-b border-muted/20 px-3 py-2 md:p-4">
        <h2 className="text-sm font-semibold text-inkondark lg:text-lg">Questions</h2>
        <p className="mt-1 text-[10px] text-muted lg:text-xs">
          {answeredCount} of {totalQuestions} answered
        </p>
      </div>

      {/* Progress Bar */}
      <div className="border-b border-muted/20 px-3 py-2 lg:px-4 lg:py-3">
        <div className="w-full bg-muted/20 rounded-full h-2">
          <div
            className="bg-accent h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Questions List - Now a vertical list */}
      <div className="max-h-20 overflow-x-auto overflow-y-hidden p-2 lg:min-h-0 lg:max-h-none lg:flex-1 lg:overflow-x-hidden lg:overflow-y-auto">
        <div className="flex w-max flex-row gap-1 lg:w-auto lg:flex-col">
          {questions?.map((question, index) => {
            const isSelected = index === currentQuestionIndex;
            const isAnswered = answeredQuestions?.has(question.id);

            return (
              <button
                key={question.id}
                onClick={() => onQuestionSelect(index)}
                className={`
                  flex min-w-28 items-center gap-2 rounded-lg p-2 text-left text-xs transition-all
                  lg:min-w-0 lg:gap-3 lg:p-3 lg:text-sm
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
      <div className="hidden border-t border-muted/20 p-4 lg:block">
        <button
          className="w-full rounded-lg bg-accept px-4 py-3 font-semibold text-inkondark transition-colors hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onRequestSubmit}
        >
          Submit Quiz
        </button>
      </div>
    </div>
  );
}
