// src/tests/integration/quizSubmit.int.test.ts
//
// Tests for:
//   PATCH /api/student/quiz-submit
//     — end-to-end grading of a mixed quiz: exact-match (MC/TF, 1 pt) plus all
//       four reasoning types (LLM-graded 0–10, correct at ≥ 7, 10 pts each)
//     — failure semantics: a reasoning-grading failure returns 500 and writes
//       nothing
//   GET /api/quizzes/:quizId/attempts/:attemptId
//     — maxPoints reported per row (10 for reasoning types, 1 otherwise)
//
// Hermetic by design: both LLM layers (getReasoningScoreObject and
// getSummaryRemarks) are replaced with jest.unstable_mockModule, so no GROQ
// calls are made. ESM imports hoist, so the app / helpers / schema are
// imported dynamically AFTER the mock registrations below.

import request from 'supertest';
import { jest } from '@jest/globals';
import { eq } from 'drizzle-orm';

// ── Mock registrations (before anything imports the app graph) ───────────────

type ReasoningGradingResult = {
  scores: Record<string, number>;
  remarks: Record<string, string>;
};

const reasoningGradingMock = jest.fn<
  (questions: unknown[], answers: Record<string, string>) =>
    Promise<ReasoningGradingResult>
>();
const summaryRemarksMock = jest.fn<() => Promise<string>>();

jest.unstable_mockModule(
  '../../services/getReasoningScoreObject.service.js',
  () => ({
    getReasoningScoreObject: reasoningGradingMock,
    // summaryRemarks imports getGroqClient from this module — must exist and
    // must never build a real Groq client inside a test.
    getGroqClient: jest.fn(() => {
      throw new Error('getGroqClient must not be reached in tests');
    }),
    parseReasoningScores: jest.fn(),
  }),
);

jest.unstable_mockModule('../../services/summaryRemarks.service.js', () => ({
  getSummaryRemarks: summaryRemarksMock,
}));

const { default: app } = await import('../../server.js');
const { db, pool } = await import('../../db/db.js');
const { quizzes_db, questions_db, quiz_attempts_db, attempt_answers_db } =
  await import('../../db/schema.js');
const { loginAs, authHeader, TEACHER_CREDS, STUDENT_CREDS, generateShareToken } =
  await import('./setup/testHelpers.js');

// ── Shared state ─────────────────────────────────────────────────────────────
let studentToken: string;
let studentId: number;
let teacherToken: string;
let teacherId: number;

let seededQuizId: number;

// question ids by type
let mcId: number;
let tfId: number;
let genId: number; // general-open-ended-objective
let explainId: number; // code-explain-open-ended-objective
let outputId: number; // code-output-predict-open-ended-objective
let shortId: number; // short-answer

let successAttemptId: number; // completed by the 200 test
let failureAttemptId: number; // left untouched by the 500 test

const SUMMARY =
  'Strengths:\n• Covered the basics.\n\nGaps:\n• Missed edge cases.\n\nSuggested next steps:\n• Review the missed topics.';

// Fixed grading outcome for the four reasoning questions.
const REASONING_SCORES: Record<string, number> = {}; // filled in beforeAll
const REASONING_REMARKS: Record<string, string> = {}; // filled in beforeAll

// 8 + 7 + 5 + 10 = 30 reasoning; MC 'a' correct (1) + TF wrong (0)
const EXPECTED_RAW_SCORE = 31;
const EXPECTED_MAX_SCORE = 2 * 1 + 4 * 10; // 42
const EXPECTED_PERCENTILE = Math.floor((EXPECTED_RAW_SCORE / EXPECTED_MAX_SCORE) * 100); // 73

