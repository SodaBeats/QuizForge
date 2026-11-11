// --------------------------------------------------
// SUB COMPONENT
// --------------------------------------------------
function ReasoningAnswerInput({ answers, question, onAnswerChange }) {
  // prevent pasting answer
  const handlePaste = (e) => {
    e.preventDefault();
  };

  return (
    <div className="h-36 flex flex-col sm:h-48">
      {/* Fixed height for textarea to prevent takeover */}
      <textarea
        className="w-full flex-1 bg-darkslate border border-muted/30 rounded-md p-4 focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-none text-inkondark text-sm placeholder:text-muted resize-none"
        placeholder="Type your answer here..."
        value={answers[question.id] || ""}
        onChange={(e) => onAnswerChange(e.target.value)}
        onPaste={(e) => handlePaste(e)}
      />
    </div>
  );
}

export function StudentQuizWindow({
  question,
  onNext,
  onPrev,
  canNext,
  canPrev,
  answers,
  onAnswerChange,
  onSubmitQuiz,
  className = "",
}) {
  if (!question)
    return (
      <div className="flex-1 p-8 text-muted">Select a question to begin.</div>
    );

  return (
    <div className={`flex min-w-0 flex-1 flex-col bg-specialsurface text-inkondark lg:min-h-0 ${className}`}>
      {/* Question Content */}
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pb-8 sm:px-8 lg:min-h-0 lg:pb-0">
        {/* Question Part */}
        <div className="flex min-h-32 flex-col justify-center border-b border-muted/20 py-4 pr-2 sm:py-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          <h1 className="text-xl md:text-2xl font-medium leading-relaxed select-none text-inkondark text-center">
            {question.questionText}
          </h1>
        </div>

        {/* Input Part */}
        <div className="flex flex-none flex-col justify-center py-4 sm:py-6 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          <div className="w-full max-w-2xl mx-auto">
            {/* max-w-2xl keeps buttons from getting too wide on desktop */}
            {question.questionType === "multiple-choice" ? (
              <div className="space-y-2">
                {" "}
                {/* Reduced vertical spacing */}
                {["A", "B", "C", "D"].map((letter) => {
                  const optionKey = `option${letter}`;
                  const optionText = question[optionKey];
                  if (!optionText) return null;

                  return (
                    <button
                      key={letter}
                      onClick={() => onAnswerChange(letter.toLowerCase())}
                      className={`w-full p-2.5 rounded-lg border text-left transition-all flex items-center gap-3 ${
                        answers?.[question.id] === letter.toLowerCase()
                          ? "border-accent bg-accent/10 text-inkondark"
                          : "border-muted/20 bg-surface/20 text-muted hover:border-muted/20 hover:bg-muted/10"
                      }`}
                    >
                      {/* Smaller Letter Indicator */}
                      <div
                        className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0 ${
                          answers?.[question.id] === letter.toLowerCase()
                            ? "bg-accent text-inkondark"
                            : "bg-surface text-muted"
                        }`}
                      >
                        {letter}
                      </div>
                      <span className="text-sm">{optionText}</span>
                    </button>
                  );
                })}
              </div>
            ) : question.questionType === "true-false" ? (
              <div className="space-y-3">
                {/* True Option */}
                <label className="flex items-center gap-3 p-4 bg-surface/40 border border-muted/20 rounded-md cursor-pointer hover:border-accent/50 transition-colors">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value="true"
                    checked={answers[question.id] === "true"}
                    onChange={(e) => onAnswerChange(e.target.value)}
                    className="w-5 h-5 text-accent focus:ring-2 focus:ring-accent"
                  />
                  <span className="text-inkondark text-sm flex-1">True</span>
                </label>

                {/* False Option */}
                <label className="flex items-center gap-3 p-4 bg-surface/40 border border-muted/20 rounded-md cursor-pointer hover:border-accent/50 transition-colors">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value="false"
                    checked={answers[question.id] === "false"}
                    onChange={(e) => onAnswerChange(e.target.value)}
                    className="w-5 h-5 text-accent focus:ring-2 focus:ring-accent"
                  />
                  <span className="text-inkondark text-sm flex-1">False</span>
                </label>
              </div>
            ) : (
              <ReasoningAnswerInput
                answers={answers}
                question={question}
                onAnswerChange={onAnswerChange}
              />
            )}
          </div>
          <button
            onClick={onSubmitQuiz}
            className="mx-auto mt-8 w-full max-w-2xl rounded-lg border border-accept/50 bg-accept/10 px-4 py-3 text-sm font-semibold text-inkondark transition-colors hover:bg-accept/20 lg:hidden"
          >
            Finish and submit quiz
          </button>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="sticky bottom-0 z-20 flex items-center justify-between gap-2 border-t border-muted/20 bg-specialsurface p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:gap-3 sm:p-6 lg:static">
        <button
          onClick={onPrev}
          disabled={!canPrev}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-accent px-2 py-2 text-xs font-semibold transition-all hover:bg-muted/10 disabled:opacity-20 sm:flex-none sm:gap-2 sm:px-6 sm:text-base"
        >
          ← Previous
        </button>
        <button
          onClick={onNext}
          disabled={!canNext}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-accent px-2 py-2 text-xs font-semibold text-inkondark transition-all disabled:opacity-20 sm:flex-none sm:gap-2 sm:px-8 sm:text-base"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
