// src/tests/integration/quizzes.test.ts
//
// Tests for:
//   POST   /api/quizzes                          — create quiz
//   GET    /api/quizzes                          — list teacher's quizzes
//   GET    /api/quizzes/questions?quizId=        — get questions in a quiz
//   PATCH  /api/quizzes/:id                      — update quiz metadata
//   POST   /api/student/quiz-access             — student accesses quiz by token
//   PATCH  /api/student/quiz-submit             — student submits quiz

import request from 'supertest';
import { eq, and } from 'drizzle-orm';
import { db, pool } from '../../db/db.js';
import app from '../../server.js';
import {
  uploaded_files,
  questions_db,
  quizzes_db,
  quiz_questions_db,
  quiz_attempts_db,
} from '../../db/schema.js';
import {
  loginAs,
  authHeader,
  TEACHER_CREDS,
  STUDENT_CREDS,
  STUDENT2_CREDS,
  generateShareToken,
} from './setup/testHelpers.js';

// ── Shared state ─────────────────────────────────────────────────────────────
let teacherToken: string;
let teacherId: number;
let studentToken: string;
let studentId: number;
let student2Token: string;
let student2Id: number;

let seededDocId: number;
let metricsDocId: number;
let seededQuestionId: number;
let metricsQuestionId: number;
let seededQuizId: number;
let metricsQuizId: number;
let seededQuizShareToken: string;
let metricsQuizShareToken: string;

// ── Helper: a future due date ─────────────────────────────────────────────────
const futureDueDate = () =>
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

// ── Reusable quiz payload ─────────────────────────────────────────────────────
// questionIds gets filled in after seeding
const buildQuizPayload = (questionIds: number[], fileId: number) => ({
  quizTitle: 'Integration Test Quiz',
  description: 'A quiz created by the integration test suite',
  maxAttempts: 2,
  dueDate: futureDueDate(),
  status: 'published',
  shareToken: generateShareToken(), // 6-char unique token
  questionIds,
  fileId,
});

// ─────────────────────────────────────────────────────────────────────────────
// Setup / Teardown
// ─────────────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  // Log in as both roles
  const teacherResult = await loginAs(TEACHER_CREDS.email, TEACHER_CREDS.password);
  teacherToken = teacherResult.accessToken;
  teacherId = teacherResult.userId;

  const studentResult = await loginAs(STUDENT_CREDS.email, STUDENT_CREDS.password);
  studentToken = studentResult.accessToken;
  studentId = studentResult.userId;

  const student2Result = await loginAs(STUDENT2_CREDS.email, STUDENT2_CREDS.password);
  student2Token = student2Result.accessToken;
  student2Id = student2Result.userId;

  // Seed a document
  const [doc] = await db
    .insert(uploaded_files)
    .values({
      user_id: teacherId,
      filename: 'quiz_test_doc.pdf',
      file_path: '/fake/quiz_test_doc.pdf',
      file_hash: 'quizhash001',
      extracted_text: 'Quiz test document text.',
    })
    .returning();

  if(!doc){
    throw new Error('Failed to seed document');
  }

  seededDocId = doc.id;

  // Seed a question
  const [question] = await db
    .insert(questions_db)
    .values({
      document_id: seededDocId,
      question_text: 'Which planet is closest to the Sun?',
      question_type: 'multiple_choice',
      correct_answer: 'A',
      option_a: 'Mercury',
      option_b: 'Venus',
      option_c: 'Earth',
      option_d: 'Mars',
      time_limit: 12
    })
    .returning();
  
  if(!question){
    throw new Error('Failed to seed question');
  }

  seededQuestionId = question.id;

  // Seed a quiz + assign the question to it
  const shareToken = generateShareToken();

  const [quiz] = await db
    .insert(quizzes_db)
    .values({
      user_id: teacherId,
      quiz_title: 'Seeded Quiz',
      quiz_description: 'Used by GET/PATCH/access/submit tests',
      share_token: shareToken,
      max_attempts: 3,
      status: 'published',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })
    .returning();

  if(!quiz){
    throw new Error('Failed to seed quiz');
  }

  seededQuizId = quiz.id;
  seededQuizShareToken = quiz.share_token;

  await db.insert(quiz_questions_db).values({
    quiz_id: seededQuizId,
    question_id: seededQuestionId,
  });
});

