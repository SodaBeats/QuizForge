
// StudentQuizSidebar.jsx
export default function StudentSidebar({ 
  questions, 
  currentQuestionIndex, 
  onQuestionSelect,
  answeredQuestions,
  onQuizSubmit
}) {
  const totalQuestions = questions.length;
  const answeredCount = answeredQuestions?.size || 0;
  const progressPercentage = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  return (
    <div className="w-80 border-r border-gray-700 bg-gray-900 flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-700 p-4">
        <h2 className="text-lg font-semibold text-white">Questions</h2>
        <p className="text-xs text-gray-400 mt-1">
          {answeredCount} of {totalQuestions} answered
        </p>
      </div>

      {/* Progress Bar */}
      <div className="px-4 py-3 border-b border-gray-700">
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
                onClick={() => onQuestionSelect(index)}
                className={`
                  flex items-center gap-3 p-3 rounded-lg text-sm transition-all text-left
                  ${isSelected 
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-600/50' 
                    : 'text-gray-400 hover:bg-gray-800 border border-transparent'}
                `}
              >
                {/* Status Indicator Circle */}
                <div className={`
                  w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0
                  ${isAnswered ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}
                  ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900' : ''}
                `}>
                  {index + 1}
                </div>

                <span className="truncate font-medium">
                  {question.questionText || `Question ${index + 1}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit Quiz Button */}
      <div className="border-t border-gray-700 p-4">
        <button 
          className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => {
            const unanswered = totalQuestions - answeredCount;
            if (unanswered > 0) {
              const confirm = window.confirm(
                `You have ${unanswered} unanswered question(s). Submit anyway?`
              );
              console.log(confirm);
              if (!confirm) return;
            }
            onQuizSubmit();
          }}
        >
          Submit Quiz
        </button>
      </div>
    </div>
  );
}