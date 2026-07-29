// QuizMetadata.jsx
import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { toDatetimeLocal } from "../util/toDateTimeLocal";

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
        ? `${userClasses?.find((c) => c.id === editingQuiz.classIds[0])?.name}`
        : `${editingQuiz.classIds.length} classes selected`;
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-left flex items-center justify-between hover:bg-gray-600 transition-colors"
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
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
          {/* "Anyone with the code" option */}
          <label className="flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:bg-gray-600 cursor-pointer border-b border-gray-600">
            <input
              type="checkbox"
              checked={editingQuiz?.classIds?.length === 0}
              onChange={handleClearAll}
              className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 cursor-pointer"
            />
            <span>Anyone with the code</span>
          </label>
          {isFetchingClasses ? (
            <p className="px-3 py-2 text-gray-400 text-sm">
              Loading classes...
            </p>
          ) : classFetchError ? (
            <p className="px-3 py-2 text-red-400 text-xs">
              Unable to load classes.
            </p>
          ) : userClasses?.length ? (
            userClasses.map((cls) => (
              <label
                key={cls.id}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-200 hover:bg-gray-600 cursor-pointer border-b border-gray-600 last:border-b-0"
              >
                <input
                  type="checkbox"
                  checked={editingQuiz.classIds.includes(cls.id)}
                  onChange={() => handleToggleClass(cls.id)}
                  className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 cursor-pointer"
                />
                <span>{cls.name}</span>
              </label>
            ))
          ) : (
            <p className="px-3 py-2 text-gray-400 text-sm">No classes found.</p>
          )}
        </div>
      )}
    </div>
  );
}

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
          value={editingQuiz.quizTitle || ""}
          onChange={(e) =>
            setEditingQuiz((prev) => ({
              ...prev,
              quizTitle: e.target.value,
            }))
          }
          placeholder="Enter Quiz Title..."
          className="w-full bg-transparent text-xl font-semibold text-white mb-2 border-b border-transparent focus:border-blue-500 focus:outline-none transition-all hover:bg-gray-800/50 rounded px-1 -ml-1"
        />

        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>{quiz.questionCount} questions</span>
          <span>•</span>
          <span>Created {quiz.createdAt || "Recently"}</span>
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
            onChange={(e) => {
              setEditingQuiz((prev) => ({
                ...prev,
                description: e.target.value,
              }));
            }}
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
              value={quiz.shareToken?.toUpperCase() || "N/A"}
              readOnly
              className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded text-gray-400 text-sm"
            />
            {quiz.shareToken && (
              <button
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(quiz.shareToken);
                  toast.success("Token copied to clipboard!", {
                    duration: 2000,
                    style: {
                      background: "#10B981",
                      color: "#fff",
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
          {/* Due Date */}
          <div>
            <label className="text-sm font-semibold text-gray-400 block mb-2">
              Due Date
            </label>
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
              className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white 
                focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          {/* Accessibility */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Accessibility
            </label>
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
              value={editingQuiz.maxAttempts || ""}
              onChange={(e) =>
                setEditingQuiz((prev) => ({
                  ...prev,
                  maxAttempts:
                    e.target.value === "" ? null : Number(e.target.value),
                }))
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
              value={editingQuiz.status || "draft"}
              onChange={(e) =>
                setEditingQuiz((prev) => ({
                  ...prev,
                  status: e.target.value,
                }))
              }
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
          onClick={() => onUpdateQuizMeta(editingQuiz)}
        >
          Save Changes
        </button>
        <button
          className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors font-medium"
          onClick={() => navigate(`/teacher/quizzes/${quiz.id}`)}
        >
          View Results
        </button>
      </div>
    </div>
  );
}
