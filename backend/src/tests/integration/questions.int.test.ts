// src/tests/integration/questions.test.ts
//
// Tests for:
//   POST   /api/questions
//   GET    /api/questions?documentId=
//   PATCH  /api/questions/:id
//   DELETE /api/questions/:id

import request from 'supertest';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';
import app from '../../server.js';
import { uploaded_files, questions_db } from '../../db/schema.js';
import { loginAs, authHeader, TEACHER_CREDS } from './setup/testHelpers.js';

// ── DB client ────────────────────────────────────────────────────────────────
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// ── Shared state ─────────────────────────────────────────────────────────────
let teacherToken: string;
let teacherId: number;
let seededDocId: number;
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
});

// ─────────────────────────────────────────────────────────────────────────────
// Setup / Teardown
// ─────────────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  const result = await loginAs(TEACHER_CREDS.email, TEACHER_CREDS.password);
  teacherToken = result.accessToken;
  teacherId = result.userId;

  // Seed a document (questions are always linked to a document)
  const [doc] = await db
    .insert(uploaded_files)
    .values({
      user_id: teacherId,
      filename: 'questions_test_doc.pdf',
      file_path: '/fake/questions_test_doc.pdf',
      file_hash: 'qhash001',
      extracted_text: 'Some document text.',
    })
    .returning({ id: uploaded_files.id });

  if(!doc){
    throw new Error('Failed to seed document');
  }

  seededDocId = doc.id;

  // Seed one question so GET/PATCH/DELETE tests have something to work with
  const [question] = await db
    .insert(questions_db)
    .values({
      document_id: seededDocId,
      question_text: 'Pre-seeded question?',
      question_type: 'multiple_choice',
      correct_answer: 'B',
      option_a: 'Wrong',
      option_b: 'Correct',
      option_c: 'Also Wrong',
      option_d: 'Still Wrong',
    })
    .returning({ id: questions_db.id });

  if(!question){
    throw new Error('Failed to seed question');
  }

  seededQuestionId = question.id;
});

afterAll(async () => {
  await db.delete(uploaded_files).where(eq(uploaded_files.id, seededDocId));
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/questions
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/questions', () => {

  it('200 — creates a question linked to an owned document', async () => {
    const res = await request(app)
      .post('/api/questions')
      .set(authHeader(teacherToken))
      .send({ ...validQuestion(), documentId: seededDocId });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.questionId).toBeDefined();
    expect(res.body.documentId).toBe(seededDocId);
  });

  it('404 — rejects a documentId that does not belong to this user', async () => {
    const res = await request(app)
      .post('/api/questions')
      .set(authHeader(teacherToken))
      .send({ ...validQuestion(), documentId: 999999 });

    expect(res.status).toBe(404);
  });

  it('400 — rejects missing required fields', async () => {
    // No questionText
    const res = await request(app)
      .post('/api/questions')
      .set(authHeader(teacherToken))
      .send({ documentId: seededDocId, questionType: 'multiple_choice' });

    expect(res.status).toBe(400);
  });

  it('401 — rejects requests with no token', async () => {
    const res = await request(app)
      .post('/api/questions')
      .send({ ...validQuestion(), documentId: seededDocId });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/questions?documentId=
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/questions', () => {

  it('200 — returns questions for a document owned by the teacher', async () => {
    const res = await request(app)
      .get(`/api/questions?documentId=${seededDocId}`)
      .set(authHeader(teacherToken));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('404 — returns 404 for a documentId that does not exist', async () => {
    const res = await request(app)
      .get('/api/questions?documentId=999999')
      .set(authHeader(teacherToken));

    expect(res.status).toBe(404);
  });

  it('400 — returns 400 when documentId is not a number', async () => {
    const res = await request(app)
      .get('/api/questions?documentId=abc')
      .set(authHeader(teacherToken));

    expect(res.status).toBe(400);
  });

  it('401 — rejects requests with no token', async () => {
    const res = await request(app).get(
      `/api/questions?documentId=${seededDocId}`
    );
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
      documentId: seededDocId,
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
      .send({ ...validQuestion(), documentId: seededDocId });

    expect(res.status).toBe(404);
  });

  it('401 — rejects requests with no token', async () => {
    const res = await request(app)
      .patch(`/api/questions/${seededQuestionId}`)
      .send({ ...validQuestion(), documentId: seededDocId });

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
        document_id: seededDocId,
        question_text: 'Temporary question to delete',
        question_type: 'multiple_choice',
        correct_answer: 'A',
        option_a: 'Yes',
        option_b: 'No',
        option_c: 'Maybe',
        option_d: 'Never',
      })
      .returning({ id: questions_db.id });

    if(!q){
      throw new Error('Failed to seed question');
    }

    questionToDeleteId = q.id;
  });

  afterEach(async () => {
    //clean up seeded question
    await db.delete(questions_db).where(eq(questions_db.id, questionToDeleteId));
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
      `/api/questions/${questionToDeleteId}`
    );
    expect(res.status).toBe(401);
  });
});
