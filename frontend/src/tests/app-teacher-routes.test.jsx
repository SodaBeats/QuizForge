// The route table + the isVerified guard for the teacher branches — probe the
// teacher-home routes and /awaiting-verification with lightweight stand-ins
// so the test doesn't drag every page's full dependency tree into jsdom.
// Locks the routing semantics:
// - verified teacher → the page each /teacher branch asks for
// - unverified teacher → the awaiting page (RequireVerified), from any branch
// - Logout on the awaiting page calls logout directly (no confirm dialog)
// - /awaiting-verification sits behind RequireRole role="teacher": other
//   roles go to their own home, logged-out visitors to /login with state.from
//
// These live in this file (not a dedicated suite) because it is the only
// test that already imports AppRoutes — a second AppRoutes-importing file
// pushes lib-env's entry-import over its 5s timeout under parallel load.
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../app/providers/AuthProvider";
import { AppRoutes } from "../app/router.jsx";

vi.mock("../features/dashboard/pages/DashboardPage", () => ({
  DashboardPage: () => <div>Dashboard page</div>,
}));
vi.mock("../features/quizzes/pages/QuizMakerPage", () => ({
  QuizMakerPage: () => <div>Exam workstation page</div>,
}));
vi.mock("../features/student-quiz/pages/StudentTokenPage", () => ({
  StudentTokenPage: () => <div>Student home</div>,
}));
// Mocked so the logged-out assertion can read state.from without dragging
// the real LoginPage (query hooks, forms) into jsdom.
vi.mock("../features/auth/pages/LoginPage", async () => {
  const { useLocation } = await import("react-router-dom");
  return {
    LoginPage: () => (
      <div>
        login page
        <span data-testid="from-path">
          {useLocation().state?.from?.pathname ?? ""}
        </span>
      </div>
    ),
  };
});

const renderAt = (path, auth = {}, logout = vi.fn()) =>
  render(
    <AuthContext.Provider
      value={{
        token: "token",
        userInfo: { role: "teacher", isVerified: true },
        logout,
        ...auth,
      }}
    >
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </AuthContext.Provider>,
  );

const unverifiedTeacher = {
  userInfo: { role: "teacher", isVerified: false },
};

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

describe("RequireVerified — unverified teachers", () => {
  it("lands an unverified teacher on the awaiting page from /teacher", () => {
    renderAt("/teacher", unverifiedTeacher);

    expect(
      screen.getByRole("heading", {
        name: "Awaiting verification, please wait for Admin confirmation",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Dashboard page")).toBeNull();
  });

  it("intercepts other teacher branches too (exam workstation)", () => {
    renderAt("/teacher/exam-workstation", unverifiedTeacher);

    expect(
      screen.getByRole("heading", {
        name: "Awaiting verification, please wait for Admin confirmation",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Exam workstation page")).toBeNull();
  });

  it("offers a Logout button that calls logout directly", () => {
    const logout = vi.fn();
    renderAt("/teacher", unverifiedTeacher, logout);

    fireEvent.click(screen.getByRole("button", { name: "Logout" }));
    expect(logout).toHaveBeenCalledTimes(1);
  });
});

describe("/awaiting-verification route", () => {
  it("sends a teacher who is already verified to the dashboard", () => {
    renderAt("/awaiting-verification");

    expect(screen.getByText("Dashboard page")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Logout" })).toBeNull();
  });

  it("sends a student to the student home, never showing the message", () => {
    renderAt("/awaiting-verification", {
      userInfo: { role: "student" },
    });

    expect(screen.getByText("Student home")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /awaiting verification/i }),
    ).toBeNull();
  });

  it("sends logged-out visitors to /login carrying state.from", () => {
    renderAt("/awaiting-verification", { token: null, userInfo: {} });

    expect(screen.getByText("login page")).toBeInTheDocument();
    expect(screen.getByTestId("from-path")).toHaveTextContent(
      "/awaiting-verification",
    );
  });
});
