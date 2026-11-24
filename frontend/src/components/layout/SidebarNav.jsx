import { useState } from "react";
import { NavLink } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

// Shared section nav (moved out of features/dashboard and renamed from
// DashboardSidebar): the consumer passes `items` — `[{ to, label, icon, end? }]`
// — so any feature can mount it. Collapsible from lg up: a w-56 rail with
// icon + label, or a w-14 icon rail (labels stay in the a11y tree via
// sr-only). Below lg it keeps the horizontal text strip and the toggle is
// hidden — collapse is desktop-only. The collapsed state persists in
// localStorage under `sidebarNav.collapsed`. Active state comes from NavLink's
// isActive (bg-accent + font-medium), unchanged from the original sidebar.
//
// `collapsed` forces the state for consumers that always want the narrow rail
// (Classes/Quizzes pass it): the toggle is not rendered and localStorage is
// neither read nor written. Omit it for the uncontrolled, persisted default.
const STORAGE_KEY = "sidebarNav.collapsed";

function readCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false; // storage blocked (private mode) — start expanded
  }
}

export function SidebarNav({ items, collapsed: forcedCollapsed }) {
  const isForced = forcedCollapsed !== undefined;
  // Lazy init skips the localStorage read entirely when the state is forced.
  const [storedCollapsed, setStoredCollapsed] = useState(() =>
    isForced ? false : readCollapsed(),
  );
  const collapsed = isForced ? forcedCollapsed : storedCollapsed;

  const toggleCollapsed = () => {
    const next = !storedCollapsed;
    setStoredCollapsed(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // Storage blocked — the state still toggles for this session.
    }
  };

  return (
    <nav
      aria-label="Sections"
      className={`shrink-0 bg-specialsurface font-body ${
        collapsed ? "lg:w-14" : "lg:w-56"
      }`}
    >
      {/* Collapse toggle — desktop only, uncontrolled mode only; mobile keeps
          the plain strip, and a forced `collapsed` renders no toggle at all. */}
      {!isForced && (
        <div
          className={`hidden lg:flex items-center border-b border-muted/20 p-2 ${
            collapsed ? "justify-center" : "justify-end"
          }`}
        >
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
            aria-expanded={!collapsed}
            className="rounded-md p-1.5 text-inkondark transition-colors hover:bg-mutedteal"
          >
            {collapsed ? (
              <PanelLeftOpen size={16} aria-hidden="true" />
            ) : (
              <PanelLeftClose size={16} aria-hidden="true" />
            )}
          </button>
        </div>
      )}

      {/* Horizontal strip on mobile, vertical rail from lg up. */}
      <ul className="flex lg:flex-col gap-1 p-2 overflow-x-auto">
        {items.map(({ to, label, icon: Icon, end, title }) => (
          <li key={to} title={title}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                  collapsed ? "lg:justify-center lg:px-0" : ""
                } ${
                  isActive
                    ? "bg-accent text-inkondark font-medium"
                    : "text-inkondark hover:bg-mutedteal"
                }`
              }
            >
              {Icon ? (
                <Icon size={18} className="shrink-0" aria-hidden="true" />
              ) : null}
              {/* Collapsed: label hidden visually, kept for screen readers. */}
              <span className={collapsed ? "lg:sr-only" : ""}>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
