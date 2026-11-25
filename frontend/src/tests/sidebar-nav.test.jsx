import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MonitorPlay, FileText, Users, LayoutDashboard } from "lucide-react";
import { SidebarNav } from "../components/layout/SidebarNav";

// NavLink reads the location from the router context, so no Routes match is
// needed — just render the nav "at" a path.
const ITEMS = [
  { to: "/teacher", label: "Dashboard", icon: LayoutDashboard, end: true },
  {
    to: "/teacher/exam-workstation",
    label: "Exam Workstation",
    icon: MonitorPlay,
  },
  { to: "/teacher/quizzes", label: "Examinations", icon: FileText },
  { to: "/teacher/classes", label: "Classes", icon: Users },
];

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <SidebarNav items={ITEMS} />
    </MemoryRouter>,
  );

const NAV = [
  { label: "Dashboard", href: "/teacher" },
  { label: "Exam Workstation", href: "/teacher/exam-workstation" },
  { label: "Examinations", href: "/teacher/quizzes" },
  { label: "Classes", href: "/teacher/classes" },
];

// SidebarNav persists its collapsed state in localStorage — clear it so
// tests don't leak the state into each other (setup.js has no storage reset).
beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("SidebarNav", () => {
  it("links to the exam workstation, examinations, and classes", () => {
    renderAt("/teacher");
    const links = screen.getAllByRole("link");
    expect(
      links.map((link) => ({
        label: link.textContent,
        href: link.getAttribute("href"),
      })),
    ).toEqual(NAV);
  });

  it("marks the current section active and the others inactive", () => {
    renderAt("/teacher/quizzes");
    expect(
      screen.getByRole("link", { name: "Examinations" }).className,
    ).toContain("bg-accent");
    expect(screen.getByRole("link", { name: "Classes" }).className).not.toContain(
      "bg-accent",
    );
    expect(
      screen.getByRole("link", { name: "Exam Workstation" }).className,
    ).not.toContain("bg-accent");
  });

  it("marks the exam workstation active on its own route", () => {
    renderAt("/teacher/exam-workstation");
    expect(
      screen.getByRole("link", { name: "Exam Workstation" }).className,
    ).toContain("bg-accent");
  });

  it("marks only the exact dashboard route active", () => {
    renderAt("/teacher/quizzes");
    expect(
      screen.getByRole("link", { name: "Dashboard" }).className,
    ).not.toContain("bg-accent");
  });

  it("marks the dashboard active only on /teacher", () => {
    renderAt("/teacher");
    expect(
      screen.getByRole("link", { name: "Dashboard" }).className,
    ).toContain("bg-accent");
  });

  it("renders one lucide icon per nav item", () => {
    const { container } = renderAt("/teacher");
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(4);
    for (const link of links) {
      expect(link.querySelector("svg")).toBeInTheDocument();
    }
    // Icons are decorative — labels carry the accessible name.
    for (const svg of container.querySelectorAll("svg")) {
      expect(svg).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("starts expanded with a desktop-only collapse toggle", () => {
    renderAt("/teacher");
    const nav = screen.getByRole("navigation", { name: "Sections" });
    expect(nav.className).toContain("lg:w-56");

    const toggle = screen.getByRole("button", {
      name: "Collapse navigation",
    });
    // The toggle lives in a `hidden lg:flex` row — invisible below lg.
    expect(toggle.parentElement.className).toContain("hidden");
    expect(toggle.parentElement.className).toContain("lg:flex");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("collapses to an icon rail, hiding labels visually but keeping them for a11y", () => {
    renderAt("/teacher");
    fireEvent.click(screen.getByRole("button", { name: "Collapse navigation" }));

    const nav = screen.getByRole("navigation", { name: "Sections" });
    expect(nav.className).toContain("lg:w-14");
    expect(nav.className).not.toContain("lg:w-56");

    // Labels stay in the accessibility tree (sr-only), rows center the icon.
    for (const { label } of NAV) {
      const link = screen.getByRole("link", { name: label });
      expect(link.className).toContain("lg:justify-center");
      expect(link.querySelector("span").className).toContain("lg:sr-only");
    }

    const toggle = screen.getByRole("button", { name: "Expand navigation" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps the active highlight after collapsing", () => {
    renderAt("/teacher/classes");
    fireEvent.click(screen.getByRole("button", { name: "Collapse navigation" }));
    expect(
      screen.getByRole("link", { name: "Classes" }).className,
    ).toContain("bg-accent");
    expect(
      screen.getByRole("link", { name: "Examinations" }).className,
    ).not.toContain("bg-accent");
  });

  it("persists the collapsed state across remounts", () => {
    const first = renderAt("/teacher");
    fireEvent.click(screen.getByRole("button", { name: "Collapse navigation" }));
    expect(localStorage.getItem("sidebarNav.collapsed")).toBe("true");
    first.unmount();

    renderAt("/teacher");
    expect(
      screen.getByRole("navigation", { name: "Sections" }).className,
    ).toContain("lg:w-14");
    expect(
      screen.getByRole("button", { name: "Expand navigation" }),
    ).toBeInTheDocument();
  });

  it("persists expanding back", () => {
    const first = renderAt("/teacher");
    fireEvent.click(screen.getByRole("button", { name: "Collapse navigation" }));
    fireEvent.click(screen.getByRole("button", { name: "Expand navigation" }));
    expect(localStorage.getItem("sidebarNav.collapsed")).toBe("false");
    first.unmount();

    renderAt("/teacher");
    expect(
      screen.getByRole("navigation", { name: "Sections" }).className,
    ).toContain("lg:w-56");
  });
});

// `collapsed` forces the rail narrow with no toggle (Classes/Quizzes) — the
// state must come from the prop, not from or to localStorage.
describe("SidebarNav — forced collapsed", () => {
  const renderForced = (path, collapsed) =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <SidebarNav items={ITEMS} collapsed={collapsed} />
      </MemoryRouter>,
    );

  it("renders the icon rail with no toggle, ignoring a stored expanded state", () => {
    localStorage.setItem("sidebarNav.collapsed", "false");
    renderForced("/teacher", true);

    const nav = screen.getByRole("navigation", { name: "Sections" });
    expect(nav.className).toContain("lg:w-14");
    for (const { label } of NAV) {
      const link = screen.getByRole("link", { name: label });
      expect(link.className).toContain("lg:justify-center");
      expect(link.querySelector("span").className).toContain("lg:sr-only");
    }
    expect(
      screen.queryByRole("button", { name: "Collapse navigation" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Expand navigation" }),
    ).toBeNull();
  });

  it("keeps the active highlight", () => {
    renderForced("/teacher/quizzes", true);
    expect(
      screen.getByRole("link", { name: "Examinations" }).className,
    ).toContain("bg-accent");
    expect(
      screen.getByRole("link", { name: "Classes" }).className,
    ).not.toContain("bg-accent");
  });

  it("never writes to localStorage", () => {
    renderForced("/teacher", true);
    expect(localStorage.getItem("sidebarNav.collapsed")).toBeNull();
  });

  it("honors collapsed={false} as forced expanded, still with no toggle", () => {
    localStorage.setItem("sidebarNav.collapsed", "true");
    renderForced("/teacher", false);

    const nav = screen.getByRole("navigation", { name: "Sections" });
    expect(nav.className).toContain("lg:w-56");
    expect(
      screen.queryByRole("button", { name: "Collapse navigation" }),
    ).toBeNull();
    expect(localStorage.getItem("sidebarNav.collapsed")).toBe("true");
  });
});
