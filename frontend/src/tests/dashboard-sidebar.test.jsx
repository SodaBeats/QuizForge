import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { DashboardSidebar } from "../features/dashboard/components/DashboardSidebar";

// NavLink reads the location from the router context, so no Routes match is
// needed — just render the sidebar "at" a path.
const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <DashboardSidebar />
    </MemoryRouter>,
  );

const NAV = [
  { label: "Exam Workstation", href: "/teacher/exam-workstation" },
  { label: "Examinations", href: "/teacher/quizzes" },
  { label: "Classes", href: "/teacher/classes" },
];

describe("DashboardSidebar", () => {
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
});
