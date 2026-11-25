import { MonitorPlay, FileText, Users, LayoutDashboard } from "lucide-react";

// The teacher section nav — one source of truth for the three items
// SidebarNav shows on the dashboard, /teacher/quizzes and /teacher/classes,
// so the lists can't drift apart. Data only (no JSX): route, label, lucide
// icon per item.
// The exam workstation is the former teacher home (/teacher) — the dashboard
// owns /teacher now, so the path moved here and in ForgeQuizAction.
export const TEACHER_NAV_ITEMS = [
  {
    to: "/teacher",
    label: "Dashboard",
    icon: LayoutDashboard,
    title: "Dashboard",
    end: true,
  },
  {
    to: "/teacher/exam-workstation",
    label: "Exam Workstation",
    icon: MonitorPlay,
    title: "Exam Workstation",
  },
  {
    to: "/teacher/quizzes",
    label: "Examinations",
    icon: FileText,
    title: "Examinations",
  },
  { to: "/teacher/classes", label: "Classes", icon: Users, title: "Classes" },
];
