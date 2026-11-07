import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthContext } from "../app/providers/AuthProvider";
import { ExamAttemptsPage } from "../features/exam-attempts/pages/ExamAttemptsPage";

// getAttempts is the one mocked piece so a single test can simulate a known
// exam with zero submissions; every other test runs against real fixtures.
const attemptsMock = vi.hoisted(() => ({ original: null, fn: null }));

vi.mock("../features/exam-attempts/lib/attempts.js", async (importOriginal) => {
  const actual = await importOriginal();
  attemptsMock.original = actual.getAttempts;
  attemptsMock.fn = vi.fn(actual.getAttempts);
  return { ...actual, getAttempts: attemptsMock.fn };
});

// The page reads quizId from route params, so render it under a real Route.
const renderAt = (quizId) =>
  render(
    <AuthContext.Provider
      value={{ token: "token", userInfo: { role: "teacher" }, logout: vi.fn() }}
    >
      <MemoryRouter initialEntries={[`/teacher/quizzes/${quizId}/attempts`]}>
        <Routes>
          <Route
            path="/teacher/quizzes/:quizId/attempts"
            element={<ExamAttemptsPage />}
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );

beforeEach(() => {
  // Restore the real implementation (the zero-attempts test overrides it).
  attemptsMock.fn.mockImplementation(attemptsMock.original);
});

describe("ExamAttemptsPage", () => {
  it("renders the read-only details panel and the full attempts list", () => {
    renderAt("1");

    // Panel 1 — exam details
    expect(
      screen.getByRole("heading", { level: 1, name: "Midterm: Algebra II" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Restricted")).toBeInTheDocument();
    expect(screen.getByText("Section A, Section B")).toBeInTheDocument();

    // Panel 2 — grouped attempts; counts reflect the active tab (Section A)
    expect(screen.getByText("4 students • 6 attempts")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Section A" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Section B" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByText("Alice Nguyen")).toBeInTheDocument();
    expect(screen.getByText("Farah Haddad")).toBeInTheDocument();
    // Both Section A multi-attempt students (Alice + Farah) render boxes.
    expect(screen.getAllByText("2 attempts")).toHaveLength(2);
    expect(screen.getByText("18/25")).toBeInTheDocument();
  });

  it("renders the not-found state in both panels for an unknown quizId", () => {
    renderAt("999");

    expect(
      screen.getAllByText("No attempt data for this exam"),
    ).toHaveLength(2);
    expect(screen.queryByRole("heading", { level: 1 })).toBeNull();
    expect(screen.queryByText("Alice Nguyen")).toBeNull();
    expect(screen.queryByRole("button", { name: "Section A" })).toBeNull();
  });

  it("filters the list when a class tab is clicked", () => {
    renderAt("1");

    // Section A is active by default.
    expect(screen.getByText("4 students • 6 attempts")).toBeInTheDocument();
    expect(screen.queryByText("Diego Fernandez")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Section B" }));

    expect(screen.getByText("3 students • 4 attempts")).toBeInTheDocument();
    expect(screen.getByText("Diego Fernandez")).toBeInTheDocument();
    expect(screen.queryByText("Alice Nguyen")).toBeNull();
    // Farah belongs to both classes, so she survives the tab switch.
    expect(screen.getByText("Farah Haddad")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Section B" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("shows no class tabs and the full list for an open exam", () => {
    renderAt("2");

    expect(screen.queryByRole("button", { name: "Section A" })).toBeNull();
    expect(screen.getByText("10 students • 14 attempts")).toBeInTheDocument();
    expect(screen.getByText("Grace Kim")).toBeInTheDocument();
  });

  it("shows the no-match state when a search finds no students", () => {
    renderAt("2");

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search students by name" }),
      { target: { value: "zzz" } },
    );

    expect(screen.getByText("No students match your search")).toBeInTheDocument();
    expect(screen.getByText("0 students • 0 attempts")).toBeInTheDocument();
  });

  it("shows the no-submissions state for a known exam with zero attempts", () => {
    attemptsMock.fn.mockImplementation(() => []);
    renderAt("2");

    expect(screen.getByText("No submissions yet")).toBeInTheDocument();
    expect(screen.getByText("0 students • 0 attempts")).toBeInTheDocument();
    expect(
      screen.queryByText("No students match your search"),
    ).toBeNull();
  });
});
