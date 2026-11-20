// Contract lock for the mocked admin network boundary (admin.api.js with
// USE_MOCKS on). These assert the exact response shapes the backend session
// must also produce, so flipping USE_MOCKS to false is a drop-in swap.
import { describe, it, expect, beforeEach } from "vitest";
import { adminApi, USE_MOCKS } from "../features/admin/api/admin.api";
import { resetAdminMocks } from "../features/admin/api/adminMockData";

describe("admin API — mocked network boundary", () => {
  beforeEach(() => {
    resetAdminMocks();
  });

  it("runs against mocks while the backend /admin routes are pending", () => {
    expect(USE_MOCKS).toBe(true);
  });

  it("GET /admin/stats returns exactly the four counters", async () => {
    const stats = await adminApi.getStats();

    expect(Object.keys(stats).sort()).toEqual([
      "exams",
      "pendingTeachers",
      "students",
      "teachers",
    ]);
    // Seed: teachers 11–13 are unverified + not suspended; 14 is suspended.
    expect(stats.pendingTeachers).toBe(3);
  });

  it("GET /admin/users paginates as { data, total } and filters by role", async () => {
    const res = await adminApi.getUsers({ role: "teacher", page: 1, limit: 5 });

    expect(Object.keys(res).sort()).toEqual(["data", "total"]);
    expect(res.data.length).toBeLessThanOrEqual(5);
    expect(res.data.every((u) => u.role === "teacher")).toBe(true);
    expect(res.total).toBe(8);
    // The user object shape (and never a password field).
    expect(Object.keys(res.data[0]).sort()).toEqual([
      "created_at",
      "email",
      "first_name",
      "id",
      "is_verified",
      "last_name",
      "role",
      "suspended_at",
    ]);
  });

  it("role=teacher&verified=false returns only unverified, non-suspended teachers", async () => {
    const res = await adminApi.getUsers({
      role: "teacher",
      verified: false,
      limit: 50,
    });

    expect(res.total).toBe(3);
    expect(
      res.data.every((u) => u.is_verified === false && u.suspended_at === null),
    ).toBe(true);
  });

  it("POST /admin/users creates a user, but a duplicate email rejects with the server message", async () => {
    const body = {
      first_name: "New",
      last_name: "Teacher",
      email: "new.teacher@example.com",
      password: "secret123",
      role: "teacher",
      is_verified: false,
    };

    const created = await adminApi.createUser(body);
    expect(created.id).toBeGreaterThan(0);
    expect(created.suspended_at).toBeNull();

    await expect(adminApi.createUser(body)).rejects.toThrow("Email already exists");
  });

  it("suspend sets suspended_at and unsuspend clears it", async () => {
    const suspended = await adminApi.suspendUser(21);
    expect(typeof suspended.suspended_at).toBe("string");

    const cleared = await adminApi.unsuspendUser(21);
    expect(cleared.suspended_at).toBeNull();
  });

  it("GET /admin/exams returns the exam contract shape, newest first", async () => {
    const res = await adminApi.getExams({ page: 1, limit: 5 });

    expect(Object.keys(res).sort()).toEqual(["data", "total"]);
    expect(res.data.length).toBe(5);
    expect(Object.keys(res.data[0]).sort()).toEqual([
      "created_at",
      "due_date",
      "id",
      "quiz_title",
      "status",
      "teacher",
    ]);
    expect(Object.keys(res.data[0].teacher).sort()).toEqual([
      "first_name",
      "last_name",
    ]);
    expect(res.data[0].created_at >= res.data[1].created_at).toBe(true);
  });
});
