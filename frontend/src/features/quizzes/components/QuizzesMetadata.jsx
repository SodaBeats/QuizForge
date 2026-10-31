// QuizMetadata.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { toDateTimeLocal } from "../../../util/toDateTimeLocal";
import { ClassAccessDropdown } from "./ClassAccessDropdown";

const inputClass =
  "w-full bg-darkslate rounded-md p-2.5 text-sm text-inkondark placeholder:text-muted border border-muted/30 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all font-body";
const labelClass = "text-sm font-semibold text-inkondark block mb-2 font-body";

export function QuizzesMetadata({
  quiz,
  onUpdateQuizMeta,
  userClasses,
  isFetchingClasses,
  classFetchError,
}) {
  const [editingQuiz, setEditingQuiz] = useState({ ...quiz });
  const navigate = useNavigate();

  if (!quiz) {
    return (
      <div className="flex items-center justify-center h-full text-muted text-sm font-body w-full p-3">
        <div className="w-full h-full rounded-lg bg-surface flex items-center justify-center border border-accent">
          Select a quiz to view details
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 h-full w-full flex flex-col font-body p-3">
      <div className="flex-1 flex flex-col rounded-lg bg-surface overflow-hidden border border-accent">
        {/* Header */}
        <div className="p-4 bg-specialsurface border-b border-muted/20">
          <input
            type="text"
            name="quizTitle"
            value={editingQuiz.quizTitle || ""}
            onChange={(e) =>
              setEditingQuiz((prev) => ({
                ...prev,
                quizTitle: e.target.value,
              }))
            }
            placeholder="Enter quiz title..."
            className="w-full bg-transparent text-lg sm:text-xl font-display font-bold text-inkondark mb-2 border-b border-transparent focus:border-accent focus:outline-none transition-all hover:bg-muted/10 rounded px-1 -ml-1"
          />

          <div className="flex items-center gap-3 text-xs sm:text-sm text-muted">
            <span>{quiz.questionCount} questions</span>
            <span>•</span>
            <span>Created {quiz.createdAt || "Recently"}</span>
          </div>
        </div>

        {/* Metadata Content */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={editingQuiz.description}
              onChange={(e) => {
                setEditingQuiz((prev) => ({
                  ...prev,
                  description: e.target.value,
                }));
              }}
              className={`${inputClass} resize-none`}
              rows="3"
              placeholder="Enter quiz description"
            />
          </div>

          {/* Share Token */}
          <div>
            <label className={labelClass}>Share token</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={quiz.shareToken?.toUpperCase() || "N/A"}
                readOnly
                className="flex-1 px-3 py-2 rounded-md text-muted text-sm min-w-0 bg-darkslate"
              />
              {quiz.shareToken && (
                <button
                  className="px-3 py-2 rounded-md text-sm font-display font-bold bg-accept text-inkondark hover:bg-green-600 transition-all flex-shrink-0 hover:-translate-y-0.5 active:translate-y-0.5"
                  onClick={() => {
                    navigator.clipboard.writeText(quiz.shareToken);
                    toast.success("Token copied to clipboard!", {
                      duration: 2000,
                      style: {
                        background: "#10B981",
                        color: "var(--inkondark)",
                      },
                    });
                  }}
                >
                  Copy
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Due Date */}
            <div>
              <label className={labelClass}>Due date</label>
              <input
                type="datetime-local"
                name="dueDate"
                value={toDateTimeLocal(editingQuiz.dueDate).slice(0, 16)}
                onChange={(e) =>
                  setEditingQuiz((prev) => ({
                    ...prev,
                    dueDate: e.target.value || null,
                  }))
                }
                className={inputClass}
              />
            </div>

            {/* Accessibility */}
            <div>
              <label className={labelClass}>Who can access</label>
              <ClassAccessDropdown
                editingQuiz={editingQuiz}
                setEditingQuiz={setEditingQuiz}
                userClasses={userClasses}
                isFetchingClasses={isFetchingClasses}
                classFetchError={classFetchError}
              />
            </div>
          </div>

          {/* Status and Max Attempts - Side by Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Max Attempts */}
            <div>
              <label className={labelClass}>Max attempts</label>
              <input
                type="number"
                name="maxAttempts"
                min="1"
                placeholder="e.g. 3"
                value={editingQuiz.maxAttempts || ""}
                onChange={(e) =>
                  setEditingQuiz((prev) => ({
                    ...prev,
                    maxAttempts:
                      e.target.value === "" ? null : Number(e.target.value),
                  }))
                }
                className={inputClass}
              />
            </div>

            {/* Status */}
            <div>
              <label className={labelClass}>Status</label>
              <select
                value={editingQuiz.status || "draft"}
                onChange={(e) =>
                  setEditingQuiz((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
                className={inputClass}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 space-y-2">
          <button
            className="btn-primary w-full py-2.5 transition-all text-sm hover:bg-green-600 hover:-translate-y-0.5 active:translate-y-0.5"
            onClick={() => onUpdateQuizMeta(editingQuiz)}
          >
            Save changes
          </button>
          <button
            className="btn-secondary w-full py-2.5 font-display font-bold text-sm"
            onClick={() => navigate(`/teacher/quizzes/${quiz.id}`)}
          >
            View results
          </button>
        </div>
      </div>
    </div>
  );
}
