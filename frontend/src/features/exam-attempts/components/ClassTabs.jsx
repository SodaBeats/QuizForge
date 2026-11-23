/* Horizontal attempt-tab strip: class tabs (or All attempts), followed by
    Needs manual grading. Active tabs get an accent underline. */

export function ClassTabs({
  classes,
  activeTab,
  onChange,
  needsReviewCount = 0,
}) {
  const tabs = [
    ...(classes?.length
      ? classes.map((cls) => ({ id: cls.id, label: cls.name }))
      : [{ id: "all", label: "All attempts" }]),
    {
      id: "needs-review",
      label: `Needs manual grading${needsReviewCount ? ` (${needsReviewCount})` : ""}`,
    },
  ];

  return (
    <div className="flex gap-1 px-2 border-b border-muted/20 overflow-x-auto font-body">
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            aria-pressed={active}
            className={`relative shrink-0 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              active ? "text-accent" : "text-muted hover:text-inkondark"
            }`}
          >
            {tab.label}
            {active && (
              <span className="absolute left-0 bottom-0 w-full h-[2px] bg-accent" />
            )}
          </button>
        );
      })}
    </div>
  );
}
