import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

const activeExams = [
  "Calculus II Midterm",
  "Physics: Kinematics Quiz",
  "Chemistry: Stoichiometry",
  "Biology: Cell Division",
  "World History Unit 4",
  "Linear Algebra Final Review",
  "Data Structures: Trees",
  "Algorithms: Sorting",
  "Discrete Math: Proofs",
  "Software Engineering Capstone",
  "Statistics Exam",
  "Literature Final",
].map((quizTitle, index) => ({
  id: index + 1,
  quizTitle,
  dueDate: new Date(Date.now() + (index + 1) * 60 * 60 * 1000).toISOString(),
  accessibility: index === 0 ? "restricted" : "anyone",
  assignedCount: index === 0 ? 30 : 20,
  submittedCount: index === 0 ? 28 : 10,
}));

beforeEach(() => {
  vi.spyOn(dashboardApi, "getActiveExams").mockImplementation(
    ({ page = 1 } = {}) => {
      const pageSize = 5;
      return Promise.resolve({
        items: activeExams.slice((page - 1) * pageSize, page * pageSize),
        total: activeExams.length,
        page,
        pageSize,
        totalPages: 3,
      });
    },
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ActiveExamsList", () => {
  it("renders rows with title, due date, and flat submission counts", async () => {
    renderList();

    expect(
      screen.getByRole("heading", { name: "Active exams" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Calculus II Midterm")).toBeInTheDocument();
    // One due-date line per row — 5 rows at pageSize 5.
    expect(screen.getAllByText(/^Due /)).toHaveLength(5);
    expect(screen.getByText("28 / 30")).toBeInTheDocument();
    expect(screen.getAllByText("10")).toHaveLength(4);
    expect(screen.queryByRole("progressbar")).toBeNull();
    // 12 backend results at 5/page -> 3 pages.
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
    dashboardApi.getActiveExams.mockResolvedValue({
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
