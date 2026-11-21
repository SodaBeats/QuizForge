// Admin route guard (RequireRole role="admin" + ROLE_HOME/RootRedirector
// wiring). Stand-ins for the pages so the test doesn't drag each page's full
// dependency tree into jsdom — same approach as app-teacher-routes.
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../app/providers/AuthProvider";
import { AppRoutes } from "../app/router.jsx";

vi.mock("../features/admin/pages/AdminDashboardPage", () => ({
  AdminDashboardPage: () => <div>Admin dashboard page</div>,
}));
vi.mock("../features/admin/pages/AdminUsersPage", () => ({
  AdminUsersPage: () => <div>Admin users page</div>,
}));
vi.mock("../features/admin/pages/AdminExamsPage", () => ({
  AdminExamsPage: () => <div>Admin exams page</div>,
}));
vi.mock("../features/dashboard/pages/DashboardPage", () => ({
  DashboardPage: () => <div>Dashboard page</div>,
}));
vi.mock("../features/student-quiz/pages/StudentTokenPage", () => ({
  StudentTokenPage: () => <div>Student home</div>,
}));
vi.mock("../features/auth/pages/LoginPage", () => ({
  LoginPage: () => <div>login page</div>,
}));

const renderAt = (path, { token = "token", role = "admin" } = {}) =>
  render(
    <AuthContext.Provider
      value={{
        token,
        // Teacher mocks carry isVerified: true — /teacher now runs through
        // RequireVerified, which parks unverified accounts on
        // /awaiting-verification instead of the dashboard.
        userInfo: role
          ? { role, ...(role === "teacher" ? { isVerified: true } : {}) }
          : {},
        logout: vi.fn(),
      }}
    >
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AuthContext.Provider>,
  );

describe("router — admin routes", () => {
  it("renders the admin dashboard at /admin for an admin", () => {
    renderAt("/admin");
    expect(screen.getByText("Admin dashboard page")).toBeInTheDocument();
  });

  it("renders user management at /admin/users for an admin", () => {
    renderAt("/admin/users");
    expect(screen.getByText("Admin users page")).toBeInTheDocument();
  });

  it("renders the exam placeholder at /admin/exams for an admin", () => {
    renderAt("/admin/exams");
    expect(screen.getByText("Admin exams page")).toBeInTheDocument();
  });

  it("sends a teacher hitting an admin route to the teacher home (not /login)", () => {
    renderAt("/admin/users", { role: "teacher" });
    expect(screen.getByText("Dashboard page")).toBeInTheDocument();
    expect(screen.queryByText("Admin users page")).not.toBeInTheDocument();
    expect(screen.queryByText("login page")).not.toBeInTheDocument();
  });

  it("sends a student hitting an admin route to the student home", () => {
    renderAt("/admin", { role: "student" });
    expect(screen.getByText("Student home")).toBeInTheDocument();
    expect(screen.queryByText("Admin dashboard page")).not.toBeInTheDocument();
  });

  it("sends a logged-out visitor to /login", () => {
    renderAt("/admin", { token: null, role: null });
    expect(screen.getByText("login page")).toBeInTheDocument();
    expect(screen.queryByText("Admin dashboard page")).not.toBeInTheDocument();
  });
});
