import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  progressKey,
  timerKey,
  loadProgress,
  saveProgress,
  clearAttempt,
  getTimerStart,
} from "../features/student-quiz/lib/attemptStorage";

beforeEach(() => sessionStorage.clear());
afterEach(() => sessionStorage.clear());

describe("attemptStorage keys", () => {
  it("namespaces every key under sf:attempt:", () => {
    expect(progressKey("TOK")).toBe("sf:attempt:progress:TOK");
    expect(timerKey("att-1", "q-1")).toBe("sf:attempt:timer:att-1:q-1");
  });
});

describe("loadProgress / saveProgress", () => {
  it("round-trips answers, index and answeredQuestions (as a Set)", () => {
    saveProgress("TOK", {
      answers: { "q-1": "b", "q-2": "a" },
      selectedQuestionIndex: 2,
      answeredQuestions: new Set(["q-1", "q-2"]),
    });

    const loaded = loadProgress("TOK");
    expect(loaded.answers).toEqual({ "q-1": "b", "q-2": "a" });
    expect(loaded.selectedQuestionIndex).toBe(2);
    expect(loaded.answeredQuestions).toBeInstanceOf(Set);
    expect(loaded.answeredQuestions).toEqual(new Set(["q-1", "q-2"]));
  });

  it("returns defaults for a missing key", () => {
    const loaded = loadProgress("TOK");
    expect(loaded.answers).toEqual({});
    expect(loaded.selectedQuestionIndex).toBe(0);
    expect(loaded.answeredQuestions).toEqual(new Set());
  });

  it("returns a fresh Set per call (no shared mutable state)", () => {
    const first = loadProgress("TOK");
    first.answeredQuestions.add("q-9");
    expect(loadProgress("TOK").answeredQuestions).toEqual(new Set());
  });

  it("drops a corrupt payload and returns defaults instead of throwing", () => {
    sessionStorage.setItem(progressKey("TOK"), "{not json");

    const loaded = loadProgress("TOK");
    expect(loaded.answers).toEqual({});
    expect(loaded.selectedQuestionIndex).toBe(0);
    expect(loaded.answeredQuestions).toEqual(new Set());
    expect(sessionStorage.getItem(progressKey("TOK"))).toBeNull();
  });

  it("drops an invalid payload shape (e.g. 'null') and returns defaults", () => {
    sessionStorage.setItem(progressKey("TOK"), "null");

    expect(loadProgress("TOK").answers).toEqual({});
    expect(sessionStorage.getItem(progressKey("TOK"))).toBeNull();
  });
});

describe("clearAttempt", () => {
  it("removes progress and every timer key for the attempt, nothing else", () => {
    saveProgress("TOK", {
      answers: { "q-1": "b" },
      selectedQuestionIndex: 1,
      answeredQuestions: new Set(["q-1"]),
    });
    sessionStorage.setItem(timerKey("att-1", "q-1"), String(Date.now()));
    sessionStorage.setItem(timerKey("att-1", "q-2"), String(Date.now()));
    sessionStorage.setItem(timerKey("other-attempt", "q-1"), "keep");
    sessionStorage.setItem("unrelated-key", "keep");

    clearAttempt({
      quizToken: "TOK",
      attemptId: "att-1",
      questionIds: ["q-1", "q-2"],
    });

    expect(sessionStorage.getItem(progressKey("TOK"))).toBeNull();
    expect(sessionStorage.getItem(timerKey("att-1", "q-1"))).toBeNull();
    expect(sessionStorage.getItem(timerKey("att-1", "q-2"))).toBeNull();
    expect(sessionStorage.getItem(timerKey("other-attempt", "q-1"))).toBe(
      "keep",
    );
    expect(sessionStorage.getItem("unrelated-key")).toBe("keep");
  });

  it("clears progress even without an attemptId (timers skipped)", () => {
    saveProgress("TOK", {
      answers: { "q-1": "b" },
      selectedQuestionIndex: 0,
      answeredQuestions: new Set(["q-1"]),
    });

    clearAttempt({ quizToken: "TOK", attemptId: null, questionIds: ["q-1"] });

    expect(sessionStorage.getItem(progressKey("TOK"))).toBeNull();
  });

  it("is a silent no-op for timer keys that were never written", () => {
    expect(() =>
      clearAttempt({
        quizToken: "TOK",
        attemptId: "att-1",
        questionIds: ["q-1", "q-2"],
      }),
    ).not.toThrow();
  });
});

describe("getTimerStart", () => {
  it("creates and persists a start time when none exists", () => {
    const before = Date.now();
    const start = getTimerStart({
      attemptId: "att-1",
      questionId: "q-1",
      timeLimit: 30,
    });
    const after = Date.now();

    expect(start).toBeGreaterThanOrEqual(before);
    expect(start).toBeLessThanOrEqual(after);
    expect(sessionStorage.getItem(timerKey("att-1", "q-1"))).toBe(
      String(start),
    );
  });

  it("returns a valid stored start time untouched", () => {
    const stored = Date.now() - 5000;
    sessionStorage.setItem(timerKey("att-1", "q-1"), String(stored));

    expect(
      getTimerStart({ attemptId: "att-1", questionId: "q-1", timeLimit: 30 }),
    ).toBe(stored);
  });

  it.each([
    ["not a number", "not-a-number"],
    ["zero/negative", "0"],
    ["in the future", String(Date.now() + 60_000)],
  ])("resets a %s stored value", (_label, storedValue) => {
    sessionStorage.setItem(timerKey("att-1", "q-1"), storedValue);

    const before = Date.now();
    const start = getTimerStart({
      attemptId: "att-1",
      questionId: "q-1",
      timeLimit: 30,
    });

    expect(start).toBeGreaterThanOrEqual(before);
    expect(sessionStorage.getItem(timerKey("att-1", "q-1"))).toBe(
      String(start),
    );
  });

  it("resets a stored value older than 2x the time limit", () => {
    const timeLimit = 30; // maxReasonableAge = 60s
    const stale = Date.now() - (timeLimit * 2 * 1000 + 60_000);
    sessionStorage.setItem(timerKey("att-1", "q-1"), String(stale));

    const start = getTimerStart({
      attemptId: "att-1",
      questionId: "q-1",
      timeLimit,
    });

    expect(start).not.toBe(stale);
    expect(start).toBeGreaterThanOrEqual(Date.now() - 1000);
  });

  it("falls back to now without writing when ids are missing", () => {
    const before = Date.now();
    const start = getTimerStart({
      attemptId: null,
      questionId: "q-1",
      timeLimit: 30,
    });

    expect(start).toBeGreaterThanOrEqual(before);
    expect(Object.keys(sessionStorage)).toHaveLength(0);
  });
});
