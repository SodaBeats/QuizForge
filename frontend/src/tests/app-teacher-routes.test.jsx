import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../app/providers/AuthProvider";
import { AppRoutes } from "../app/router.jsx";

// The route table is what changed in this phase — probe the two teacher-home
// routes with lightweight stand-ins so the test doesn't drag every page's
// full dependency tree into jsdom.
vi.mock("../features/dashboard/pages/DashboardPage", () => ({
  DashboardPage: () => <div>Dashboard page</div>,
}));
vi.mock("../features/quizzes/pages/QuizMakerPage", () => ({
  QuizMakerPage: () => <div>Exam workstation page</div>,
}));

const renderAt = (path) =>
  render(
    <AuthContext.Provider
      value={{ token: "token", userInfo: { role: "teacher" }, logout: vi.fn() }}
    >
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AuthContext.Provider>,
  );

describe("router — teacher home routes", () => {
  it("renders the dashboard at /teacher (teacher home)", () => {
    renderAt("/teacher");
    expect(screen.getByText("Dashboard page")).toBeInTheDocument();
    expect(screen.queryByText("Exam workstation page")).toBeNull();
  });

  it("renders the exam workstation at /teacher/exam-workstation", () => {
    renderAt("/teacher/exam-workstation");
    expect(screen.getByText("Exam workstation page")).toBeInTheDocument();
    expect(screen.queryByText("Dashboard page")).toBeNull();
  });
});
