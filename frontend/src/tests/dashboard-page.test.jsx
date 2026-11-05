import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext } from "../app/providers/AuthProvider";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";

// DashboardPage renders TeacherTopbar (needs router + auth context) and the
// stats query (needs a QueryClient).
const renderPage = (path = "/teacher") =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <AuthContext.Provider value={{ logout: vi.fn() }}>
        <MemoryRouter initialEntries={[path]}>
          <DashboardPage />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
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

  it("renders the stat-card row and both exam panels", async () => {
    renderPage();
    // Stats resolved (average score across the mock exams) …
    expect(await screen.findByText("78.2%")).toBeInTheDocument();
    // … and the two list panels sit below them.
    expect(
      screen.getByRole("heading", { name: "Active exams" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Expiring soon" }),
    ).toBeInTheDocument();
  });
});
