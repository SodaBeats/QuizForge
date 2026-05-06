// src/tests/integration/questions.test.ts
//
// Tests for:
//   POST   /api/questions
//   GET    /api/questions?documentId=
//   PATCH  /api/questions/:id
//   DELETE /api/questions/:id

import request from 'supertest';
import { eq } from 'drizzle-orm';
import app from '../../server.js';
import { db, pool } from '../../db/db.js';
import { questions_db, quizzes_db } from '../../db/schema.js';
import {
  loginAs,
  authHeader,
  TEACHER_CREDS,
  generateShareToken,
  STUDENT_CREDS,
} from './setup/testHelpers.js';

// ── Shared state ─────────────────────────────────────────────────────────────
let teacherToken: string;
let teacherId: number;
let studentToken: string;
let studentId: number;
let seededQuizId: number;
let seededQuestionId: number;

// ── Reusable valid question payload ──────────────────────────────────────────
const validQuestion = () => ({
  questionText: 'What is 2 + 2?',
  questionType: 'multiple_choice',
  correctAnswer: 'A',
  optionA: '4',
  optionB: '3',
  optionC: '5',
  optionD: '6',
  timeLimit: 20,
});

// ─────────────────────────────────────────────────────────────────────────────
// Setup / Teardown
// ─────────────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  const result = await loginAs(TEACHER_CREDS.email, TEACHER_CREDS.password);
  teacherToken = result.accessToken;
  teacherId = result.userId;
  const result2 = await loginAs(STUDENT_CREDS.email, STUDENT_CREDS.password);
  studentToken = result2.accessToken;
  studentId = result2.userId;

  // Seed a document (questions are always linked to a document)
  const [quiz] = await db
    .insert(quizzes_db)
    .values({
      user_id: teacherId,
      quiz_title: 'sample quiz',
      quiz_description: 'sample description',
      share_token: generateShareToken(),
      max_attempts: 6,
      status: 'published',
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
    .returning();

  if (!quiz) {
    throw new Error('Failed to seed quiz');
  }

  seededQuizId = quiz.id;

  // Seed one question so GET/PATCH/DELETE tests have something to work with
  const [question] = await db
    .insert(questions_db)
    .values({
      quiz_id: seededQuizId,
      question_text: 'Pre-seeded question?',
      question_type: 'multiple_choice',
      correct_answer: 'b',
      option_a: 'Wrong',
      option_b: 'Correct',
      option_c: 'Also Wrong',
      option_d: 'Still Wrong',
      time_limit: 20,
    })
    .returning();

  if (!question) {
    throw new Error('Failed to seed question');
  }

  seededQuestionId = question.id;
});

afterAll(async () => {
  await db.delete(quizzes_db).where(eq(quizzes_db.id, seededQuizId));
  if (pool) await pool.end();
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/questions
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/questions', () => {
  it('201 — creates a question linked to an owned quiz', async () => {
    const res = await request(app)
      .post('/api/questions')
      .set(authHeader(teacherToken))
      .send({ ...validQuestion(), quizId: seededQuizId });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('404 — rejects a quizId that does not belong to this user', async () => {
    const res = await request(app)
      .post('/api/questions')
      .set(authHeader(teacherToken))
      .send({ ...validQuestion(), quizId: 999999 });

    expect(res.status).toBe(404);
  });

  it('400 — rejects missing required fields', async () => {
    // No questionText
    const res = await request(app)
      .post('/api/questions')
      .set(authHeader(teacherToken))
      .send({ quizId: seededQuizId, questionType: 'multiple_choice' });

    expect(res.status).toBe(400);
  });

  it('401 — rejects requests with no token', async () => {
    const res = await request(app)
      .post('/api/questions')
      .send({ ...validQuestion(), quizId: seededQuizId });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/questions?quizId=
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/questions', () => {
  it('200 — returns questions for a quiz owned by the teacher', async () => {
    const res = await request(app)
      .get(`/api/questions?quizId=${seededQuizId}`)
      .set(authHeader(teacherToken));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('404 — returns 404 for a quizId that does not exist', async () => {
    const res = await request(app)
      .get('/api/questions?quizId=999999')
      .set(authHeader(teacherToken));

    expect(res.status).toBe(404);
  });

  it('400 — returns 400 when quizId is not a number', async () => {
    const res = await request(app)
      .get('/api/questions?quizId=abc')
      .set(authHeader(teacherToken));

    expect(res.status).toBe(400);
  });

  it('404 - returns 404 when user is not the owner', async () => {
    const res = await request(app)
      .get(`/api/questions?quizId=${seededQuizId}`)
      .set(authHeader(studentToken));

    expect(res.status).toBe(404);
  });

  it('401 — rejects requests with no token', async () => {
    const res = await request(app).get(`/api/questions?quizId=${seededQuizId}`);
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/questions/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('PATCH /api/questions/:id', () => {
  it('200 — updates an owned question successfully', async () => {
    const updated = {
      questionText: 'Updated question text?',
      questionType: 'multiple_choice',
      correctAnswer: 'C',
      optionA: 'A option',
      optionB: 'B option',
      optionC: 'C option — correct',
      optionD: 'D option',
      quizId: seededQuizId,
      timeLimit: 122,
    };

    const res = await request(app)
      .patch(`/api/questions/${seededQuestionId}`)
      .set(authHeader(teacherToken))
      .send(updated);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('404 — returns 404 for a non-existent question', async () => {
    const res = await request(app)
      .patch('/api/questions/999999')
      .set(authHeader(teacherToken))
      .send({ ...validQuestion(), quizId: seededQuizId });

    expect(res.status).toBe(404);
  });

  it('401 — rejects requests with no token', async () => {
    const res = await request(app)
      .patch(`/api/questions/${seededQuestionId}`)
      .send({ ...validQuestion(), quizId: seededQuizId });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/questions/:id
// ─────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/questions/:id', () => {
  // Seed a fresh question per test so deletion doesn't affect other suites
  let questionToDeleteId: number;

  beforeEach(async () => {
    const [q] = await db
      .insert(questions_db)
      .values({
        quiz_id: seededQuizId,
        question_text: 'Temporary question to delete',
        question_type: 'multiple_choice',
        correct_answer: 'A',
        option_a: 'Yes',
        option_b: 'No',
        option_c: 'Maybe',
        option_d: 'Never',
        time_limit: 12,
      })
      .returning();

    if (!q) {
      throw new Error('Failed to seed question');
    }

    questionToDeleteId = q.id;
  });

  afterEach(async () => {
    //clean up seeded question
    await db
      .delete(questions_db)
      .where(eq(questions_db.id, questionToDeleteId));
  });

  it('200 — deletes an owned question successfully', async () => {
    const res = await request(app)
      .delete(`/api/questions/${questionToDeleteId}`)
      .set(authHeader(teacherToken));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/deleted/i);
  });

  it('404 — returns 404 for a non-existent question', async () => {
    const res = await request(app)
      .delete('/api/questions/999999')
      .set(authHeader(teacherToken));

    expect(res.status).toBe(404);
  });

  it('401 — rejects requests with no token', async () => {
    const res = await request(app).delete(
      `/api/questions/${questionToDeleteId}`,
    );
    expect(res.status).toBe(401);
  });
});
