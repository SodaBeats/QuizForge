import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ActiveExamsList } from "../features/dashboard/components/ActiveExamsList";
import { dashboardApi } from "../features/dashboard/api/dashboard.api";

const renderList = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ActiveExamsList />
    </QueryClientProvider>,
  );

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ActiveExamsList", () => {
  it("renders rows with title, due date, and submission rate", async () => {
    renderList();

    expect(
      screen.getByRole("heading", { name: "Active exams" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Calculus II Midterm")).toBeInTheDocument();
    // One due-date line per row — 5 rows at pageSize 5.
    expect(screen.getAllByText(/^Due /)).toHaveLength(5);
    // 28 of 30 submitted → 93% on the first row.
    expect(screen.getByText("93%")).toBeInTheDocument();
    // 12 exams at 5/page → 3 pages; page 2's exam is not rendered yet.
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.queryByText("Linear Algebra Final Review")).toBeNull();
  });

  it("pages forward and back through the dataset", async () => {
    renderList();
    await screen.findByText("Calculus II Midterm");

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(
      await screen.findByText("Linear Algebra Final Review"),
    ).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
    expect(screen.queryByText("Calculus II Midterm")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Prev" }));
    expect(
      await screen.findByText("Calculus II Midterm"),
    ).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
  });

  it("shows the empty state and no pager when there are no exams", async () => {
    vi.spyOn(dashboardApi, "getActiveExams").mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 5,
      totalPages: 1,
    });
    renderList();

    expect(await screen.findByText("No active exams")).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Pagination" }),
    ).toBeNull();
  });
});
