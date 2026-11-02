import { Dropdown } from "../../../components/ui/Dropdown";

export function ClassAccessibilityDropdown({
  selectedClassIds,
  setForgeQuizData,
  userClasses,
  isFetchingClasses,
  classFetchError,
}) {
  const handleToggleClass = (classId) => {
    setForgeQuizData((prev) => {
      const currentIds = prev.selectedClassIds || [];
      const isSelected = currentIds.includes(classId);
      const nextIds = isSelected
        ? currentIds.filter((id) => id !== classId)
        : [...currentIds, classId];
      return { ...prev, selectedClassIds: nextIds };
    });
  };

  const handleClearAll = () => {
    setForgeQuizData((prev) => ({
      ...prev,
      selectedClassIds: [],
    }));
  };

  const displayText =
    selectedClassIds.length === 0
      ? "Anyone with the code"
      : selectedClassIds.length === 1
        ? `${userClasses?.find((c) => c.id === selectedClassIds[0])?.name}`
        : `${selectedClassIds.length} classes selected`;

  return (
    <Dropdown className="relative font-body">
      {({ open: isDropdownOpen, toggle }) => (
        <>
          <button
            onClick={toggle}
            className="input-well w-full px-3 py-2 text-muted transition text-left flex items-center justify-between"
          >
            <span className="truncate">{displayText}</span>
            <svg
              className={`w-4 h-4 transition-transform text-muted ${
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
            <div className="absolute top-full left-0 right-0 mt-1 rounded-md z-20 max-h-48 overflow-y-auto bg-surface border border-muted/20">
              <label className="flex items-center gap-2 px-3 py-2 text-sm text-inkondark hover:bg-muted/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedClassIds.length === 0}
                  onChange={handleClearAll}
                  className="h-4 w-4 rounded cursor-pointer accent-accent"
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
                    className="flex items-center gap-2 px-3 py-2 text-sm text-inkondark hover:bg-muted/10 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedClassIds.includes(cls.id)}
                      onChange={() => handleToggleClass(cls.id)}
                      className="h-4 w-4 rounded cursor-pointer accent-accent"
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
