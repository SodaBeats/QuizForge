// src/components/ClassesSidebar.jsx

export default function ClassesSidebar({
  classes = [],
  isFetching,
  selectedClassId,
  onSelectClass,
  setShowCreateModal,
  onDeleteClass,
  deletingIds = [],
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

      <div className="flex-1 overflow-y-auto relative">
        {isFetching ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900/90 text-center px-4">
            <div className="w-10 h-10 border-4 border-t-transparent border-white rounded-full animate-spin" />
            <div className="text-sm text-gray-200">Loading classes...</div>
          </div>
        ) : classes?.length > 0 ? (
          classes.map((cls) => (
            <div
              key={cls.id}
              className="group flex items-center px-4 py-3 hover:bg-gray-800 transition-colors border-l-2"
              style={{
                borderLeftColor:
                  selectedClassId === cls.id ? "#3b82f6" : "transparent",
              }}
            >
              <button
                onClick={() =>
                  onSelectClass(selectedClassId === cls.id ? null : cls.id)
                }
                className="flex-1 flex items-center gap-3 text-left"
              >
                <div className="w-8 h-8 rounded-md bg-blue-900 bg-opacity-50 flex items-center justify-center text-blue-300 text-xs font-semibold flex-shrink-0">
                  {cls.name.slice(0, 2)}
                </div>
                <div className="overflow-hidden">
                  <div className="text-sm text-gray-100 font-medium truncate">
                    {cls.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {cls.students?.length ?? 0} students
                  </div>
                </div>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteClass(cls);
                }}
                disabled={deletingIds.includes(cls.id)}
                className={`ml-2 text-gray-500 hover:text-red-400 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all ${
                  deletingIds.includes(cls.id)
                    ? "opacity-100 cursor-not-allowed text-red-400"
                    : ""
                }`}
                aria-label="Delete class"
              >
                {deletingIds.includes(cls.id) ? (
                  <div className="w-4 h-4 border-2 border-t-transparent border-red-400 rounded-full animate-spin" />
                ) : (
                  "×"
                )}
              </button>
            </div>
          ))
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-sm text-gray-500">
            <div className="text-3xl">📚</div>
            <div className="font-medium text-gray-100">No classes yet</div>
            <div className="text-xs text-gray-500">
              Click the + button to create your first class.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
