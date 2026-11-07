import { describe, it, expect } from "vitest";
import {
  getExam,
  getAttempts,
  groupAttemptsByStudent,
  sortAttemptsNewestFirst,
  filterByClass,
  filterBySearch,
} from "../features/exam-attempts/lib/attempts.js";

// Small synthetic fixtures for ordering edge cases; the static mock fixtures
// cover the realistic paths (both exams' volumes and class membership).
const STUDENTS = [
  { id: 1, name: "bob", classIds: [9] },
  { id: 2, name: "Alice", classIds: [] },
];

const ATTEMPTS = [
  { id: 10, studentId: 1, rawScore: 3, maxPossibleScore: 10, submittedAt: "2026-11-01T10:00:00.000Z", status: "completed" },
  { id: 11, studentId: 2, rawScore: 8, maxPossibleScore: 10, submittedAt: "2026-11-02T10:00:00.000Z", status: "completed" },
  { id: 12, studentId: 1, rawScore: 7, maxPossibleScore: 10, submittedAt: "2026-11-03T10:00:00.000Z", status: "completed" },
  { id: 13, studentId: 999, rawScore: 5, maxPossibleScore: 10, submittedAt: "2026-11-04T10:00:00.000Z", status: "completed" },
];

describe("getExam", () => {
  it("returns the restricted mock exam for quizId 1", () => {
    const exam = getExam("1");
    expect(exam.title).toBe("Midterm: Algebra II");
    expect(exam.accessibility).toBe("restricted");
  });

  it("returns the open mock exam for quizId 2", () => {
    const exam = getExam("2");
    expect(exam.accessibility).toBe("anyone");
    expect(exam.allowedClasses).toEqual([]);
  });

  it("returns undefined for unknown or missing ids (→ not-found state)", () => {
    expect(getExam("999")).toBeUndefined();
    expect(getExam(undefined)).toBeUndefined();
  });
});

describe("getAttempts", () => {
  it("returns every completed attempt for a known exam", () => {
    expect(getAttempts("1")).toHaveLength(8);
    expect(getAttempts("2")).toHaveLength(14);
    expect(getAttempts("1").every((a) => a.status === "completed")).toBe(true);
  });

  it("returns an empty list for unknown ids", () => {
    expect(getAttempts("999")).toEqual([]);
  });
});

describe("sortAttemptsNewestFirst", () => {
  it("orders by submittedAt descending without mutating the input", () => {
    const input = [ATTEMPTS[0], ATTEMPTS[2]];
    const sorted = sortAttemptsNewestFirst(input);
    expect(sorted.map((a) => a.id)).toEqual([12, 10]);
    expect(input.map((a) => a.id)).toEqual([10, 12]);
  });
});

describe("groupAttemptsByStudent", () => {
  it("groups per student, students A→Z (case-insensitive), attempts newest first", () => {
    const groups = groupAttemptsByStudent(ATTEMPTS, STUDENTS);
    expect(groups.map((g) => g.student.name)).toEqual(["Alice", "bob"]);
    expect(groups[1].attempts.map((a) => a.id)).toEqual([12, 10]);
  });

  it("drops attempts whose student is unknown", () => {
    const groups = groupAttemptsByStudent(ATTEMPTS, STUDENTS);
    const ids = groups.flatMap((g) => g.attempts.map((a) => a.id));
    expect(ids).not.toContain(13);
  });

  it("splits the mock fixtures into single- and multi-attempt students", () => {
    const groups = groupAttemptsByStudent(getAttempts("2"));
    expect(groups).toHaveLength(10);
    expect(groups.filter((g) => g.attempts.length === 1)).toHaveLength(6);
    expect(groups.filter((g) => g.attempts.length > 1)).toHaveLength(4);
  });
});

describe("filterByClass", () => {
  const groups = groupAttemptsByStudent(getAttempts("1"));

  it("keeps only the students of the requested class, in A→Z order", () => {
    const names = filterByClass(groups, 1).map((g) => g.student.name);
    expect(names).toEqual([
      "Alice Nguyen",
      "Brian Okafor",
      "Carla Mendes",
      "Farah Haddad",
    ]);
  });

  it("lists multi-class students under every matching class", () => {
    const inA = filterByClass(groups, 1).map((g) => g.student.name);
    const inB = filterByClass(groups, 2).map((g) => g.student.name);
    expect(inA).toContain("Farah Haddad");
    expect(inB).toContain("Farah Haddad");
    expect(inB).toEqual(["Diego Fernandez", "Emma Lindqvist", "Farah Haddad"]);
  });

  it("returns an empty list for a class nobody belongs to", () => {
    expect(filterByClass(groups, 999)).toEqual([]);
  });
});

describe("filterBySearch", () => {
  const groups = groupAttemptsByStudent(getAttempts("2"));

  it("matches student names case-insensitively", () => {
    expect(filterBySearch(groups, "OLIVIA").map((g) => g.student.name)).toEqual([
      "Olivia Costa",
    ]);
    expect(filterBySearch(groups, "pet").map((g) => g.student.name)).toEqual([
      "Isla Petrov",
    ]);
  });

  it("keeps everything for a blank query", () => {
    expect(filterBySearch(groups, "   ")).toHaveLength(10);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterBySearch(groups, "zzz")).toEqual([]);
  });
});
