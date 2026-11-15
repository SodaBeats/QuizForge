/* Horizontal class-tab strip for restricted exams — one tab per class with
   access, label = class name, active tab gets the accent underline. Unlike
   PanelTabs this is content-level (visible at every viewport), not the
   mobile panel switcher. Returns null for open exams (no classes). */

export function ClassTabs({ classes, activeClassId, onChange }) {
  if (!classes?.length) return null;

  return (
    <div className="flex gap-1 px-2 border-b border-muted/20 overflow-x-auto font-body">
      {classes.map((cls) => {
        const active = cls.id === activeClassId;
        return (
          <button
            key={cls.id}
            onClick={() => onChange(cls.id)}
            aria-pressed={active}
            className={`relative shrink-0 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              active ? "text-accent" : "text-muted hover:text-inkondark"
            }`}
          >
            {cls.name}
            {active && (
              <span className="absolute left-0 bottom-0 w-full h-[2px] bg-accent" />
            )}
          </button>
        );
      })}
    </div>
  );
}
