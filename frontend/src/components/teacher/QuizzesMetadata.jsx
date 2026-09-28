// QuizMetadata.jsx
import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { toDatetimeLocal } from "../../util/toDateTimeLocal";

function ClassAccessDropdown({
  editingQuiz,
  setEditingQuiz,
  userClasses,
  isFetchingClasses,
  classFetchError,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleClass = (classId) => {
    setEditingQuiz((prev) => {
      const classesWithAccessIds = prev.classIds;
      const isSelected = classesWithAccessIds.includes(classId);
      const nextIds = isSelected
        ? classesWithAccessIds.filter((id) => id !== classId)
        : [...classesWithAccessIds, classId];
      if (nextIds.length > 0)
        return { ...prev, accessibility: "restricted", classIds: nextIds };
      else return { ...prev, accessibility: "anyone", classIds: nextIds };
    });
  };

  const handleClearAll = () => {
    setEditingQuiz((prev) => ({
      ...prev,
      accessibility: "anyone",
      classIds: [],
    }));
  };

  const displayText =
    editingQuiz.classIds.length === 0
      ? "Anyone with the code"
      : editingQuiz.classIds.length === 1
        ? (userClasses?.find((c) => c.id === editingQuiz.classIds[0])?.name ??
          "1 class selected")
        : `${editingQuiz.classIds.length} classes selected`;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="w-full bg-surface rounded-md p-2.5 text-sm text-ink text-left flex items-center justify-between border border-muted/30 hover:bg-muted/10 transition-all font-body"
      >
        <span className="truncate">{displayText}</span>
        <svg
          className={`w-4 h-4 transition-transform ${
            isDropdownOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </button>
      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-muted/20 rounded-md z-20 max-h-48 overflow-y-auto">
          <label className="flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-muted/10 cursor-pointer border-b border-muted/20">
            <input
              type="checkbox"
              checked={editingQuiz?.classIds?.length === 0}
              onChange={handleClearAll}
              className="h-4 w-4 rounded border-muted/20 bg-surface text-accent focus:ring-accent cursor-pointer"
            />
            <span>Anyone with the code</span>
          </label>
          {isFetchingClasses ? (
            <p className="px-3 py-2 text-muted text-sm">Loading classes...</p>
          ) : classFetchError ? (
            <p className="px-3 py-2 text-red-400 text-xs">
              Unable to load classes.
            </p>
          ) : userClasses?.length ? (
            userClasses.map((cls) => (
              <label
                key={cls.id}
                className="flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-muted/10 cursor-pointer border-b border-muted/20 last:border-b-0"
              >
                <input
                  type="checkbox"
                  checked={editingQuiz.classIds.includes(cls.id)}
                  onChange={() => handleToggleClass(cls.id)}
                  className="h-4 w-4 rounded border-muted/20 bg-surface text-accent focus:ring-accent cursor-pointer"
                />
                <span>{cls.name}</span>
              </label>
            ))
          ) : (
            <p className="px-3 py-2 text-muted text-sm">No classes found.</p>
          )}
        </div>
      )}
    </div>
  );
}

const inputClass =
  "w-full bg-surface rounded-md p-2.5 text-sm text-ink placeholder:text-muted border border-muted/30 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all font-body";
const labelClass = "text-sm font-semibold text-muted block mb-2 font-body";
const primaryBtnClass =
  "w-full px-4 py-2.5 rounded-md transition-all font-display font-bold text-sm bg-accent text-canvas hover:-translate-y-0.5 active:translate-y-0.5";
const secondaryBtnClass =
  "w-full px-4 py-2.5 rounded-md transition-all font-display font-bold text-sm text-ink bg-surface hover:bg-muted/10 border border-muted/30";

export default function QuizzesMetadata({
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
      <div className="flex items-center justify-center h-full text-muted text-sm font-body bg-surface w-full p-3">
        <div className="w-full h-full rounded-lg bg-surface flex items-center justify-center border border-muted/20">
          Select a quiz to view details
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full w-full bg-surface flex flex-col font-body p-3">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Baloo 2', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>

      <div className="flex-1 flex flex-col rounded-lg bg-surface overflow-hidden border border-muted/20">
        {/* Header */}
        <div className="p-4 bg-surface border-b border-muted/20">
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
            className="w-full bg-transparent text-lg sm:text-xl font-display font-bold text-ink mb-2 border-b border-transparent focus:border-accent focus:outline-none transition-all hover:bg-muted/10 rounded px-1 -ml-1"
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
                className="flex-1 px-3 py-2 rounded-md text-muted text-sm min-w-0 bg-surface border border-muted/30"
              />
              {quiz.shareToken && (
                <button
                  className="px-3 py-2 rounded-md text-sm font-display font-bold bg-accent text-canvas transition-all flex-shrink-0 hover:-translate-y-0.5 active:translate-y-0.5"
                  onClick={() => {
                    navigator.clipboard.writeText(quiz.shareToken);
                    toast.success("Token copied to clipboard!", {
                      duration: 2000,
                      style: {
                        background: "#10B981",
                        color: "var(--ink)",
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
                value={toDatetimeLocal(editingQuiz.dueDate).slice(0, 16)}
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
              <label className={labelClass}>Accessibility</label>
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
            className={primaryBtnClass}
            onClick={() => onUpdateQuizMeta(editingQuiz)}
          >
            Save changes
          </button>
          <button
            className={secondaryBtnClass}
            onClick={() => navigate(`/teacher/quizzes/${quiz.id}`)}
          >
            View results
          </button>
        </div>
      </div>
    </div>
  );
}
