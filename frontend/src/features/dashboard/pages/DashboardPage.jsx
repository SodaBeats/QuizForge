import { TeacherTopbar } from "../../../components/layout/TeacherTopbar";
import { DashboardSidebar } from "../components/DashboardSidebar";
import { StatCards } from "../components/StatCards";
import { ActiveExamsList } from "../components/ActiveExamsList";

export function DashboardPage() {
  return (
    <div className="h-dvh flex flex-col bg-canvas text-inkondark">
      <TeacherTopbar />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <DashboardSidebar />

        <main className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
          {/* Phase 3: stat cards; Phase 4: active exams; Phase 5 adds the
              expiring-soon list beside it. */}
          <StatCards />
          <ActiveExamsList />
        </main>
      </div>
    </div>
  );
}
