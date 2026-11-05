import { TeacherTopbar } from "../../../components/layout/TeacherTopbar";
import { DashboardSidebar } from "../components/DashboardSidebar";
import { StatCards } from "../components/StatCards";
import { ActiveExamsList } from "../components/ActiveExamsList";
import { ExpiringSoonList } from "../components/ExpiringSoonList";

export function DashboardPage() {
  return (
    <div className="h-dvh flex flex-col bg-canvas text-inkondark">
      <TeacherTopbar />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <DashboardSidebar />

        <main className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
          {/* Stat cards, then the two exam lists side by side from xl
              up (stacked below). */}
          <StatCards />
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
            <ActiveExamsList />
            <ExpiringSoonList />
          </div>
        </main>
      </div>
    </div>
  );
}
