import { TeacherTopbar } from "./TeacherTopbar";
import { PanelTabs } from "../ui/PanelTabs";

// Shared page frame for the standard teacher pages (Phase 4, fixes F15):
// root + topbar + mobile panel switcher + panel container. It replaces the
// copy-pasted strip + visibility blocks in QuizzesPage, ClassesPage and
// QuizResultDashboard. QuizMakerPage keeps its own frame (nested topbar,
// sidebar as a root sibling, `order` tricks) and mounts PanelTabs directly.
//
// Controlled: the page keeps the `mobileTab` state — ClassesPage still hands
// it to ClassStudentsPanel, QuizMakerPage uses it for column sizing. The
// strip hides itself when `tabs` is empty, which is how Quizzes/Classes gate
// it on having a selection (`tabs={selectedQuizId ? TABS : []}`).
//
//   <AppShell
//     tabs={selectedQuizId ? TABS : []}
//     activeTab={mobileTab}
//     onChange={setMobileTab}
//     panels={[
//       { key: "list", visible: !selectedQuizId || mobileTab === "list", children: <Sidebar /> },
//       { key: "details", children: <Details /> },
//     ]}
//   >
//     {extras /* empty states, modals, dialogs — inside the container; Modal/ConfirmDialog portal out */}
//   </AppShell>
//
// Panel entry: `key` + `children`, plus optional `visible` (defaults to
// `activeTab === key`) and `activeClass` (defaults to "flex"). Each panel is
// wrapped exactly like the old hand-rolled markup:
// `${visible ? activeClass : "hidden"} lg:contents`.

const DEFAULT_ROOT_CLASS = "h-screen flex flex-col bg-canvas text-inkondark";
const DEFAULT_CONTAINER_CLASS =
  "flex-1 flex flex-col lg:flex-row overflow-hidden";

export function AppShell({
  tabs = [],
  activeTab,
  onChange,
  panels = [],
  rootClassName = DEFAULT_ROOT_CLASS,
  containerClassName = DEFAULT_CONTAINER_CLASS,
  children,
}) {
  return (
    <div className={rootClassName}>
      <TeacherTopbar />

      {/* Mobile/tablet panel switcher — hidden on desktop (lg) by PanelTabs itself */}
      {tabs.length > 0 && (
        <PanelTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={onChange}
          className="border-b border-muted/20 bg-canvas"
        />
      )}

      <div className={containerClassName}>
        {panels.map(
          ({
            key,
            visible = activeTab === key,
            activeClass = "flex",
            children: panelChildren,
          }) => (
            <div
              key={key}
              className={`${visible ? activeClass : "hidden"} lg:contents`}
            >
              {panelChildren}
            </div>
          ),
        )}
        {children}
      </div>
    </div>
  );
}
