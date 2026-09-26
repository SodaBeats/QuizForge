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
    <div className="w-full lg:w-56 flex-shrink-0 flex flex-col bg-surface-900 font-body p-3">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Baloo 2', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
      `}</style>

      <div className="flex-1 flex flex-col rounded-2xl bg-surface-800 overflow-hidden shadow-[6px_6px_14px_rgba(0,0,0,0.4),-4px_-4px_10px_rgba(255,255,255,0.03)]">
        <div className="p-4 bg-surface-700 flex items-center justify-between gap-2">
          <p className="text-xs font-display font-semibold text-ink-500 uppercase tracking-widest">
            Classes
          </p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center rounded-xl px-3 py-1 text-lg font-semibold text-ink-200 transition-all bg-surface-900 hover:bg-surface-700 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.03)] focus:outline-none focus:shadow-[inset_3px_3px_6px_rgba(0,0,0,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.03),0_0_0_3px_rgba(255,148,80,0.35)]"
            aria-label="Create class"
          >
            +
          </button>
        </div>

        <div className="themed-scroll flex-1 overflow-y-auto relative p-2">
          {isFetching ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface-800/95 text-center px-4">
              <div className="w-10 h-10 border-4 border-t-transparent border-brand-400 rounded-full animate-spin" />
              <div className="text-sm text-ink-300">Loading classes...</div>
            </div>
          ) : classes?.length > 0 ? (
            classes.map((cls) => (
              <div
                key={cls.id}
                className={`group flex items-center px-3 py-3 mb-1.5 rounded-xl transition-all ${
                  selectedClassId === cls.id
                    ? "bg-gradient-to-br from-brand-300 via-brand-400 to-brand-600 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_5px_rgba(80,30,5,0.3),4px_4px_10px_rgba(0,0,0,0.35)]"
                    : "bg-surface-900 hover:bg-surface-700 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.4),inset_-3px_-3px_6px_rgba(255,255,255,0.03)]"
                }`}
              >
                <button
                  onClick={() =>
                    onSelectClass(selectedClassId === cls.id ? null : cls.id)
                  }
                  className="flex-1 flex items-center gap-3 text-left"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-display font-semibold flex-shrink-0 ${
                      selectedClassId === cls.id
                        ? "bg-brand-900/25 text-brand-900"
                        : "bg-surface-700 text-brand-300"
                    }`}
                  >
                    {cls.name.slice(0, 2)}
                  </div>
                  <div className="overflow-hidden">
                    <div
                      className={`text-sm font-medium truncate ${
                        selectedClassId === cls.id
                          ? "text-brand-900"
                          : "text-ink-200"
                      }`}
                    >
                      {cls.name}
                    </div>
                    <div
                      className={`text-xs ${
                        selectedClassId === cls.id
                          ? "text-brand-800"
                          : "text-ink-500"
                      }`}
                    >
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
                  className={`ml-2 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all ${
                    selectedClassId === cls.id
                      ? "text-brand-900 hover:text-surface-900"
                      : "text-ink-500 hover:text-red-400"
                  } ${
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
            <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-sm text-ink-600">
              <div className="text-3xl">📚</div>
              <div className="font-display font-medium text-ink-200">
                No classes yet
              </div>
              <div className="text-xs text-ink-600">
                Click the + button to create your first class.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
