
export default function StudentQuizWindow({ 
  question, 
  onNext, 
  onPrev, 
  canNext, 
  canPrev,
  answers,
  onAnswerChange 
}) {
  if (!question) return <div className="flex-1 p-8 text-gray-500">Select a question to begin.</div>;

  return (
    <div className="flex-1 flex flex-col bg-gray-900 text-white">
      {/* Question Content */}
      <div className="flex-1 flex flex-col h-full max-w-4xl mx-auto w-full px-8">
        {/* Question Part */}
        <div className="flex-1 flex flex-col justify-center py-6 border-b border-gray-800/50 overflow-y-auto pr-2">
          <h1 className="text-xl md:text-2xl font-medium leading-relaxed select-none text-white text-center">
            {question.questionText}
          </h1>
        </div>

        {/* Input Part */}
        <div className="flex-1 flex flex-col justify-center py-6">
          <div className="w-full max-w-2xl mx-auto"> 
            {/* max-w-2xl keeps buttons from getting too wide on desktop */}
            {question.questionType === 'multiple-choice' ? (
              <div className="space-y-2"> {/* Reduced vertical spacing */}
                {['A', 'B', 'C', 'D'].map((letter) => {
                  const optionKey = `option${letter}`;
                  const optionText = question[optionKey];
                  if (!optionText) return null;

                  return (
                    <button
                      key={letter}
                      onClick={() => onAnswerChange(letter.toLowerCase())}
                      className={`w-full p-2.5 rounded-lg border text-left transition-all flex items-center gap-3 ${
                        answers?.[question.id] === letter.toLowerCase()
                          ? 'border-blue-500 bg-blue-500/10 text-white'
                          : 'border-gray-800 bg-gray-800/20 text-gray-400 hover:border-gray-700 hover:bg-gray-800/40'
                      }`}
                    >
                      {/* Smaller Letter Indicator */}
                      <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0 ${
                        answers?.[question.id] === letter.toLowerCase() ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'
                      }`}>
                        {letter}
                      </div>
                      <span className="text-sm">{optionText}</span>
                    </button>
                  );
                })}
              </div>
            ) : question.questionType === 'true-false' ? (
              <div className="space-y-3">
                {/* True Option */}
                <label className="flex items-center gap-3 p-4 bg-gray-800/40 border border-gray-800 rounded-xl cursor-pointer hover:border-blue-500/50 transition-colors">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value="true"
                    checked={answers[question.id] === 'true'}
                    onChange={(e) => onAnswerChange(e.target.value)}
                    className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-white text-sm flex-1">True</span>
                </label>

                {/* False Option */}
                <label className="flex items-center gap-3 p-4 bg-gray-800/40 border border-gray-800 rounded-xl cursor-pointer hover:border-blue-500/50 transition-colors">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value="false"
                    checked={answers[question.id] === 'false'}
                    onChange={(e) => onAnswerChange(e.target.value)}
                    className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-white text-sm flex-1">False</span>
                </label>
              </div>
            ) : (
              <div className="h-48 flex flex-col"> {/* Fixed height for textarea to prevent takeover */}
                <textarea
                  className="w-full flex-1 bg-gray-800/40 border border-gray-800 rounded-xl p-4 focus:border-blue-500 focus:outline-none text-white text-sm resize-none"
                  placeholder="Type your answer here..."
                  value={answers[question.id] || ''}
                  onChange={(e) => onAnswerChange(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="border-t border-gray-800 p-6 flex justify-between items-center bg-gray-900/50 backdrop-blur-sm">
        <button
          onClick={onPrev}
          disabled={!canPrev}
          className="flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all disabled:opacity-20 hover:bg-gray-800"
        >
          ← Previous
        </button>
        <button
          onClick={onNext}
          disabled={!canNext}
          className="flex items-center gap-2 px-8 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-all disabled:opacity-20"
        >
          Next →
        </button>
      </div>
    </div>
  );
}