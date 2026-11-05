import { NavLink } from "react-router-dom";

// The exam workstation is the former teacher home (/teacher) — the dashboard
// owns /teacher now, so the path moved here and in ForgeQuizAction.
const NAV_ITEMS = [
  { to: "/teacher/exam-workstation", label: "Exam Workstation" },
  { to: "/teacher/quizzes", label: "Examinations" },
  { to: "/teacher/classes", label: "Classes" },
];

export function DashboardSidebar() {
  return (
    <nav
      aria-label="Sections"
      className="shrink-0 bg-specialsurface border-b-2 border-accent/50 lg:border-b-0 lg:border-r-2 lg:w-56 font-body"
    >
      {/* Horizontal strip on mobile, vertical rail from lg up. */}
      <ul className="flex lg:flex-col gap-1 p-2 overflow-x-auto">
        {NAV_ITEMS.map(({ to, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-accent text-inkondark font-medium"
                    : "text-inkondark hover:bg-mutedteal"
                }`
              }
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
