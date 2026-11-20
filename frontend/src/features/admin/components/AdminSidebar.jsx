import { useContext, useState } from "react";
import { NavLink } from "react-router-dom";
import toast from "react-hot-toast";
import { AuthContext } from "../../../app/providers/AuthProvider";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";

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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { logout } = useContext(AuthContext);

  const confirmLogout = async () => {
    setShowLogoutConfirm(false);
    try {
      await logout();
    } catch (error) {
      toast.error(error.message || "Something went wrong while logging out");
    }
  };

  return (
    <nav
      aria-label="Sections"
      className="shrink-0 flex flex-col bg-specialsurface border-b-2 border-accent/50 lg:border-b-0 lg:border-r-2 lg:w-56 lg:h-full font-body"
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

      <div className="mt-auto border-t border-muted/20 p-2 lg:border-t-0">
        <button
          type="button"
          className="w-full rounded-md px-3 py-2 text-left text-sm text-red-400 transition-colors hover:bg-mutedteal"
          onClick={() => setShowLogoutConfirm(true)}
        >
          Log out
        </button>
      </div>

      <ConfirmDialog
        open={showLogoutConfirm}
        title="Log out?"
        message="Are you sure you want to log out?"
        confirmLabel="Log out"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </nav>
  );
}
