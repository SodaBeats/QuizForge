// src/components/ClassesSidebar.jsx

export default function ClassesSidebar({
  classes,
  selectedClassId,
  onSelectClass,
  setShowCreateModal,
}) {
  return (
    <div className="w-56 flex-shrink-0 border-r border-gray-700 flex flex-col bg-gray-900">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Classes
        </p>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center rounded-md px-3 py-1 text-lg font-semibold text-gray-200 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Create class"
        >
          +
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {classes.map((cls) => (
          <button
            key={cls.id}
            onClick={() =>
              onSelectClass(selectedClassId === cls.id ? null : cls)
            }
            className={`w-full flex items-center gap-3 px-4 py-3 text-left border-l-2 transition-colors
              ${
                selectedClassId === cls.id
                  ? "bg-blue-900 bg-opacity-30 border-blue-500"
                  : "border-transparent hover:bg-gray-800"
              }`}
          >
            <div className="w-8 h-8 rounded-md bg-blue-900 bg-opacity-50 flex items-center justify-center text-blue-300 text-xs font-semibold flex-shrink-0">
              {cls.name.slice(0, 2)}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm text-gray-100 font-medium truncate">
                {cls.name}
              </div>
              <div className="text-xs text-gray-500">
                {cls.students.length} students
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
