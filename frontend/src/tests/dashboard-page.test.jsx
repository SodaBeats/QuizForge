import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../app/providers/AuthProvider";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";

// DashboardPage renders TeacherTopbar (needs router + auth context).
const renderPage = (path = "/teacher") =>
  render(
    <AuthContext.Provider value={{ logout: vi.fn() }}>
      <MemoryRouter initialEntries={[path]}>
        <DashboardPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  );

describe("DashboardPage", () => {
  it("renders the teacher topbar with its logo link", () => {
    renderPage();
    expect(screen.getByRole("link", { name: /Ilmari/ })).toBeInTheDocument();
  });

  it("renders the navigation sidebar with all three sections", () => {
    renderPage();
    const nav = screen.getByRole("navigation", { name: "Sections" });
    const navLinks = within(nav).getAllByRole("link");
    expect(navLinks.map((link) => link.textContent)).toEqual([
      "Exam Workstation",
      "Examinations",
      "Classes",
    ]);
  });

  it("shows the placeholder main content until later phases land", () => {
    renderPage();
    expect(
      screen.getByText(/Stat cards and exam lists/),
    ).toBeInTheDocument();
  });
});
