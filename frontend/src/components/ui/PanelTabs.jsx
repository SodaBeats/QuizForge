// Shared mobile panel switcher (Phase 1.5). The tab strip was copy-pasted
// 4x (QuizMakerPage, QuizResultDashboard, ClassesPage, QuizzesPage) with an
// identical button style and per-page container classes — the container
// deltas stay with the call site via className. Phase 4 replaces the strips
// (known F4); this ships as a primitive + tests only.
//
//   <PanelTabs
//     tabs={[{ key: "files", label: "Files" }, …]}
//     activeTab={mobileTab}
//     onChange={setMobileTab}
//     className="border-b border-muted/20 bg-canvas"
//   />
export function PanelTabs({
  tabs,
  activeTab,
  onChange,
  className = "",
}) {
  return (
    <div className={`flex lg:hidden font-body ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors relative ${
            activeTab === tab.key
              ? "text-accent"
              : "text-muted hover:text-inkondark"
          }`}
        >
          {tab.label}
          {activeTab === tab.key && (
            <span className="absolute left-0 bottom-0 w-full h-[2px] bg-accent" />
          )}
        </button>
      ))}
    </div>
  );
}
