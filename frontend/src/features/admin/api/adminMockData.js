/* Mock layer for the admin API — mock DATA and mock HANDLERS in this ONE
   file, behind the USE_MOCKS flag in admin.api.js. Components never import
   this module; they only ever see the adminApi functions, so flipping the
   flag is a network-boundary change they cannot observe.

   Response shapes here are the contract:
   - lists -> { data: [...], total }   (page/limit in, same shape out)
   - stats -> { teachers, students, exams, pendingTeachers }
   - exams -> { id, quiz_title, status, due_date, created_at,
                teacher: { first_name, last_name } }
   - users -> the DB user shape (never a password field).

   "Needs verification" = teacher && !is_verified && suspended_at === null,
   so GET /admin/users?role=teacher&verified=false excludes suspended
   teachers — the backend applies the same definition (owner decision). */

import { ApiError } from "../../../lib/api.js";

const MOCK_DELAY_MS = 150;
const ROLES = ["student", "teacher", "admin"];

// Mutable mock store — mutations below write here so a query invalidation
// (adminKeys.all) refetches state that actually changed.
let users = [];
let exams = [];
let nextUserId = 1000;

function makeUser(
  id,
  first_name,
  last_name,
  email,
  role,
  is_verified,
  suspended_at,
  created_at,
) {
  return { id, first_name, last_name, email, role, is_verified, suspended_at, created_at };
}

function makeExam(id, quiz_title, status, due_date, created_at, teacher) {
  return { id, quiz_title, status, due_date, created_at, teacher };
}

function buildSeedUsers() {
  return [
    // — admins —
    makeUser(1, "Sam", "Rivera", "sam.rivera@example.com", "admin", true, null, "2025-08-04T08:15:00.000Z"),
    makeUser(2, "Nora", "Fields", "nora.fields@example.com", "admin", true, null, "2025-11-19T10:00:00.000Z"),

    // — teachers: 11–13 are pending verification (unverified + not suspended) —
    makeUser(11, "Alicia", "Diaz", "alicia.diaz@example.com", "teacher", false, null, "2026-11-14T09:30:00.000Z"),
    makeUser(12, "Marcus", "Lee", "marcus.lee@example.com", "teacher", false, null, "2026-11-16T14:05:00.000Z"),
    makeUser(13, "Priya", "Nair", "priya.nair@example.com", "teacher", false, null, "2026-11-18T07:45:00.000Z"),
    // unverified BUT suspended → does not count as pending
    makeUser(14, "Tom", "Baker", "tom.baker@example.com", "teacher", false, "2026-11-10T12:00:00.000Z", "2026-10-02T08:00:00.000Z"),
    // verified teachers (18 is suspended)
    makeUser(15, "Hannah", "Wu", "hannah.wu@example.com", "teacher", true, null, "2026-01-20T08:00:00.000Z"),
    makeUser(16, "Diego", "Ramirez", "diego.ramirez@example.com", "teacher", true, null, "2026-03-11T09:00:00.000Z"),
    makeUser(17, "Grace", "Okoro", "grace.okoro@example.com", "teacher", true, null, "2026-06-05T09:00:00.000Z"),
    makeUser(18, "Rick", "Halden", "rick.halden@example.com", "teacher", true, "2026-09-01T09:00:00.000Z", "2026-02-14T09:00:00.000Z"),

    // — students (28 and 34 are unverified) —
    makeUser(21, "Leo", "Cruz", "leo.cruz@example.com", "student", true, null, "2026-09-01T08:00:00.000Z"),
    makeUser(22, "Maya", "Patel", "maya.patel@example.com", "student", true, null, "2026-09-02T08:00:00.000Z"),
    makeUser(23, "Ethan", "Brooks", "ethan.brooks@example.com", "student", true, null, "2026-09-03T08:00:00.000Z"),
    makeUser(24, "Sofia", "Nguyen", "sofia.nguyen@example.com", "student", true, null, "2026-09-10T08:00:00.000Z"),
    makeUser(25, "Noah", "Kim", "noah.kim@example.com", "student", true, null, "2026-09-15T08:00:00.000Z"),
    makeUser(26, "Isla", "Moore", "isla.moore@example.com", "student", true, null, "2026-09-20T08:00:00.000Z"),
    makeUser(27, "Liam", "Okafor", "liam.okafor@example.com", "student", true, null, "2026-10-01T08:00:00.000Z"),
    makeUser(28, "Zara", "Ahmed", "zara.ahmed@example.com", "student", false, null, "2026-10-05T08:00:00.000Z"),
    makeUser(29, "Lucas", "Martin", "lucas.martin@example.com", "student", true, null, "2026-10-12T08:00:00.000Z"),
    makeUser(30, "Ava", "Thompson", "ava.thompson@example.com", "student", true, null, "2026-10-20T08:00:00.000Z"),
    makeUser(31, "Kenji", "Sato", "kenji.sato@example.com", "student", true, null, "2026-11-01T08:00:00.000Z"),
    makeUser(32, "Elena", "Popov", "elena.popov@example.com", "student", true, null, "2026-11-05T08:00:00.000Z"),
    makeUser(33, "Omar", "Haddad", "omar.haddad@example.com", "student", true, null, "2026-11-12T08:00:00.000Z"),
    makeUser(34, "Chloe", "Dubois", "chloe.dubois@example.com", "student", false, null, "2026-11-17T08:00:00.000Z"),
  ];
}

