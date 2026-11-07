import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatCards } from "../features/dashboard/components/StatCards";
import { dashboardApi } from "../features/dashboard/api/dashboard.api";

const renderCards = () =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <StatCards />
    </QueryClientProvider>,
  );

beforeEach(() => {
  vi.spyOn(dashboardApi, "getStats").mockResolvedValue({
    activeExams: 12,
    totalStudents: 87,
    averageScore: 78.2,
    drafts: 4,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("StatCards", () => {
  it("shows the loading state while stats are in flight", () => {
    renderCards();
    expect(
      screen.getByRole("status", { name: "Loading stats" }),
    ).toBeInTheDocument();
  });

  it("renders the four stat cards with values from the stats query", async () => {
    renderCards();

    expect(await screen.findByText("Active exams")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("87")).toBeInTheDocument();
    expect(screen.getByText("78.2%")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("shows an error state when the stats query fails", async () => {
    dashboardApi.getStats.mockRejectedValueOnce(new Error("stats down"));
    renderCards();

    expect(
      await screen.findByText("Failed to load dashboard stats"),
    ).toBeInTheDocument();
  });
});
