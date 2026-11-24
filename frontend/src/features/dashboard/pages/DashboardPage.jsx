import { MonitorPlay, FileText, Users } from "lucide-react";
import { TeacherTopbar } from "../../../components/layout/TeacherTopbar";
import { SidebarNav } from "../../../components/layout/SidebarNav";
import { StatCards } from "../components/StatCards";
import { ActiveExamsList } from "../components/ActiveExamsList";
import { ExpiringSoonList } from "../components/ExpiringSoonList";

// The exam workstation is the former teacher home (/teacher) — the dashboard
// owns /teacher now, so the path moved here and in ForgeQuizAction.
const NAV_ITEMS = [
  {
    to: "/teacher/exam-workstation",
    label: "Exam Workstation",
    icon: MonitorPlay,
  },
  { to: "/teacher/quizzes", label: "Examinations", icon: FileText },
  { to: "/teacher/classes", label: "Classes", icon: Users },
];

export function DashboardPage() {
  return (
    <div className="h-dvh min-h-0 flex flex-col bg-canvas text-inkondark">
      <TeacherTopbar />

      <div className="flex-1 min-h-0 min-w-0 flex flex-col lg:flex-row overflow-hidden">
        <SidebarNav items={NAV_ITEMS} />

        <main className="flex-1 min-h-0 min-w-0 overflow-y-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
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
