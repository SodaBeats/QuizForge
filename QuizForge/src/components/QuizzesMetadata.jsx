// QuizMetadata.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { toDatetimeLocal } from '../util/toDateTimeLocal';

//eslint-disable-next-line
export default function QuizzesMetadata({ quiz, key, onUpdateQuizMeta }) {

  const [editingQuiz, setEditingQuiz] = useState({...quiz});
  const navigate = useNavigate();

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
        <input
          type="text"
          name="quizTitle"
          value={editingQuiz.quizTitle || ''}
          onChange={(e) => setEditingQuiz({ 
            ...editingQuiz, 
            quizTitle: e.target.value 
          })}
          placeholder="Enter Quiz Title..."
          className="w-full bg-transparent text-xl font-semibold text-white mb-2 border-b border-transparent focus:border-blue-500 focus:outline-none transition-all hover:bg-gray-800/50 rounded px-1 -ml-1"
        />
        
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
          <textarea
            value={editingQuiz.description}
            onChange={(e)=>{setEditingQuiz({...editingQuiz, description: e.target.value})}}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
            rows="3"
            placeholder="Enter quiz description"
          />
        </div>

        {/* Share Token */}
        <div>
          <label className="text-sm font-semibold text-gray-400 block mb-2">
            Share Token
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={quiz.shareToken.toUpperCase() || 'N/A'}
              readOnly
              className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded text-gray-400 text-sm"
            />
            {quiz.shareToken && (
              <button 
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(quiz.shareToken);
                  toast.success('Token copied to clipboard!', {
                    duration: 2000,
                    style: {
                      background: '#10B981',
                      color: '#fff',
                    },
                  });
                }}
              >
                Copy
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Time Limit */}
          <div>
            <label className="text-sm font-semibold text-gray-400 block mb-2">
              Time Limit (minutes)
            </label>
            <input
              type="number"
              name="timeLimit"
              min="0"
              placeholder="e.g. 30"
              value={editingQuiz.timeLimit || ''}
              onChange={(e) =>
                setEditingQuiz({
                  ...editingQuiz,
                  timeLimit: e.target.value === '' ? null : Number(e.target.value),
                })
              }
              className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white 
                focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="text-sm font-semibold text-gray-400 block mb-2">
              Due Date
            </label>
            <input
              type="datetime-local"
              name="dueDate"
              value={toDatetimeLocal(editingQuiz.dueDate).slice(0,16)}
              onChange={(e) =>
                setEditingQuiz({
                  ...editingQuiz,
                  dueDate: e.target.value || null,
                })
              }
              className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white 
                focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Status and Max Attempts - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Max Attempts */}
          <div>
            <label className="text-sm font-semibold text-gray-400 block mb-2">
              Max Attempts
            </label>
            <input
              type="number"
              name="maxAttempts"
              min="1"
              placeholder="e.g. 3"
              value={editingQuiz.maxAttempts || ''}
              onChange={(e) =>
                setEditingQuiz({
                  ...editingQuiz,
                  maxAttempts: e.target.value === '' ? null : Number(e.target.value),
                })
              }
              className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white 
                focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-semibold text-gray-400 block mb-2">
              Status
            </label>
            <select
              value={editingQuiz.status || 'draft'}
              onChange={(e) => setEditingQuiz({
                ...editingQuiz,
                status: e.target.value
              })}
              className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white 
                focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-700 p-4 space-y-2">
        <button 
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors font-medium"
          onClick={()=>onUpdateQuizMeta(editingQuiz)}
        >
          Save Changes
        </button>
        <button 
          className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors font-medium"
          onClick={()=> navigate('/teacher/quizzes/result')}
        >
          View Results
        </button>
      </div>
    </div>
  );
}