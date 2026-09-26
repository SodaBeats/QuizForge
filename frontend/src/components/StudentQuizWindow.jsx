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
        className="w-full flex-1 bg-surface-800/40 border border-surface-700 rounded-xl p-4 focus:border-brand-500 focus:outline-none text-ink-50 text-sm resize-none"
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
      <div className="flex-1 p-8 text-ink-500">
        Select a question to begin.
      </div>
    );

  return (
    <div className="flex-1 flex flex-col bg-surface-900 text-ink-50">
      {/* Question Content */}
      <div className="flex-1 flex flex-col h-full max-w-4xl mx-auto w-full px-8">
        {/* Question Part */}
        <div className="flex-1 flex flex-col justify-center py-6 border-b border-surface-700/50 overflow-y-auto pr-2">
          <h1 className="text-xl md:text-2xl font-medium leading-relaxed select-none text-ink-50 text-center">
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
                          ? "border-brand-500 bg-brand-500/10 text-ink-50"
                          : "border-surface-700 bg-surface-800/20 text-ink-400 hover:border-surface-700 hover:bg-surface-800/40"
                      }`}
                    >
                      {/* Smaller Letter Indicator */}
                      <div
                        className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0 ${
                          answers?.[question.id] === letter.toLowerCase()
                            ? "bg-brand-500 text-ink-50"
                            : "bg-surface-700 text-ink-400"
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
                <label className="flex items-center gap-3 p-4 bg-surface-800/40 border border-surface-700 rounded-xl cursor-pointer hover:border-brand-500/50 transition-colors">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value="true"
                    checked={answers[question.id] === "true"}
                    onChange={(e) => onAnswerChange(e.target.value)}
                    className="w-5 h-5 text-brand-500 focus:ring-2 focus:ring-brand-500"
                  />
                  <span className="text-ink-50 text-sm flex-1">True</span>
                </label>

                {/* False Option */}
                <label className="flex items-center gap-3 p-4 bg-surface-800/40 border border-surface-700 rounded-xl cursor-pointer hover:border-brand-500/50 transition-colors">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value="false"
                    checked={answers[question.id] === "false"}
                    onChange={(e) => onAnswerChange(e.target.value)}
                    className="w-5 h-5 text-brand-500 focus:ring-2 focus:ring-brand-500"
                  />
                  <span className="text-ink-50 text-sm flex-1">False</span>
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
      <div className="border-t border-surface-700 p-6 flex justify-between items-center bg-surface-900/50 backdrop-blur-sm">
        <button
          onClick={onPrev}
          disabled={!canPrev}
          className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all disabled:opacity-20 hover:bg-surface-800"
        >
          ← Previous
        </button>
        <button
          onClick={onNext}
          disabled={!canNext}
          className="flex items-center gap-2 px-8 py-2 bg-brand-500 hover:bg-brand-600 rounded-lg font-semibold transition-all disabled:opacity-20"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
