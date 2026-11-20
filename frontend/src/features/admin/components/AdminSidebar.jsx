import { NavLink } from "react-router-dom";

// Admin nav — the teacher DashboardSidebar's markup copied verbatim (this
// repo keeps features self-contained: no cross-feature imports) with the
// admin section list. `end` on /admin keeps the dashboard link from
// staying active on /admin/users and /admin/exams. No topbar by design.
const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/users", label: "User Management" },
  { to: "/admin/exams", label: "Exam Management" },
];

export function AdminSidebar() {
  return (
    <nav
      aria-label="Sections"
      className="shrink-0 bg-specialsurface border-b-2 border-accent/50 lg:border-b-0 lg:border-r-2 lg:w-56 font-body"
    >
      {/* Horizontal strip on mobile, vertical rail from lg up. */}
      <ul className="flex lg:flex-col gap-1 p-2 overflow-x-auto">
        {NAV_ITEMS.map(({ to, label, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
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