const submitBody = (attemptId: number) => ({
  questions: [
    {
      id: mcId,
      questionText: 'Pick option A.',
      questionType: 'multiple-choice',
      correctAnswer: 'a',
      optionA: 'a',
      optionB: 'b',
      optionC: 'c',
      optionD: 'd',
      timeLimit: 20,
    },
    {
      id: tfId,
      questionText: '2 + 2 = 5?',
      questionType: 'true-false',
      correctAnswer: 'false',
      timeLimit: 10,
    },
    {
      id: genId,
      questionText: 'What is a closure and why is it useful?',
      questionType: 'general-open-ended-objective',
      correctAnswer: 'A closure is a function bundled with its lexical scope.',
      timeLimit: 60,
    },
    {
      id: explainId,
      questionText: 'Explain what this snippet does:\n```js\nconst x = [1].map(n => n + 1);\n```',
      questionType: 'code-explain-open-ended-objective',
      correctAnswer: 'It maps each element to itself plus one, producing [2].',
      timeLimit: 60,
    },
    {
      id: outputId,
      questionText: 'What does this print?\n```js\nconsole.log(1 + 1);\n```',
      questionType: 'code-output-predict-open-ended-objective',
      correctAnswer: '2',
      timeLimit: 30,
    },
    {
      id: shortId,
      questionText: 'Name the keyword used to inherit a class.',
      questionType: 'short-answer',
      correctAnswer: 'extends',
      timeLimit: 30,
    },
  ],
  answers: {
    [String(mcId)]: 'a', // correct
    [String(tfId)]: 'true', // wrong (correct is 'false')
    [String(genId)]: 'A closure keeps access to its surrounding scope.',
    [String(explainId)]: 'It returns [2] by adding one to each element.',
    [String(outputId)]: '2',
    [String(shortId)]: 'extends',
  },
  quiz: { id: seededQuizId },
  attemptId,
});

const rowsForAttempt = async (attemptId: number) =>
  db
    .select()
    .from(attempt_answers_db)
    .where(eq(attempt_answers_db.attempt_id, attemptId));

const rowFor = (rows: Awaited<ReturnType<typeof rowsForAttempt>>, questionId: number) => {
  const row = rows.find((r) => r.question_id === questionId);
  if (!row) throw new Error(`No attempt_answers row for question ${questionId}`);
  return row;
};

const attemptRow = async (attemptId: number) => {
  const [attempt] = await db
    .select()
    .from(quiz_attempts_db)
    .where(eq(quiz_attempts_db.id, attemptId));
  if (!attempt) throw new Error(`No quiz_attempts row ${attemptId}`);
  return attempt;
};

