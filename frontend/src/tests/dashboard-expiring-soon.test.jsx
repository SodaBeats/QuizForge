import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ExpiringSoonList } from "../features/dashboard/components/ExpiringSoonList";
import { dashboardApi } from "../features/dashboard/api/dashboard.api";

const renderList = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ExpiringSoonList />
    </QueryClientProvider>,
  );

const expiringExams = [
  "Calculus II Midterm",
  "Physics: Kinematics Quiz",
  "Chemistry: Stoichiometry",
  "Biology: Cell Division",
  "World History Unit 4",
  "English Literature Essay Test",
  "Programming Fundamentals",
].map((quizTitle, index) => ({
  id: index + 1,
  quizTitle,
  dueDate: new Date(Date.now() + (index + 2) * 60 * 60 * 1000).toISOString(),
}));

beforeEach(() => {
  vi.spyOn(dashboardApi, "getExpiringExams").mockImplementation(
    ({ page = 1 } = {}) => {
      const pageSize = 5;
      return Promise.resolve({
        items: expiringExams.slice((page - 1) * pageSize, page * pageSize),
        total: expiringExams.length,
        page,
        pageSize,
        totalPages: 2,
      });
    },
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ExpiringSoonList", () => {
  it("shows only the 72h window — 5 of 7 on page 1 of 2", async () => {
    renderList();

    expect(
      screen.getByRole("heading", { name: "Expiring soon" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Calculus II Midterm")).toBeInTheDocument();

    // title / due date / time-left columns, 5 rows at pageSize 5
    expect(screen.getAllByText(/^Due /)).toHaveLength(5);
    expect(screen.getAllByText(/left$/)).toHaveLength(5);
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();

    // Outside the window (due in 4 days) and drafts never appear here.
    expect(screen.queryByText("Linear Algebra Final Review")).toBeNull();
    expect(screen.queryByText("Geography Draft")).toBeNull();
  });

  it("pages through to the remaining exams", async () => {
    renderList();
    await screen.findByText("Calculus II Midterm");

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(
      await screen.findByText("Programming Fundamentals"),
    ).toBeInTheDocument();
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
    expect(screen.getAllByText(/left$/)).toHaveLength(2);
    expect(screen.queryByText("Calculus II Midterm")).toBeNull();
  });

  it("shows the empty state when nothing is closing in 72h", async () => {
    dashboardApi.getExpiringExams.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 5,
      totalPages: 1,
    });
    renderList();

    expect(
      await screen.findByText("No exams expiring soon"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Pagination" }),
    ).toBeNull();
  });
});
