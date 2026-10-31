// src/features/quizzes/components/ClassAccessDropdown.jsx
import { Dropdown } from "../../../components/ui/Dropdown";

export function ClassAccessDropdown({
  editingQuiz,
  setEditingQuiz,
  userClasses,
  isFetchingClasses,
  classFetchError,
}) {
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
    <Dropdown>
      {({ open: isDropdownOpen, toggle }) => (
        <>
          <button
            onClick={toggle}
            className="w-full bg-darkslate rounded-md p-2.5 text-sm text-inkondark text-left flex items-center justify-between border border-muted/30 hover:bg-darkslate/70 transition-all font-body"
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
            <div className="absolute top-full left-0 right-0 mt-1 bg-specialsurface border border-muted/20 rounded-md z-20 max-h-48 overflow-y-auto">
              <label className="flex items-center gap-2 px-3 py-2 text-sm text-inkondark hover:bg-muted/10 cursor-pointer border-b border-muted/20">
                <input
                  type="checkbox"
                  checked={editingQuiz?.classIds?.length === 0}
                  onChange={handleClearAll}
                  className="h-4 w-4 rounded border-muted/20 bg-surface text-accent focus:ring-accent cursor-pointer"
                />
                <span>Anyone with the code</span>
              </label>
              {isFetchingClasses ? (
                <p className="px-3 py-2 text-muted text-sm">
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
                    className="flex items-center gap-2 px-3 py-2 text-sm text-inkondark hover:bg-muted/10 cursor-pointer border-b border-muted/20 last:border-b-0"
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
                <p className="px-3 py-2 text-muted text-sm">
                  No classes found.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </Dropdown>
  );
}