function buildSeedExams() {
  return [
    makeExam(101, "Midterm — Data Structures", "published", "2026-11-25T23:59:00.000Z", "2026-11-18T10:30:00.000Z", { first_name: "Hannah", last_name: "Wu" }),
    makeExam(102, "Quiz 4 — SQL Joins", "published", "2026-11-22T23:59:00.000Z", "2026-11-17T15:10:00.000Z", { first_name: "Diego", last_name: "Ramirez" }),
    makeExam(103, "Final — Operating Systems", "draft", null, "2026-11-17T08:00:00.000Z", { first_name: "Grace", last_name: "Okoro" }),
    makeExam(104, "Lab 3 — Memory Management", "published", "2026-11-28T23:59:00.000Z", "2026-11-16T09:45:00.000Z", { first_name: "Hannah", last_name: "Wu" }),
    makeExam(105, "Recursion Practice Set", "published", "2026-12-02T23:59:00.000Z", "2026-11-15T11:20:00.000Z", { first_name: "Diego", last_name: "Ramirez" }),
    makeExam(106, "Pop Quiz — Normalization", "draft", null, "2026-11-14T13:00:00.000Z", { first_name: "Grace", last_name: "Okoro" }),
    makeExam(107, "Unit 5 — Networking Basics", "published", "2026-12-10T23:59:00.000Z", "2026-11-12T10:00:00.000Z", { first_name: "Alicia", last_name: "Diaz" }),
    makeExam(108, "Weekly Quiz — Binary Trees", "published", "2026-11-21T23:59:00.000Z", "2026-11-10T09:30:00.000Z", { first_name: "Hannah", last_name: "Wu" }),
    makeExam(109, "Case Study — Database Indexing", "published", "2026-12-05T23:59:00.000Z", "2026-11-08T14:15:00.000Z", { first_name: "Diego", last_name: "Ramirez" }),
    makeExam(110, "Midterm — Computer Networks", "published", "2026-11-30T23:59:00.000Z", "2026-11-05T08:45:00.000Z", { first_name: "Grace", last_name: "Okoro" }),
    makeExam(111, "Practice — Big-O Notation", "published", "2026-11-20T23:59:00.000Z", "2026-11-02T16:00:00.000Z", { first_name: "Hannah", last_name: "Wu" }),
    makeExam(112, "Diagnostic — SQL Basics", "published", "2026-11-19T23:59:00.000Z", "2026-10-28T10:30:00.000Z", { first_name: "Diego", last_name: "Ramirez" }),
  ];
}

function reseed() {
  users = buildSeedUsers();
  exams = buildSeedExams();
  nextUserId = 1000;
}
reseed();

/** Restores the seed store — used by tests, harmless in the app. */
export function resetAdminMocks() {
  reseed();
}

function findUser(id) {
  const found = users.find((u) => u.id === id);
  if (!found) {
    throw new ApiError("User not found", { status: 404, payload: { message: "User not found" } });
  }
  return found;
}