// ─────────────────────────────────────────────────────────────────────────────
// Setup / Teardown
// ─────────────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  const teacher = await loginAs(TEACHER_CREDS.email, TEACHER_CREDS.password);
  teacherToken = teacher.accessToken;
  teacherId = teacher.userId;

  const student = await loginAs(STUDENT_CREDS.email, STUDENT_CREDS.password);
  studentToken = student.accessToken;
  studentId = student.userId;

  const [quiz] = await db
    .insert(quizzes_db)
    .values({
      user_id: teacherId,
      quiz_title: 'grading flow quiz',
      quiz_description: 'mixed exact-match + reasoning types',
      share_token: generateShareToken(),
      max_attempts: 6,
      status: 'published',
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
    .returning();
  if (!quiz) throw new Error('Failed to seed quiz');
  seededQuizId = quiz.id;

  const inserted = await db
    .insert(questions_db)
    .values([
      {
        quiz_id: seededQuizId,
        question_text: 'Pick option A.',
        question_type: 'multiple-choice',
        correct_answer: 'a',
        option_a: 'a',
        option_b: 'b',
        option_c: 'c',
        option_d: 'd',
        time_limit: 20,
      },
      {
        quiz_id: seededQuizId,
        question_text: '2 + 2 = 5?',
        question_type: 'true-false',
        correct_answer: 'false',
        time_limit: 10,
      },
      {
        quiz_id: seededQuizId,
        question_text: 'What is a closure and why is it useful?',
        question_type: 'general-open-ended-objective',
        correct_answer: 'A closure is a function bundled with its lexical scope.',
        time_limit: 60,
      },
      {
        quiz_id: seededQuizId,
        question_text: 'Explain what this snippet does.',
        question_type: 'code-explain-open-ended-objective',
        correct_answer: 'It maps each element to itself plus one, producing [2].',
        time_limit: 60,
      },
      {
        quiz_id: seededQuizId,
        question_text: 'What does this print? console.log(1 + 1);',
        question_type: 'code-output-predict-open-ended-objective',
        correct_answer: '2',
        time_limit: 30,
      },
      {
        quiz_id: seededQuizId,
        question_text: 'Name the keyword used to inherit a class.',
        question_type: 'short-answer',
        correct_answer: 'extends',
        time_limit: 30,
      },
    ])
    .returning();

  const byType = (type: string) => {
    const q = inserted.find((row) => row.question_type === type);
    if (!q) throw new Error(`Failed to seed question of type ${type}`);
    return q;
  };
  mcId = byType('multiple-choice').id;
  tfId = byType('true-false').id;
  genId = byType('general-open-ended-objective').id;
  explainId = byType('code-explain-open-ended-objective').id;
  outputId = byType('code-output-predict-open-ended-objective').id;
  shortId = byType('short-answer').id;

  REASONING_SCORES[String(genId)] = 8; // ≥ 7 → correct
  REASONING_SCORES[String(explainId)] = 7; // boundary → correct
  REASONING_SCORES[String(outputId)] = 5; // < 7 → wrong
  REASONING_SCORES[String(shortId)] = 10; // perfect → correct
  REASONING_REMARKS[String(genId)] = 'Good definition.';
  REASONING_REMARKS[String(explainId)] = 'Mentions the map step.';
  REASONING_REMARKS[String(outputId)] = 'Misses the assignment.';
  REASONING_REMARKS[String(shortId)] = '';

  const attempts = await db
    .insert(quiz_attempts_db)
    .values([
      { quiz_id: seededQuizId, user_id: studentId, status: 'in-progress' },
      { quiz_id: seededQuizId, user_id: studentId, status: 'in-progress' },
    ])
    .returning();
  if (!attempts[0] || !attempts[1]) throw new Error('Failed to seed attempts');
  successAttemptId = attempts[0].id;
  failureAttemptId = attempts[1].id;
});

afterAll(async () => {
  // quiz row cascades questions, attempts, and answer rows
  await db.delete(quizzes_db).where(eq(quizzes_db.id, seededQuizId));
  if (pool) await pool.end();
});

