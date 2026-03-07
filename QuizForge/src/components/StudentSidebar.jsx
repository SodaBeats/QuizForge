
// StudentQuizSidebar.jsx
export default function StudentSidebar({ 
  questions, 
  currentQuestionIndex, 
  onQuestionSelect,
  answeredQuestions 
}) {
  return (
    <div className="w-64 border-r border-gray-700 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-700 p-4">
        <h2 className="text-lg font-semibold text-white">Questions</h2>
        <p className="text-xs text-gray-400 mt-1">
          {/*answeredQuestions.size} of {questions.length*/} 10 of 12 answered
        </p>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-3 border-b border-gray-700">
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{/* width: `${(answeredQuestions.size / questions.length) * 100}%` */}}
          />
        </div>
      </div>

      {/* Questions List */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-4 gap-2">
          {questions?.map((question, index) => {
            const isAnswered = answeredQuestions.has(question.id);
            const isCurrent = currentQuestionIndex === index;

            return (
              <button
                key={question.id}
                onClick={() => onQuestionSelect(index)}
                className={`
                  aspect-square rounded-lg font-semibold text-sm transition-all
                  ${isCurrent 
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400' 
                    : isAnswered
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }
                `}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit Quiz Button */}
      <div className="border-t border-gray-700 p-4">
        <button 
          className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold"
          onClick={() => {
            const unanswered = questions.length - answeredQuestions.size;
            if (unanswered > 0) {
              const confirm = window.confirm(
                `You have ${unanswered} unanswered question(s). Submit anyway?`
              );
              if (!confirm) return;
            }
            // TODO: Submit quiz logic
            console.log('Submitting quiz...');
          }}
        >
          Submit Quiz
        </button>
      </div>
    </div>
  );
}