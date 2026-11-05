import { TeacherTopbar } from "../../../components/layout/TeacherTopbar";
import { DashboardSidebar } from "../components/DashboardSidebar";

export function DashboardPage() {
  return (
    <div className="h-dvh flex flex-col bg-canvas text-inkondark">
      <TeacherTopbar />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <DashboardSidebar />

        <main className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-6">
          {/* Phase 3 adds the stat-card row here; phases 4–5 the
              paginated exam lists. */}
          <section className="rounded-lg bg-surface border border-muted/20 p-6 text-sm text-muted font-body">
            Stat cards and exam lists arrive in the next phases.
          </section>
        </main>
      </div>
    </div>
  );
}