beforeEach(() => {
  reasoningGradingMock.mockReset();
  reasoningGradingMock.mockResolvedValue({
    scores: { ...REASONING_SCORES },
    remarks: { ...REASONING_REMARKS },
  });
  summaryRemarksMock.mockReset();
  summaryRemarksMock.mockResolvedValue(SUMMARY);
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/student/quiz-submit
// ─────────────────────────────────────────────────────────────────────────────

describe('PATCH /api/student/quiz-submit', () => {
  it('200 — grades exact-match and all reasoning types, then persists the attempt', async () => {
    const res = await request(app)
      .patch('/api/student/quiz-submit')
      .set(authHeader(studentToken))
      .send(submitBody(successAttemptId));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // the split: only the 4 reasoning answers reach the LLM grader
    expect(reasoningGradingMock).toHaveBeenCalledTimes(1);
    const call = reasoningGradingMock.mock.calls[0];
    expect(call).toBeDefined();
    if (!call) throw new Error('grading mock not called');
    expect(call[0]).toHaveLength(4);
    expect(Object.keys(call[1])).toHaveLength(4);
    expect(Object.keys(call[1])).toEqual(
      expect.arrayContaining([String(genId), String(explainId), String(outputId), String(shortId)]),
    );
    expect(summaryRemarksMock).toHaveBeenCalledTimes(1);

    // attempt row: aggregates + completion
    const attempt = await attemptRow(successAttemptId);
    expect(attempt.status).toBe('completed');
    expect(attempt.raw_score).toBe(EXPECTED_RAW_SCORE);
    expect(attempt.max_possible_score).toBe(EXPECTED_MAX_SCORE);
    expect(attempt.score).toBe(EXPECTED_PERCENTILE);
    expect(attempt.attempt_remarks).toBe(SUMMARY);

    // answer rows
    const rows = await rowsForAttempt(successAttemptId);
    expect(rows).toHaveLength(6);

    const mc = rowFor(rows, mcId);
    expect(mc.points).toBe(1);
    expect(mc.is_correct).toBe(true);
    expect(mc.chosen_answer).toBe('a');

    const tf = rowFor(rows, tfId);
    expect(tf.points).toBe(0);
    expect(tf.is_correct).toBe(false);

    const gen = rowFor(rows, genId);
    expect(gen.points).toBe(8);
    expect(gen.is_correct).toBe(true);
    expect(gen.remarks).toBe('Good definition.');

    const explain = rowFor(rows, explainId);
    expect(explain.points).toBe(7);
    expect(explain.is_correct).toBe(true); // boundary: ≥ 7 counts as correct

    const output = rowFor(rows, outputId);
    expect(output.points).toBe(5);
    expect(output.is_correct).toBe(false);

    const short = rowFor(rows, shortId);
    expect(short.points).toBe(10);
    expect(short.is_correct).toBe(true);
  });

  it('500 — reasoning grading failure writes nothing', async () => {
    reasoningGradingMock.mockRejectedValueOnce(new Error('LLM unavailable'));

    const res = await request(app)
      .patch('/api/student/quiz-submit')
      .set(authHeader(studentToken))
      .send(submitBody(failureAttemptId));

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      'Failed to grade open-ended questions. Please try again.',
    );

    // no partial writes: attempt untouched, zero answer rows
    const attempt = await attemptRow(failureAttemptId);
    expect(attempt.status).toBe('in-progress');
    expect(attempt.attempt_remarks).toBe('none'); // column default
    expect(await rowsForAttempt(failureAttemptId)).toHaveLength(0);
    expect(summaryRemarksMock).not.toHaveBeenCalled();
  });

  it('400 — rejects a body with missing required fields', async () => {
    const res = await request(app)
      .patch('/api/student/quiz-submit')
      .set(authHeader(studentToken))
      .send({ questions: [], answers: {} }); // no quiz.id, no attemptId

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('401 — rejects requests with no token', async () => {
    const res = await request(app)
      .patch('/api/student/quiz-submit')
      .send(submitBody(successAttemptId));

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/quizzes/:quizId/attempts/:attemptId  (maxPoints for reasoning rows)
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/quizzes/:quizId/attempts/:attemptId', () => {
  // depends on the 200 test above having persisted the success attempt's rows
  it('200 — reports maxPoints 10 for reasoning types and 1 for exact-match', async () => {
    const res = await request(app)
      .get(`/api/quizzes/${seededQuizId}/attempts/${successAttemptId}`)
      .set(authHeader(teacherToken));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.attemptRemarks).toBe(SUMMARY);
    expect(res.body.questions).toHaveLength(6);

    const byId = (questionId: number) => {
      const q = res.body.questions.find(
        (row: { questionId: number }) => row.questionId === questionId,
      );
      if (!q) throw new Error(`detail response missing question ${questionId}`);
      return q as { maxPoints: number; points: number };
    };

    expect(byId(mcId).maxPoints).toBe(1);
    expect(byId(tfId).maxPoints).toBe(1);
    expect(byId(genId).maxPoints).toBe(10);
    expect(byId(explainId).maxPoints).toBe(10);
    expect(byId(outputId).maxPoints).toBe(10);
    expect(byId(shortId).maxPoints).toBe(10);
    expect(byId(shortId).points).toBe(10);
  });
});