afterAll(async () => {
  await db.delete(quiz_attempts_db).where(eq(quiz_attempts_db.user_id, studentId));
  await db.delete(quiz_questions_db).where(eq(quiz_questions_db.quiz_id, seededQuizId));
  await db.delete(quizzes_db).where(eq(quizzes_db.id, seededQuizId));
  await db.delete(questions_db).where(eq(questions_db.document_id, seededDocId));
  await db.delete(uploaded_files).where(eq(uploaded_files.id, seededDocId));

  if(pool) await pool.end();
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/quizzes  — create quiz
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/quizzes', () => {

  it('200 — teacher creates a quiz successfully', async () => {
    const payload = buildQuizPayload([seededQuestionId], seededDocId);

    const res = await request(app)
      .post('/api/quizzes')
      .set(authHeader(teacherToken))
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('400 — rejects quiz with no questions', async () => {
    const payload = buildQuizPayload([], seededDocId); // empty questionIds

    const res = await request(app)
      .post('/api/quizzes')
      .set(authHeader(teacherToken))
      .send(payload);

    expect(res.status).toBe(400);
  });

  it('400 — rejects student trying to create a quiz', async () => {
    const payload = buildQuizPayload([seededQuestionId], seededDocId);

    const res = await request(app)
      .post('/api/quizzes')
      .set(authHeader(studentToken))
      .send(payload);

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/unauthorized/i);
  });

  it('401 — rejects unauthenticated request', async () => {
    const payload = buildQuizPayload([seededQuestionId], seededDocId);

    const res = await request(app)
      .post('/api/quizzes')
      .send(payload);

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/quizzes  — list teacher's quizzes
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/quizzes', () => {

  it('200 — returns quizzes belonging to the teacher', async () => {
    const res = await request(app)
      .get('/api/quizzes')
      .set(authHeader(teacherToken));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('401 — rejects unauthenticated request', async () => {
    const res = await request(app).get('/api/quizzes');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/quizzes/questions?quizId=  — questions assigned to a quiz
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/quizzes/questions', () => {

  it('200 — returns questions for a valid quiz', async () => {
    const res = await request(app)
      .get(`/api/quizzes/questions?quizId=${seededQuizId}`)
      .set(authHeader(teacherToken));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.questionList)).toBe(true);
    expect(res.body.questionList.length).toBeGreaterThan(0);
  });

  it('400 — returns 400 when quizId is missing', async () => {
    const res = await request(app)
      .get('/api/quizzes/questions')
      .set(authHeader(teacherToken));

    expect(res.status).toBe(400);
  });

  it('401 — rejects unauthenticated request', async () => {
    const res = await request(app).get(
      `/api/quizzes/questions?quizId=${seededQuizId}`
    );
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/quizzes/:quizId/metrics
// — get quiz metrics [total takers, quiz average, highest score, highest scorer, lowest score]
// ─────────────────────────────────────────────────────────────────────────────

describe('GET api/quizzes/:quizId/metrics', () => {

  beforeAll( async () => {
    // Seed a document
    const [metricsDoc] = await db
      .insert(uploaded_files)
      .values({
        user_id: teacherId,
        filename: 'quiz_test_doc.docx',
        file_path: '/fake/quiz_test_doc.docx',
        file_hash: 'quizhash002',
        extracted_text: 'Quiz test document text for metrics test.',
      })
      .returning();

    if(!metricsDoc){
      throw new Error('Failed to seed metrics document');
    }

    metricsDocId = metricsDoc.id;

    // Seed a question
    const [metricsQuestion] = await db
      .insert(questions_db)
      .values({
        document_id: metricsDocId,
        question_text: 'Is this a test?',
        question_type: 'true-false',
        correct_answer: 'true',
        time_limit: 10
      })
      .returning();

    if(!metricsQuestion){
      throw new Error('Failed to seed metrics question');
    }

    metricsQuestionId = metricsQuestion.id;

    // Seed a quiz + assign the question to it
    const shareToken = generateShareToken();

    const [metricsQuiz] = await db
      .insert(quizzes_db)
      .values({
        user_id: teacherId,
        quiz_title: 'Metrics Quiz',
        quiz_description: 'Used by GET api/quizzes/quizId/metrics',
        share_token: shareToken,
        max_attempts: 3,
        status: 'published',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      .returning();

    if(!metricsQuiz){
      throw new Error('Failed to seed quiz');
    }

    metricsQuizId = metricsQuiz.id;
    metricsQuizShareToken = metricsQuiz.share_token;

    await db.insert(quiz_questions_db).values({
      quiz_id: metricsQuizId,
      question_id: metricsQuestionId,
    });

    //first access quiz to make attempt
    const accessRes = await request(app)
      .post('/api/student/quiz-access')
      .set(authHeader(studentToken))
      .send({ token: metricsQuizShareToken });

    expect(accessRes.status).toBe(200);

    //access quiz to get questions
    const quizRes = await request(app)
      .get(`/api/student/quiz-access/${metricsQuizShareToken}`)
      .set(authHeader(studentToken))
    
    const { quiz, questions, attemptId, attemptStart } = quizRes.body;
    
    expect(quizRes.status).toBe(200);
    expect(quiz).toBeDefined();
    expect(questions).toBeDefined();
    expect(attemptStart).toBeDefined();
    expect(attemptId).toBeDefined();

    // Build an answers object: { [questionId]: selectedAnswer }
    const answers: Record<string, string> = {};
    for (const q of questions) {
      answers[q.id] = 'false'; // just pick option A for every question
    }

    //submit quiz and record score
    const submitRes = await request(app)
      .patch('/api/student/quiz-submit')
      .set(authHeader(studentToken))
      .send({ quiz, questions, answers, attemptId });

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.success).toBe(true);
    expect(submitRes.body.message).toMatch(/attempt received/i);
  });

  afterAll(async () => {
    await db.delete(quiz_attempts_db).where(and(
      eq(quiz_attempts_db.quiz_id, metricsQuizId),
      eq(quiz_attempts_db.user_id, studentId)
    ));
    await db.delete(quiz_questions_db).where(eq(quiz_questions_db.quiz_id, metricsQuizId));
    await db.delete(quizzes_db).where(eq(quizzes_db.id, metricsQuizId));
    await db.delete(questions_db).where(eq(questions_db.document_id, metricsDocId));
    await db.delete(uploaded_files).where(eq(uploaded_files.id, metricsDocId));
  });

  it('200 - returns metrics for valid role', async () => {
    // Now get metrics with proper role and even with 0 score/average
    const res = await request(app)
      .get(`/api/quizzes/${metricsQuizId}/metrics`)
      .set(authHeader(teacherToken))

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.totalTakers).toBe(1);
    expect(res.body.quizAverage).toBeDefined();
    expect(res.body.highestScore).toBeDefined();
    expect(res.body.highestScorer).toBeDefined();
    expect(res.body.lowestScore).toBeDefined();
  });

  it('403 - Rejects unauthorized request (student)', async () => {
    const res = await request(app)
      .get(`/api/quizzes/${metricsQuizId}/metrics`)
      .set(authHeader(studentToken))

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Unauthorized action/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/quizzes/:quizId/students
// — get student ranking
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/quizzes/:quizId/students', ()=> {
  beforeAll( async () => {
    // Seed a document
    const [metricsDoc] = await db
      .insert(uploaded_files)
      .values({
        user_id: teacherId,
        filename: 'quiz_test_doc.docx',
        file_path: '/fake/quiz_test_doc.docx',
        file_hash: 'quizhash002',
        extracted_text: 'Quiz test document text for metrics test.',
      })
      .returning();

    if(!metricsDoc){
      throw new Error('Failed to seed metrics document');
    }

    metricsDocId = metricsDoc.id;

    // Seed a question
    const [metricsQuestion] = await db
      .insert(questions_db)
      .values({
        document_id: metricsDocId,
        question_text: 'Is this a test?',
        question_type: 'true-false',
        correct_answer: 'true',
        time_limit: 10
      })
      .returning();

    if(!metricsQuestion){
      throw new Error('Failed to seed metrics question');
    }

    metricsQuestionId = metricsQuestion.id;

    // Seed a quiz + assign the question to it
    const shareToken = generateShareToken();

    const [metricsQuiz] = await db
      .insert(quizzes_db)
      .values({
        user_id: teacherId,
        quiz_title: 'Metrics Quiz',
        quiz_description: 'Used by GET api/quizzes/quizId/metrics',
        share_token: shareToken,
        max_attempts: 3,
        status: 'published',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      .returning();

    if(!metricsQuiz){
      throw new Error('Failed to seed quiz');
    }

    metricsQuizId = metricsQuiz.id;
    metricsQuizShareToken = metricsQuiz.share_token;

    await db.insert(quiz_questions_db).values({
      quiz_id: metricsQuizId,
      question_id: metricsQuestionId,
    });

    //first access quiz to make attempt
    const accessRes = await request(app)
      .post('/api/student/quiz-access')
      .set(authHeader(studentToken))
      .send({ token: metricsQuizShareToken });

    expect(accessRes.status).toBe(200);

    const accessRes2 = await request(app)
      .post('/api/student/quiz-access')
      .set(authHeader(student2Token))
      .send({ token: metricsQuizShareToken });

    expect(accessRes2.status).toBe(200);

    //access quiz to get questions
    const quizRes = await request(app)
      .get(`/api/student/quiz-access/${metricsQuizShareToken}`)
      .set(authHeader(studentToken))
    
    const { quiz, questions, attemptId, attemptStart } = quizRes.body;
    
    expect(quizRes.status).toBe(200);
    expect(quiz).toBeDefined();
    expect(questions).toBeDefined();
    expect(attemptStart).toBeDefined();
    expect(attemptId).toBeDefined();

    //access quiz to get questions
    const quizRes2 = await request(app)
      .get(`/api/student/quiz-access/${metricsQuizShareToken}`)
      .set(authHeader(student2Token))
    
    const { quiz: quiz2, questions: questions2, attemptId: attemptId2, attemptStart:attemptStart2 } = quizRes2.body;
    
    expect(quizRes2.status).toBe(200);
    expect(quiz2).toBeDefined();
    expect(questions2).toBeDefined();
    expect(attemptStart2).toBeDefined();
    expect(attemptId2).toBeDefined();

    // Build an answers object: { [questionId]: selectedAnswer }
    const answers: Record<string, string> = {};
    for (const q of questions) {
      answers[q.id] = 'false';
    }
    const answers2: Record<string, string> = {};
    for (const x of questions2){
      answers2[x.id] = 'true';
    }

    //submit quiz and record score
    const submitRes = await request(app)
      .patch('/api/student/quiz-submit')
      .set(authHeader(studentToken))
      .send({ quiz, questions, answers, attemptId });

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.success).toBe(true);
    expect(submitRes.body.message).toMatch(/attempt received/i);

    const submitRes2 = await request(app)
      .patch('/api/student/quiz-submit')
      .set(authHeader(student2Token))
      .send({
        quiz: quiz2,
        questions: questions2,
        answers: answers2,
        attemptId: attemptId2
      });

    expect(submitRes2.status).toBe(200);
    expect(submitRes2.body.success).toBe(true);
    expect(submitRes2.body.message).toMatch(/attempt received/i);
  });

  afterAll(async () => {
    await db.delete(quiz_attempts_db).where(eq(quiz_attempts_db.quiz_id, metricsQuizId));
    await db.delete(quiz_questions_db).where(eq(quiz_questions_db.quiz_id, metricsQuizId));
    await db.delete(quizzes_db).where(eq(quizzes_db.id, metricsQuizId));
    await db.delete(questions_db).where(eq(questions_db.document_id, metricsDocId));
    await db.delete(uploaded_files).where(eq(uploaded_files.id, metricsDocId));
  });

  it('200 - returns ranking for valid role', async () => {
    const res = await request(app)
      .get(`/api/quizzes/${metricsQuizId}/students`)
      .set(authHeader(teacherToken))

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data[0]).toHaveProperty('id');
    expect(res.body.data.length).toBe(2);
  });

  it('403 - Rejects unauthorized request', async () => {
    const res = await request(app)
      .get(`/api/quizzes/${metricsQuizId}/students`)
      .set(authHeader(studentToken))

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Unauthorized action/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TO DO:
// GET /api/quizzes/:quizId/questions
// GET /api/quizzes/:quizId/score
// — get question correction rate
// — get score ranking
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/quizzes/:id  — update quiz metadata
// ─────────────────────────────────────────────────────────────────────────────

describe('PATCH /api/quizzes/:id', () => {

  it('200 — updates quiz metadata successfully', async () => {
    const res = await request(app)
      .patch(`/api/quizzes/${seededQuizId}`)
      .set(authHeader(teacherToken))
      .send({
        quizTitle: 'Updated Quiz Title',
        description: 'Updated description',
        maxAttempts: 2,
        dueDate: futureDueDate(),
        status: 'published',
        shareToken: seededQuizShareToken,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.updatedQuiz).toBeDefined();
  });

  it('401 — rejects unauthenticated request', async () => {
    const res = await request(app)
      .patch(`/api/quizzes/${seededQuizId}`)
      .send({ quizTitle: 'Hacked Title' });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/student/quiz-access  — student accesses a quiz by share token
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/student/quiz-access', () => {

  it('200 — student can access a valid published quiz', async () => {
    const res = await request(app)
      .post('/api/student/quiz-access')
      .set(authHeader(studentToken))
      .send({ token: seededQuizShareToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.shareToken).toBeDefined();
    expect(res.body.maxAttempts).toBeDefined();
    expect(res.body.totalAttempts).toBeDefined();
    expect(res.body.attemptId).toBeDefined();
  });

  it('404 — returns 404 for a non-existent token', async () => {
    const res = await request(app)
      .post('/api/student/quiz-access')
      .set(authHeader(studentToken))
      .send({ token: 'doesnotexist' });

    expect(res.status).toBe(404);
  });

  it('401 — rejects unauthenticated request', async () => {
    const res = await request(app)
      .post('/api/student/quiz-access')
      .send({ token: seededQuizShareToken });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/student/quiz-submit  — student submits a quiz attempt
// ─────────────────────────────────────────────────────────────────────────────

describe('PATCH /api/student/quiz-submit', () => {

  it('200 — successfully submits a quiz attempt', async () => {
    // First access the quiz to create an attempt
    const accessRes = await request(app)
      .post('/api/student/quiz-access')
      .set(authHeader(studentToken))
      .send({ token: seededQuizShareToken });

    expect(accessRes.status).toBe(200);

    //access quiz to get questions
    const quizRes = await request(app)
      .get(`/api/student/quiz-access/${seededQuizShareToken}`)
      .set(authHeader(studentToken))
    
    const { quiz, questions, attemptId, attemptStart } = quizRes.body;
    
    expect(quizRes.status).toBe(200);
    expect(quiz).toBeDefined();
    expect(questions).toBeDefined();
    expect(attemptStart).toBeDefined();
    expect(attemptId).toBeDefined();

    // Build an answers object: { [questionId]: selectedAnswer }
    const answers: Record<string, string> = {};
    for (const q of questions) {
      answers[q.id] = q.optionA; // just pick option A for every question
    }

    const res = await request(app)
      .patch('/api/student/quiz-submit')
      .set(authHeader(studentToken))
      .send({ quiz, questions, answers, attemptId });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/attempt received/i);
  });

  it('401 — rejects unauthenticated request', async () => {
    const res = await request(app)
      .patch('/api/student/quiz-submit')
      .send({ quiz: {}, questions: [], answers: {}, attemptId: 1 });

    expect(res.status).toBe(401);
  });
});
