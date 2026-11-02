import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../app/providers/AuthProvider";
import { AppShell } from "../components/layout/AppShell.jsx";

// AppShell renders TeacherTopbar, which needs router + auth context.
const renderShell = (props = {}, children = null) =>
  render(
    <AuthContext.Provider value={{ logout: vi.fn() }}>
      <MemoryRouter>
        <AppShell {...props}>{children}</AppShell>
      </MemoryRouter>
    </AuthContext.Provider>,
  );

const TABS = [
  { key: "list", label: "Quizzes" },
  { key: "details", label: "Details" },
];

const shellProps = (overrides = {}) => ({
  tabs: TABS,
  activeTab: "list",
  onChange: vi.fn(),
  ...overrides,
});

describe("AppShell", () => {
  it("renders the topbar and the tab strip", () => {
    renderShell(shellProps());
    expect(screen.getByRole("link")).toBeInTheDocument(); // TeacherTopbar logo
    expect(
      screen.getByRole("button", { name: "Quizzes" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Details" }),
    ).toBeInTheDocument();
  });

  it("calls onChange with the tab key when a tab is clicked", () => {
    const onChange = vi.fn();
    renderShell(shellProps({ onChange }));
    fireEvent.click(screen.getByRole("button", { name: "Details" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("details");
  });

  it("hides the strip when tabs is empty (Quizzes/Classes gate it on selection)", () => {
    renderShell(shellProps({ tabs: [] }));
    expect(screen.queryByRole("button", { name: "Quizzes" })).toBeNull();
    expect(screen.getByRole("link")).toBeInTheDocument(); // topbar still there
  });

  it("shows the active panel and hides inactive ones", () => {
    renderShell(
      shellProps({
        panels: [
          { key: "list", children: <div>Panel one</div> },
          { key: "details", children: <div>Panel two</div> },
        ],
      }),
    );
    const one = screen.getByText("Panel one").parentElement;
    const two = screen.getByText("Panel two").parentElement;
    expect(one.className).toContain("flex");
    expect(one.className).not.toContain("hidden");
    expect(one.className).toContain("lg:contents");
    expect(two.className).toContain("hidden");
    expect(two.className).not.toContain("flex");
  });

  it("honors a visible override regardless of the active tab", () => {
    renderShell(
      shellProps({
        activeTab: "details",
        panels: [
          {
            key: "list",
            visible: true, // e.g. QuizzesPage's "!selectedQuizId || …" clause
            children: <div>Forced visible</div>,
          },
          { key: "questions", children: <div>Inactive</div> },
        ],
      }),
    );
    expect(
      screen.getByText("Forced visible").parentElement.className,
    ).not.toContain("hidden");
    expect(screen.getByText("Inactive").parentElement.className).toContain(
      "hidden",
    );
  });

  it("applies a per-panel activeClass", () => {
    renderShell(
      shellProps({
        activeTab: "details",
        panels: [
          { key: "details", activeClass: "flex h-full", children: <div>Sized</div> },
        ],
      }),
    );
    expect(screen.getByText("Sized").parentElement.className).toContain(
      "flex h-full",
    );
  });

  it("renders extras (children) inside the panel container", () => {
    renderShell(shellProps(), <div>Extra content</div>);
    expect(screen.getByText("Extra content")).toBeInTheDocument();
  });
});
