// QuizMetadata.jsx


export default function QuizzesMetadata({ quiz }) {
  if (!quiz) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select a quiz to view details
      </div>
    );
  }

  return (
    <div className="flex-1 h-full bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-700 p-4">
        <h2 className="text-xl font-semibold text-white mb-2">{quiz.title}</h2>
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>{quiz.questionCount} questions</span>
          <span>•</span>
          <span>Created {quiz.createdAt || 'Recently'}</span>
        </div>
      </div>

      {/* Metadata Content */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* Description */}
        <div>
          <label className="text-sm font-semibold text-gray-400 block mb-2">
            Description
          </label>
          <p className="text-sm text-gray-300">
            {quiz.description || 'No description provided'}
          </p>
        </div>

        {/* Share Token */}
        <div>
          <label className="text-sm font-semibold text-gray-400 block mb-2">
            Share Token
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={quiz.shareToken || 'N/A'}
              readOnly
              className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded text-gray-400 text-sm"
            />
            {quiz.shareToken && (
              <button className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors">
                Copy
              </button>
            )}
          </div>
        </div>

        {/* Time Limit */}
        <div>
          <label className="text-sm font-semibold text-gray-400 block mb-2">
            Time Limit
          </label>
          <p className="text-sm text-gray-300">
            {quiz.timeLimit ? `${quiz.timeLimit} minutes` : 'No time limit'}
          </p>
        </div>

        {/* Due Date */}
        <div>
          <label className="text-sm font-semibold text-gray-400 block mb-2">
            Due Date
          </label>
          <p className="text-sm text-gray-300">
            {quiz.dueDate 
              ? new Date(quiz.dueDate).toLocaleString() 
              : 'No due date'}
          </p>
        </div>

        {/* Status */}
        <div>
          <label className="text-sm font-semibold text-gray-400 block mb-2">
            Status
          </label>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
            quiz.status === 'active' 
              ? 'bg-green-600 text-white' 
              : 'bg-gray-600 text-gray-300'
          }`}>
            {quiz.status || 'Draft'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-700 p-4 space-y-2">
        <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors font-medium">
          Edit Quiz
        </button>
        <button className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors font-medium">
          View Results
        </button>
      </div>
    </div>
  );
}