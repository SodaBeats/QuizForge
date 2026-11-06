import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { configureApiClient } from "../lib/api.js";
import { dashboardApi, submissionRate } from "../features/dashboard/api/dashboard.api.js";

const jsonResponse = (status, body) =>
  new Response(JSON.stringify(body), { status });

describe("dashboard.api", () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    configureApiClient({
      getAccessToken: () => "test-token",
      refresh: async () => null,
      onUnauthorized: () => {},
    });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("fetches dashboard stats and returns the server payload", async () => {
    const stats = {
      activeExams: 2,
      totalStudents: 17,
      averageScore: 82.4,
      drafts: 1,
    };
    fetchMock.mockResolvedValue(jsonResponse(200, stats));

    await expect(dashboardApi.getStats()).resolves.toEqual(stats);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:3000/api/dashboard/stats",
    );
  });

  it("requests a specific active-exam page and returns pagination metadata", async () => {
    const result = {
      items: [
        {
          id: 8,
          quizTitle: "Active exam",
          dueDate: "2026-11-07T10:00:00.000Z",
          assignedCount: 30,
          submittedCount: 19,
        },
      ],
      total: 6,
      page: 2,
      pageSize: 5,
      totalPages: 2,
    };
    fetchMock.mockResolvedValue(jsonResponse(200, result));

    await expect(dashboardApi.getActiveExams({ page: 2 })).resolves.toEqual(
      result,
    );
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:3000/api/dashboard/active-exams?page=2",
    );
  });

  it("requests a specific expiring-exam page", async () => {
    const result = {
      items: [],
      total: 0,
      page: 1,
      pageSize: 5,
      totalPages: 1,
    };
    fetchMock.mockResolvedValue(jsonResponse(200, result));

    await expect(dashboardApi.getExpiringExams()).resolves.toEqual(result);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:3000/api/dashboard/expiring?page=1",
    );
  });

  it("surfaces API errors through the shared client", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(403, { message: "Forbidden action" }),
    );

    await expect(dashboardApi.getStats()).rejects.toMatchObject({
      name: "ApiError",
      status: 403,
      message: "Forbidden action",
    });
  });

  it("computes submission rate as a percent, 0 when unassigned", () => {
    expect(submissionRate({ assignedCount: 30, submittedCount: 28 })).toBe(93);
    expect(submissionRate({ assignedCount: 30, submittedCount: 0 })).toBe(0);
    expect(submissionRate({ assignedCount: 0, submittedCount: 0 })).toBe(0);
  });
});
