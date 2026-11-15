/* Content-level tab strip for the attempt detail view — two fixed tabs
   (detail / summary), modeled on ClassTabs: active tab gets the accent
   underline, visible at every viewport. Unlike PanelTabs this is not the
   mobile panel switcher (that one is lg:hidden). */

const DETAIL_TABS = [
  { key: "detail", label: "Detailed attempt view" },
  { key: "summary", label: "Attempt summary" },
];

export function AttemptDetailTabs({ activeTab, onChange }) {
  return (
    <div className="flex gap-1 px-2 border-b border-muted/20 overflow-x-auto shrink-0 font-body">
      {DETAIL_TABS.map((tab) => {
        const active = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
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
