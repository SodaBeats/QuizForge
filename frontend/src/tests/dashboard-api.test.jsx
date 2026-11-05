import { describe, it, expect } from "vitest";
import {
  dashboardApi,
  submissionRate,
  MOCK_TOTAL_STUDENTS,
} from "../features/dashboard/api/dashboard.api.js";

const HOUR_MS = 60 * 60 * 1000;

describe("dashboard.api — mock data layer", () => {
  it("derives the stat cards from the dataset", async () => {
    const stats = await dashboardApi.getStats();

    expect(stats.activeExams).toBe(12); // published + not yet due
    expect(stats.drafts).toBe(4);
    expect(stats.totalStudents).toBe(MOCK_TOTAL_STUDENTS);
    // Mean of the 7 exams that have attempts, rounded to 1 decimal.
    expect(stats.averageScore).toBe(78.2);
  });

  it("pages active exams 5 at a time, soonest due first, no drafts", async () => {
    const page1 = await dashboardApi.getActiveExams({ page: 1 });
    expect(page1.total).toBe(12);
    expect(page1.totalPages).toBe(3);
    expect(page1.pageSize).toBe(5);
    expect(page1.items).toHaveLength(5);
    expect(page1.page).toBe(1);

    const dues = page1.items.map((exam) => Date.parse(exam.dueDate));
    expect(dues).toEqual([...dues].sort((a, b) => a - b));
    expect(page1.items.every((exam) => exam.status === "published")).toBe(true);

    const page3 = await dashboardApi.getActiveExams({ page: 3 });
    expect(page3.items).toHaveLength(2);
  });

  it("clamps out-of-range pages into valid ones", async () => {
    const page0 = await dashboardApi.getActiveExams({ page: 0 });
    expect(page0.page).toBe(1);
    expect(page0.items).toHaveLength(5);

    const page99 = await dashboardApi.getActiveExams({ page: 99 });
    expect(page99.page).toBe(3);
    expect(page99.items).toHaveLength(2);
  });

  it("returns only active exams inside the 72h window, soonest first", async () => {
    const now = Date.now();
    const cutoff = now + 72 * HOUR_MS;

    const page1 = await dashboardApi.getExpiringExams();
    const page2 = await dashboardApi.getExpiringExams({ page: 2 });
    const all = [...page1.items, ...page2.items];

    expect(page1.total).toBe(7);
    expect(page1.totalPages).toBe(2);
    expect(all).toHaveLength(7);

    for (const exam of all) {
      const due = Date.parse(exam.dueDate);
      expect(due).toBeGreaterThan(now);
      expect(due).toBeLessThanOrEqual(cutoff);
    }

    const dues = all.map((exam) => Date.parse(exam.dueDate));
    expect(dues).toEqual([...dues].sort((a, b) => a - b));
  });

  it("honours a custom closing window", async () => {
    const page = await dashboardApi.getExpiringExams({ hours: 3 });
    // Only the exam due in ~2h falls inside a 3h window.
    expect(page.total).toBe(1);
    expect(page.items[0].id).toBe(1);
  });

  it("computes submission rate as a percent, 0 when unassigned", () => {
    expect(submissionRate({ assignedCount: 30, submittedCount: 28 })).toBe(93);
    expect(submissionRate({ assignedCount: 30, submittedCount: 0 })).toBe(0);
    expect(submissionRate({ assignedCount: 0, submittedCount: 0 })).toBe(0);
  });
});
