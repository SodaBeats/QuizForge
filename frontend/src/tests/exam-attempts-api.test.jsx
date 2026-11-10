import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { configureApiClient } from "../lib/api.js";
import { examAttemptsApi } from "../features/exam-attempts/api/examAttempts.api.js";

const jsonResponse = (status, body) =>
  new Response(JSON.stringify(body), { status });

describe("examAttempts.api", () => {
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

  it("requests exam details from /api/quizzes/:quizId and unwraps `exam`", async () => {
    const exam = { id: 7, title: "Midterm", questionCount: 25 };
    fetchMock.mockResolvedValue(
      jsonResponse(200, { success: true, exam }),
    );

    await expect(examAttemptsApi.examDetails(7)).resolves.toEqual(exam);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:3000/api/quizzes/7",
    );
  });

  it("requests the attempts list from /api/quizzes/:quizId/attempts/list", async () => {
    const attempts = [{ id: 1003, studentId: 5 }];
    const students = [{ id: 5, name: "Brian Okafor", classIds: [1] }];
    fetchMock.mockResolvedValue(
      jsonResponse(200, { success: true, attempts, students }),
    );

    await expect(examAttemptsApi.attemptList(7)).resolves.toEqual({
      attempts,
      students,
    });
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:3000/api/quizzes/7/attempts/list",
    );
  });

  it("normalizes a missing attempts payload to empty arrays", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { success: true }));

    await expect(examAttemptsApi.attemptList(7)).resolves.toEqual({
      attempts: [],
      students: [],
    });
  });

  it("requests one attempt's detail from /api/quizzes/:quizId/attempts/:attemptId", async () => {
    const questions = [
      {
        questionId: 1,
        questionText: "What is 2 + 2?",
        questionType: "multiple-choice",
        options: ["3", "4", "5", "6"],
        chosenAnswer: "b",
        correctAnswer: "b",
        isCorrect: true,
        points: 1,
        maxPoints: 1,
        remarks: null,
      },
    ];
    fetchMock.mockResolvedValue(
      jsonResponse(200, { success: true, questions }),
    );

    await expect(examAttemptsApi.attemptDetail(7, 1003)).resolves.toEqual(
      questions,
    );
    expect(fetchMock.mock.calls[0][0]).toBe(
      "http://localhost:3000/api/quizzes/7/attempts/1003",
    );
  });

  it("normalizes a missing questions payload to an empty array", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { success: true }));

    await expect(examAttemptsApi.attemptDetail(7, 1003)).resolves.toEqual([]);
  });

  it("surfaces API errors through the shared client (status preserved)", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(404, { message: "Quiz not found" }),
    );

    await expect(examAttemptsApi.examDetails(999)).rejects.toMatchObject({
      name: "ApiError",
      status: 404,
      message: "Quiz not found",
    });
  });
});
