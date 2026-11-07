import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext } from "../app/providers/AuthProvider";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { dashboardApi } from "../features/dashboard/api/dashboard.api.js";

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

beforeEach(() => {
  vi.spyOn(dashboardApi, "getStats").mockResolvedValue({
    activeExams: 12,
    totalStudents: 87,
    averageScore: 78.2,
    drafts: 4,
  });
  vi.spyOn(dashboardApi, "getActiveExams").mockResolvedValue({
    items: [],
    total: 0,
    page: 1,
    pageSize: 5,
    totalPages: 1,
  });
  vi.spyOn(dashboardApi, "getExpiringExams").mockResolvedValue({
    items: [],
    total: 0,
    page: 1,
    pageSize: 5,
    totalPages: 1,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

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
    // Stats resolve and both list panels render.
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
