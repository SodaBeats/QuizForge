
// QuizQuestionsList.jsx
import React, { useEffect, useState } from 'react';

const QuestionList = ({ questions, onUpdateQuestion, selectedQuiz }) => {
  const [editingQuestion, setEditingQuestion] = useState(null);

  useEffect(()=>{
    // eslint-disable-next-line
    setEditingQuestion(null);
  },[selectedQuiz]);

  // Handle opening the editor
  const handleEditClick = (question) => {
    setEditingQuestion({ ...question }); // Clone to avoid direct mutation
  };

  // If we are editing, show the Editor View
  if (editingQuestion) {
    return (
      <div className="flex-1 h-full bg-gray-900 flex flex-col p-6 overflow-y-auto">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => setEditingQuestion(null)}
            className="text-gray-400 hover:text-white mr-4 transition-colors"
          >
            ← Back to List
          </button>
          <h3 className="text-xl font-bold text-white">Edit Question</h3>
        </div>

        <div className="space-y-6 max-w-2xl">
          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Question Text</label>
            <textarea
              className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white focus:border-blue-500 outline-none"
              rows="3"
              value={editingQuestion.questionText}
              onChange={(e) => setEditingQuestion({...editingQuestion, questionText: e.target.value})}
            />
          </div>

          {/* Question Type */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Type</label>
            <select 
              className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white"
              value={editingQuestion.questionType}
              onChange={(e) => setEditingQuestion({...editingQuestion, questionType: e.target.value})}
            >
              <option value="multiple-choice">Multiple Choice</option>
              <option value="true-false">True / False</option>
            </select>
          </div>

          {/* Options A-D (Only if Multiple Choice) */}
          {editingQuestion.questionType === 'multiple-choice' && (
            <div className="grid grid-cols-2 gap-4">
              {['A', 'B', 'C', 'D'].map((letter) => (
                <div key={letter}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Option {letter}</label>
                  <input
                    type="text"
                    className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white focus:border-blue-400 outline-none"
                    value={editingQuestion[`option${letter}`] || ''}
                    onChange={(e) => setEditingQuestion({...editingQuestion, [`option${letter}`]: e.target.value})}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Correct Answer */}
          {editingQuestion.questionType === 'multiple-choice' ? (
            <>
              <label className="block text-sm font-medium mb-1">Correct Answer</label>
              <select
                value={editingQuestion.correctAnswer}
                onChange={(e) => setEditingQuestion({...editingQuestion, correctAnswer: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
              >
                <option value="">Select correct answer...</option>
                <option value="a">A</option>
                <option value="b">B</option>
                <option value="c">C</option>
                <option value="d">D</option>
              </select>
            </>
          ) : (
            <>
              <label className="block text-sm font-medium mb-1">Correct Answer</label>
              <select
                value={editingQuestion.correctAnswer}
                onChange={(e) => setEditingQuestion({...editingQuestion, correctAnswer: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
              >
                <option value="">Select correct answer...</option>
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            </>
          )}
          <button 
            onClick={() => onUpdateQuestion(selectedQuiz.id, editingQuestion)}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded transition-all mt-4"
          >
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  // --- List View
  return (
    <div className="flex-1 h-full bg-gray-900 flex flex-col">
      <div className="border-b border-gray-700 p-4">
        <h3 className="text-lg font-semibold text-white">Questions</h3>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {questions?.length > 0 ? (
          <div className="space-y-2">
            {questions.map((question, index) => (
              <div
                key={question.id}
                onClick={() => handleEditClick(question)} // TRIGGER THE EDIT MODE
                className="p-3 bg-gray-800 rounded border border-gray-700 hover:border-blue-500 cursor-pointer transition-all group"
              >
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-300">
                    <span className="font-semibold text-blue-400">Q{index + 1}:</span> {question.questionText}
                  </div>
                  <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">Edit →</span>
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
};

export default QuestionList;