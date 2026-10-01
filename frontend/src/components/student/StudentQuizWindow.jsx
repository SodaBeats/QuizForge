// --------------------------------------------------
// SUB COMPONENT
// --------------------------------------------------
function ReasoningAnswerInput({ answers, question, onAnswerChange }) {
  // prevent pasting answer
  const handlePaste = (e) => {
    e.preventDefault();
  };

  return (
    <div className="h-48 flex flex-col">
      {/* Fixed height for textarea to prevent takeover */}
      <textarea
        className="w-full flex-1 bg-surface/40 border border-muted/20 rounded-md p-4 focus:border-accent focus:outline-none text-ink text-sm resize-none"
        placeholder="Type your answer here..."
        value={answers[question.id] || ""}
        onChange={(e) => onAnswerChange(e.target.value)}
        onPaste={(e) => handlePaste(e)}
      />
    </div>
  );
}

export default function StudentQuizWindow({
  question,
  onNext,
  onPrev,
  canNext,
  canPrev,
  answers,
  onAnswerChange,
}) {
  if (!question)
    return (
      <div className="flex-1 p-8 text-muted">
        Select a question to begin.
      </div>
    );

  return (
    <div className="flex-1 flex flex-col bg-surface text-ink">
      {/* Question Content */}
      <div className="flex-1 flex flex-col h-full max-w-4xl mx-auto w-full px-8">
        {/* Question Part */}
        <div className="flex-1 flex flex-col justify-center py-6 border-b border-muted/20 overflow-y-auto pr-2">
          <h1 className="text-xl md:text-2xl font-medium leading-relaxed select-none text-ink text-center">
            {question.questionText}
          </h1>
        </div>

        {/* Input Part */}
        <div className="flex-1 flex flex-col justify-center py-6">
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
                          ? "border-accent bg-accent/10 text-ink"
                          : "border-muted/20 bg-surface/20 text-muted hover:border-muted/20 hover:bg-muted/10"
                      }`}
                    >
                      {/* Smaller Letter Indicator */}
                      <div
                        className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0 ${
                          answers?.[question.id] === letter.toLowerCase()
                            ? "bg-accent text-canvas"
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
                  <span className="text-ink text-sm flex-1">True</span>
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
                  <span className="text-ink text-sm flex-1">False</span>
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
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="border-t border-muted/20 p-6 flex justify-between items-center bg-surface/50 backdrop-blur-sm">
        <button
          onClick={onPrev}
          disabled={!canPrev}
          className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all disabled:opacity-20 hover:bg-muted/10"
        >
          ← Previous
        </button>
        <button
          onClick={onNext}
          disabled={!canNext}
          className="flex items-center gap-2 px-8 py-2 bg-accent text-canvas rounded-lg font-semibold transition-all disabled:opacity-20"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