function intParam(params, name, fallback) {
  const parsed = Number.parseInt(params.get(name) ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function paginate(list, params) {
  const page = intParam(params, "page", 1);
  const limit = intParam(params, "limit", 10);
  const start = (page - 1) * limit;
  return { data: list.slice(start, start + limit), total: list.length };
}

function isPendingTeacher(u) {
  return u.role === "teacher" && u.is_verified === false && u.suspended_at === null;
}

function stats() {
  return {
    teachers: users.filter((u) => u.role === "teacher").length,
    students: users.filter((u) => u.role === "student").length,
    exams: exams.length,
    pendingTeachers: users.filter(isPendingTeacher).length,
  };
}

function listUsers(params) {
  let list = users;

  const role = params.get("role");
  if (role) list = list.filter((u) => u.role === role);

  const verified = params.get("verified");
  if (verified !== null) {
    const want = verified === "true";
    if (role === "teacher" && !want) {
      // "Needs verification" definition: unverified AND not suspended.
      list = list.filter((u) => isPendingTeacher(u));
    } else {
      list = list.filter((u) => u.is_verified === want);
    }
  }

  const { data, total } = paginate(list, params);
  return { data, total };
}

function createUser(body) {
  const { first_name, last_name, email, password, role, is_verified } = body ?? {};
  if (!first_name || !last_name || !email || !password || !role) {
    throw new ApiError("Missing required fields", {
      status: 400,
      payload: { message: "Missing required fields" },
    });
  }
  if (!ROLES.includes(role)) {
    throw new ApiError("Invalid role", { status: 400, payload: { message: "Invalid role" } });
  }
  const normalizedEmail = String(email).toLowerCase();
  if (users.some((u) => u.email.toLowerCase() === normalizedEmail)) {
    throw new ApiError("Email already exists", {
      status: 409,
      payload: { message: "Email already exists" },
    });
  }

  const created = {
    id: nextUserId++,
    first_name,
    last_name,
    email: normalizedEmail,
    role,
    is_verified: Boolean(is_verified),
    suspended_at: null,
    created_at: new Date().toISOString(),
  };
  users = [...users, created];
  return created;
}

function updateUser(id, body) {
  const found = findUser(id);
  if (body?.role !== undefined) {
    if (!ROLES.includes(body.role)) {
      throw new ApiError("Invalid role", { status: 400, payload: { message: "Invalid role" } });
    }
    found.role = body.role;
  }
  if (body?.is_verified !== undefined) {
    found.is_verified = Boolean(body.is_verified);
  }
  return found;
}

function setSuspended(id, suspended) {
  const found = findUser(id);
  found.suspended_at = suspended ? new Date().toISOString() : null;
  return found;
}

function deleteUser(id) {
  findUser(id);
  users = users.filter((u) => u.id !== id);
  return { success: true };
}

function listExams(params) {
  const sorted = [...exams].sort((a, b) =>
    a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0,
  );
  return paginate(sorted, params);
}

/** Single dispatch point called by admin.api.js when USE_MOCKS is on. */
export async function handleMockAdminRequest({ method, path, body }) {
  await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
  const url = new URL(path, "http://mock.local");
  const { pathname } = url;

  if (pathname === "/admin/stats" && method === "GET") return stats();

  if (pathname === "/admin/users") {
    if (method === "GET") return listUsers(url.searchParams);
    if (method === "POST") return createUser(body);
  }

  const userRoute = pathname.match(/^\/admin\/users\/(\d+)(\/suspend|\/unsuspend)?$/);
  if (userRoute) {
    const id = Number(userRoute[1]);
    const action = userRoute[2];
    if (method === "PATCH" && !action) return updateUser(id, body);
    if (method === "POST" && action === "/suspend") return setSuspended(id, true);
    if (method === "POST" && action === "/unsuspend") return setSuspended(id, false);
    if (method === "DELETE" && !action) return deleteUser(id);
  }

  if (pathname === "/admin/exams" && method === "GET") return listExams(url.searchParams);

  throw new ApiError(`Mock admin API: no handler for ${method} ${pathname}`, {
    status: 404,
    payload: { message: "Not found" },
  });
}
