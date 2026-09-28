// QuizQuestionsList.jsx
import React, { useEffect } from "react";

const inputClass =
  "w-full bg-surface rounded-md p-2.5 sm:p-3 text-sm text-ink border border-muted/30 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all font-body";
const labelClass = "block text-sm font-medium text-muted mb-2 font-body";

const QuestionList = ({
  isFetching,
  questions,
  onUpdateQuestion,
  selectedQuiz,
  editingQuestion,
  setEditingQuestion,
}) => {
  useEffect(() => {
    setEditingQuestion(null);
  }, [selectedQuiz, setEditingQuestion]);

  // Handle opening the editor
  const handleEditClick = (question) => {
    setEditingQuestion({ ...question }); // Clone to avoid direct mutation
  };

  if (isFetching) {
    return (
      <div className="flex-1 h-full w-full bg-surface flex items-center justify-center font-body p-3">
        <div className="w-full h-full rounded-lg bg-surface flex items-center justify-center border border-muted/20">
          <div className="flex flex-col items-center gap-3 text-ink">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
            <span className="text-sm">Loading questions...</span>
          </div>
        </div>
      </div>
    );
  }

  // If we are editing, show the Editor View
  if (editingQuestion) {
    return (
      <div className="flex-1 h-full w-full bg-surface flex flex-col p-3 font-body">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');
          .font-display { font-family: 'Baloo 2', sans-serif; }
          .font-body { font-family: 'Inter', sans-serif; }
        `}</style>
        <div className="flex-1 rounded-lg bg-surface border border-muted/20 p-4 sm:p-6 overflow-y-auto">
          <div className="flex items-center mb-6">
            <button
              onClick={() => setEditingQuestion(null)}
              className="text-muted hover:text-ink mr-4 transition-colors"
            >
              ←
            </button>
            <h3 className="text-lg sm:text-xl font-display font-bold text-ink">
              Edit question
            </h3>
          </div>

          <div className="space-y-6 max-w-2xl">
            {/* Question Text */}
            <div>
              <label htmlFor="question-text" className={labelClass}>
                Question text
              </label>
              <textarea
                id="question-text"
                className={`${inputClass} resize-none`}
                rows="3"
                value={editingQuestion.questionText}
                onChange={(e) =>
                  setEditingQuestion({
                    ...editingQuestion,
                    questionText: e.target.value,
                  })
                }
              />
            </div>

            {/* Question Type */}
            <div>
              <label className={labelClass}>Type</label>
              <select
                className={inputClass}
                value={editingQuestion.questionType}
                onChange={(e) =>
                  setEditingQuestion({
                    ...editingQuestion,
                    questionType: e.target.value,
                  })
                }
              >
                <option value="multiple-choice">Multiple choice</option>
                <option value="true-false">True / False</option>
                <option value="short-answer">Short answer</option>
              </select>
            </div>

            {/* Options A-D (Only if Multiple Choice) */}
            {editingQuestion.questionType === "multiple-choice" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {["A", "B", "C", "D"].map((letter) => (
                  <div key={letter}>
                    <label className="block text-xs font-medium text-muted mb-1 font-body">
                      Option {letter}
                    </label>
                    <input
                      type="text"
                      className={inputClass}
                      value={editingQuestion[`option${letter}`] || ""}
                      onChange={(e) =>
                        setEditingQuestion({
                          ...editingQuestion,
                          [`option${letter}`]: e.target.value,
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Correct Answer */}
            {editingQuestion.questionType === "multiple-choice" ? (
              <div>
                <label className={labelClass}>Correct answer</label>
                <select
                  value={editingQuestion.correctAnswer}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      correctAnswer: e.target.value,
                    })
                  }
                  className={inputClass}
                >
                  <option value="">Select correct answer...</option>
                  <option value="a">A</option>
                  <option value="b">B</option>
                  <option value="c">C</option>
                  <option value="d">D</option>
                </select>
              </div>
            ) : editingQuestion.questionType === "true-false" ? (
              <div>
                <label className={labelClass}>Correct answer</label>
                <select
                  value={editingQuestion.correctAnswer}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      correctAnswer: e.target.value,
                    })
                  }
                  className={inputClass}
                >
                  <option value="">Select correct answer...</option>
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              </div>
            ) : (
              <div>
                <label className={labelClass}>Correct answer</label>
                <input
                  type="text"
                  value={editingQuestion.correctAnswer}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      correctAnswer: e.target.value,
                    })
                  }
                  className={inputClass}
                />
              </div>
            )}
            <button
              onClick={() => onUpdateQuestion(selectedQuiz.id, editingQuestion)}
              className="w-full font-display font-bold bg-accent text-canvas py-3 rounded-md transition-all mt-4 hover:-translate-y-0.5 active:translate-y-0.5"
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- List View
  return (
    <div className="flex-1 h-full w-full bg-surface flex flex-col font-body p-3">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Baloo 2', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>
      <div className="flex-1 flex flex-col rounded-lg bg-surface overflow-hidden border border-muted/20">
        <div className="p-4 bg-surface border-b border-muted/20">
          <h3 className="text-base font-display font-semibold text-ink">
            Questions
          </h3>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          {questions?.length > 0 ? (
            <div className="space-y-2">
              {questions.map((question, index) => (
                <div
                  key={question.id}
                  onClick={() => handleEditClick(question)} // TRIGGER THE EDIT MODE
                  className="p-3 rounded-md cursor-pointer transition-all group bg-surface hover:bg-muted/10 border border-muted/20"
                >
                  <div className="flex justify-between items-center gap-3">
                    <div className="text-sm text-ink min-w-0 truncate">
                      <span className="font-semibold text-accent">
                        Q{index + 1}:
                      </span>{" "}
                      {question.questionText}
                    </div>
                    <span className="text-xs text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 hidden sm:inline">
                      Edit →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted text-sm">
              No questions yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionList;
