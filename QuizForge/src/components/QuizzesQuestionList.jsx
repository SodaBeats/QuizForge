
// QuizQuestionsList.jsx
export default function QuizzesQuestionsList({ questions }) {


  return (
    <div className="flex-1 h-full bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-white">Questions</h3>
      </div>

      {/* Questions List */}
      <div className="flex-1 p-4 overflow-y-auto">
        {questions && questions.length > 0 ? (
          <div className="space-y-2">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className="p-3 bg-gray-800 rounded border border-gray-700 hover:border-gray-600 transition-colors"
              >
                <div className="text-sm text-gray-300">
                  <span className="font-semibold text-blue-400">Q{index + 1}:</span> {question.text}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No questions yet
          </div>
        )}
      </div>
    </div>
  );
}