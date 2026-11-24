import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ForgeQuizAction } from "../features/quizzes/components/ForgeQuizAction";
import { QuizzesSidebar } from "../features/quizzes/components/QuizzesSideBar";

// Both components keyed off the old /teacher path (the dashboard owns it now)
// — this guards the move to /teacher/exam-workstation.

const queryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

function LocationProbe() {
  const location = useLocation();
  return (
    <>
      <span data-testid="path">{location.pathname}</span>
      <span data-testid="state">{JSON.stringify(location.state ?? {})}</span>
    </>
  );
}

const SIDEBAR_PROPS = {
  isFetching: false,
  isError: false,
  quizzes: [{ id: 1, quizTitle: "Sample quiz", questionCount: 3 }],
  setSelectedQuizId: vi.fn(),
  selectedQuizId: null,
  onDeleteQuiz: vi.fn(),
};

describe("ForgeQuizAction — pathname gate", () => {
  const renderAt = (path) =>
    render(
      <QueryClientProvider client={queryClient()}>
        <MemoryRouter initialEntries={[path]}>
          <ForgeQuizAction selectedFile={null} setQuizMetadata={vi.fn()} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

  it("shows the forge button on the exam workstation route", () => {
    renderAt("/teacher/exam-workstation");
    expect(
      screen.getByRole("button", { name: "Forge quiz" }),
    ).toBeInTheDocument();
  });

  it("hides it everywhere else (including the new /teacher dashboard)", () => {
    renderAt("/teacher");
    expect(
      screen.queryByRole("button", { name: "Forge quiz" }),
    ).toBeNull();
  });
});

describe("QuizzesSidebar — create-quiz navigation", () => {
  it("sends Create new quiz to the exam workstation with the open-modal state", () => {
    render(
      <QueryClientProvider client={queryClient()}>
        <MemoryRouter initialEntries={["/teacher/quizzes"]}>
          <Routes>
            <Route
              path="*"
              element={
                <>
                  <QuizzesSidebar {...SIDEBAR_PROPS} />
                  <LocationProbe />
                </>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "+ Create new quiz" }));

    expect(screen.getByTestId("path").textContent).toBe(
      "/teacher/exam-workstation",
    );
    expect(screen.getByTestId("state").textContent).toBe(
      JSON.stringify({ openForgeQuizModal: true }),
    );
  });
});

describe("QuizzesSidebar — pagination controls", () => {
  const renderSidebar = (props) =>
    render(
      <QueryClientProvider client={queryClient()}>
        <MemoryRouter initialEntries={["/teacher/quizzes"]}>
          <QuizzesSidebar {...SIDEBAR_PROPS} {...props} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

  it("stays hidden while everything fits on one page", () => {
    renderSidebar({ page: 0, totalQuizzes: 5 });

    expect(screen.queryByTitle("Next page")).toBeNull();
    expect(screen.queryByTitle("Previous page")).toBeNull();
  });

  it("enables Next, disables Prev on page 1, and fires onNextPage", () => {
    const onNextPage = vi.fn();
    renderSidebar({
      page: 0,
      totalQuizzes: 12,
      quizzes: SIDEBAR_PROPS.quizzes,
      onNextPage,
    });

    expect(screen.getByText("Page 1")).toBeInTheDocument();
    expect(screen.getByTitle("Previous page")).toBeDisabled();
    expect(screen.getByTitle("Next page")).toBeEnabled();

    fireEvent.click(screen.getByTitle("Next page"));
    expect(onNextPage).toHaveBeenCalledTimes(1);
  });

  it("keeps Prev reachable and disables Next when stranded on a later page", () => {
    const onPrevPage = vi.fn();
    renderSidebar({
      page: 2,
      totalQuizzes: 10, // both remaining items on page 3 were deleted
      quizzes: [],
      onPrevPage,
    });

    expect(screen.getByText("Page 3")).toBeInTheDocument();
    expect(screen.getByTitle("Previous page")).toBeEnabled();
    expect(screen.getByTitle("Next page")).toBeDisabled();

    fireEvent.click(screen.getByTitle("Previous page"));
    expect(onPrevPage).toHaveBeenCalledTimes(1);
  });
});
