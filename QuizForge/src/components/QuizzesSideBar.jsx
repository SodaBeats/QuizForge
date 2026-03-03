
// QuizzesSidebar.jsx

export default function QuizzesSidebar({ quizzes, selectedQuizId, onSelectQuiz, onDeleteQuiz }) {

  return (
    <div className="w-64 border-r border-gray-700 flex flex-col bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-700 p-4">
        <h2 className="text-lg font-semibold text-white">Quizzes</h2>
      </div>
      
      {/* Quiz List */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-2">
          {quizzes?.length > 0 ? (
            quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className={`p-3 rounded text-sm flex items-center justify-between group cursor-pointer ${
                  selectedQuizId === quiz.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
                onClick={() => onSelectQuiz(quiz.id)}
              >
                <div className="flex-1 truncate">
                  <div className="font-medium truncate">{quiz.title}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {quiz.questionCount || 0} questions
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteQuiz(quiz.id);
                  }}
                  className="ml-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                >
                  ✕
                </button>
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-sm text-center py-8">
              No quizzes yet
            </div>
          )}
        </div>
      </div>
      
      {/* Create New Quiz Button */}
      <div className="border-t border-gray-700 p-4">
        <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
          + Create New Quiz
        </button>
      </div>
    </div>
  );
}