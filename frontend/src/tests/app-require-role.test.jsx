// RequireRole behavior (Phase 3 step 3 / plan bullet 2 — the deferred Phase 0
// spec). Locks the redirect semantics this commit intentionally changes:
// - logged out  → /login with state.from = requested location (so login can
//                 return the visitor to the page they wanted)
// - wrong role  → that role's home, NOT /login
// - right role  → children render
//
// The last describe is a deep-link regression: the guard alone was never
// enough — AuthProvider's session check navigates to /login *before* the
// route tree mounts, so it must carry state.from too (manual check found
// this; see the step 3 notes).
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthContext, AuthProvider } from "../app/providers/AuthProvider";
import { RequireRole } from "../app/guards/RequireRole";
import { authApi } from "../features/auth/api/auth.api";

vi.mock("../features/auth/api/auth.api", () => ({
  authApi: {
    refresh: vi.fn(),
    logout: vi.fn(),
    login: vi.fn(),
    signup: vi.fn(),
  },
}));

// Stands in for the login page; renders what state.from carried so the test
// can assert the redirect payload, not just the pathname.
function LoginProbe() {
  const location = useLocation();
  return (
    <div>
      login page
      <span data-testid="from-path">{location.state?.from?.pathname ?? ""}</span>
    </div>
  );
}

function renderGuarded({ initialEntry, token, role }) {
  const authValue = {
    token,
    userInfo: role ? { role } : {},
    loading: false,
  };

  return render(
    <AuthContext.Provider value={authValue}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/login" element={<LoginProbe />} />
          <Route path="/teacher" element={<div>teacher home</div>} />
          <Route path="/student" element={<div>student home</div>} />
          <Route
            path="/teacher/quizzes"
            element={
              <RequireRole role="teacher">
                <div>teacher quizzes</div>
              </RequireRole>
            }
          />
          <Route
            path="/student/quiz/:quizToken"
            element={
              <RequireRole role="student">
                <div>student quiz</div>
              </RequireRole>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("RequireRole", () => {
  it("renders children when the role matches", () => {
    renderGuarded({
      initialEntry: "/teacher/quizzes",
      token: "t",
      role: "teacher",
    });

    expect(screen.getByText("teacher quizzes")).toBeInTheDocument();
  });

  it("redirects logged-out visitors to /login carrying state.from", () => {
    renderGuarded({ initialEntry: "/teacher/quizzes", token: null });

    expect(screen.getByText("login page")).toBeInTheDocument();
    expect(screen.getByTestId("from-path")).toHaveTextContent("/teacher/quizzes");
  });

  it("sends a student hitting a teacher route to the student home (not /login)", () => {
    renderGuarded({
      initialEntry: "/teacher/quizzes",
      token: "t",
      role: "student",
    });

    expect(screen.getByText("student home")).toBeInTheDocument();
    expect(screen.queryByText("login page")).not.toBeInTheDocument();
  });

  it("sends a teacher hitting a student route to the teacher home (not /login)", () => {
    renderGuarded({
      initialEntry: "/student/quiz/TOKEN1",
      token: "t",
      role: "teacher",
    });

    expect(screen.getByText("teacher home")).toBeInTheDocument();
    expect(screen.queryByText("login page")).not.toBeInTheDocument();
  });
});

describe("deep-link while logged out (AuthProvider session check)", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {}); // silences "Silent refresh failed"
    // no refresh cookie → session check rejects, like a logged-out visit
    authApi.refresh.mockRejectedValue(new Error("no session"));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    authApi.refresh.mockReset();
  });

  // Regression (step 3 manual check): the route tree doesn't exist while
  // AuthProvider's session check runs, so RequireRole's state.from never
  // fires on a fresh load — the provider's own redirect must carry it.
  it("reaches /login with state.from, so login returns to the deep-linked page", async () => {
    render(
      <MemoryRouter initialEntries={["/teacher/quizzes"]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginProbe />} />
            <Route
              path="/teacher/quizzes"
              element={<div>teacher quizzes</div>}
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    // AuthProvider shows LoadingScreen until the session check settles
    expect(await screen.findByText("login page")).toBeInTheDocument();
    expect(screen.getByTestId("from-path")).toHaveTextContent(
      "/teacher/quizzes",
    );
  });

  it("does not set state.from when the session check fails on /login itself", async () => {
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginProbe />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    // state.from = /login would bounce a freshly-logged-in user back here
    expect(await screen.findByText("login page")).toBeInTheDocument();
    expect(screen.getByTestId("from-path")).toHaveTextContent("");
  });
});
