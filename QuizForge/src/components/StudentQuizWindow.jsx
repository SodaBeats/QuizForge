
export default function StudentQuizWindow({ 
  question, 
  onNext, 
  onPrev, 
  canNext, 
  canPrev,
  userAnswer,
  onAnswerChange 
}) {
  if (!question) return <div className="flex-1 p-8 text-gray-500">Select a question to begin.</div>;

  return (
    <div className="flex-1 flex flex-col bg-gray-900 text-white">
      {/* Question Content */}
      <div className="flex-1 p-8 max-w-3xl mx-auto w-full">
        <span className="text-blue-400 text-sm font-bold uppercase tracking-wider">
          {question.questionType === 'multiple-choice' ? (<p>Multiple Choice</p>) 
          : question.questionType === 'true-false' ? (<p>True or False</p>) : (<p>Reasoning</p>)}
        </span>
        <h1 className="text-2xl font-medium mt-2 mb-8 leading-relaxed select-none">
          {question.questionText}
        </h1>

        {/* Dynamic Inputs based on Type */}
        <div className="space-y-4">
          {question.questionType === 'multiple-choice' ? (
            ['A', 'B', 'C', 'D'].map((letter) => {
              const optionKey = `option${letter}`;
              const optionText = question[optionKey];
              if (!optionText) return null;

              return (
                <button
                  key={letter}
                  onClick={() => onAnswerChange(letter.toLowerCase())}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                    userAnswer === letter.toLowerCase()
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                    userAnswer === letter.toLowerCase() ? 'bg-blue-500' : 'bg-gray-700'
                  }`}>
                    {letter}
                  </div>
                  {optionText}
                </button>
              );
            })
          ) : (
            <textarea
              className="w-full bg-gray-800 border-2 border-gray-700 rounded-xl p-4 focus:border-blue-500 focus:outline-none h-40 resize-none"
              placeholder="Type your answer here..."
              value={userAnswer || ''}
              onChange={(e) => onAnswerChange(e.target.value)}
            />
          )}
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