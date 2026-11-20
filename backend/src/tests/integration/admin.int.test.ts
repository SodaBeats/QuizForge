import request from 'supertest';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import app from '../../server.js';
import { db } from '../../db/db.js';
import {
  quiz_attempts_db,
  quizzes_db,
  refresh_tokens,
  users,
} from '../../db/schema.js';
import {
  ADMIN_CREDS,
  STUDENT_CREDS,
  TEACHER_CREDS,
  authHeader,
  loginAs,
} from './setup/testHelpers.js';

const unknownId = 999999999;
const testSuffix = Date.now();

let adminToken: string;
let studentToken: string;
let teacherToken: string;
let suspendedTeacherId: number;
let lifecycleUserId: number;
let cascadeUserId: number;
let cascadeQuizId: number;
let cascadeAttemptId: number;

const endpoints = [
  { name: 'stats', method: 'get', path: '/admin/stats' },
  { name: 'users', method: 'get', path: '/admin/users?role=teacher&verified=false&page=1&limit=10' },
  { name: 'create user', method: 'post', path: '/admin/users', body: {
    first_name: 'Auth',
    last_name: 'Probe',
    email: `auth-probe-${testSuffix}@test.com`,
    password: 'ProbePass1!',
    role: 'student',
    is_verified: false,
  } },
  { name: 'update user', method: 'patch', path: `/admin/users/${unknownId}`, body: { role: 'student' } },
  { name: 'suspend user', method: 'post', path: `/admin/users/${unknownId}/suspend` },
  { name: 'unsuspend user', method: 'post', path: `/admin/users/${unknownId}/unsuspend` },
  { name: 'delete user', method: 'delete', path: `/admin/users/${unknownId}` },
  { name: 'exams', method: 'get', path: '/admin/exams?page=1&limit=10&sort=created_at_desc' },
] as const;

beforeAll(async () => {
  const [adminLogin, studentLogin, teacherLogin] = await Promise.all([
    loginAs(ADMIN_CREDS.email, ADMIN_CREDS.password),
    loginAs(STUDENT_CREDS.email, STUDENT_CREDS.password),
    loginAs(TEACHER_CREDS.email, TEACHER_CREDS.password),
  ]);

  adminToken = adminLogin.accessToken;
  studentToken = studentLogin.accessToken;
  teacherToken = teacherLogin.accessToken;

  const passwordHash = await bcrypt.hash('SuspendedPass1!', 1);
  const [suspendedTeacher] = await db
    .insert(users)
    .values({
      first_name: 'Suspended',
      last_name: 'Teacher',
      email: `suspended-${testSuffix}@test.com`,
      password_hash: passwordHash,
      role: 'teacher',
      is_verified: false,
      suspended_at: new Date(),
    })
    .returning({ id: users.id });

  if (!suspendedTeacher) throw new Error('Failed to seed suspended teacher');
  suspendedTeacherId = suspendedTeacher.id;
});

afterAll(async () => {
  const ids = [suspendedTeacherId, lifecycleUserId, cascadeUserId].filter(
    (id): id is number => Number.isInteger(id),
  );
  for (const id of ids) {
    await db.delete(users).where(eq(users.id, id));
  }
});

describe('admin route authorization', () => {
  it.each(endpoints)('$name returns 401 without a token', async (endpoint) => {
    const call = request(app)[endpoint.method](endpoint.path);
    if ('body' in endpoint && endpoint.body) call.send(endpoint.body);
    const res = await call;
    expect(res.status).toBe(401);
  });

  it.each(endpoints)('$name returns 403 for a student', async (endpoint) => {
    const call = request(app)[endpoint.method](endpoint.path).set(
      authHeader(studentToken),
    );
    if ('body' in endpoint && endpoint.body) call.send(endpoint.body);
    const res = await call;
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ success: false, message: 'Forbidden action' });
  });

  it.each(endpoints)('$name returns 403 for a teacher', async (endpoint) => {
    const call = request(app)[endpoint.method](endpoint.path).set(
      authHeader(teacherToken),
    );
    if ('body' in endpoint && endpoint.body) call.send(endpoint.body);
    const res = await call;
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ success: false, message: 'Forbidden action' });
  });
});

describe('admin stats and user lists', () => {
  it('GET /admin/stats returns the exact pinned shape', async () => {
    const res = await request(app)
      .get('/admin/stats')
      .set(authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(Object.keys(res.body).sort()).toEqual(
      ['exams', 'pendingTeachers', 'students', 'teachers'].sort(),
    );
    expect(res.body).toEqual({
      teachers: expect.any(Number),
      students: expect.any(Number),
      exams: expect.any(Number),
      pendingTeachers: expect.any(Number),
    });
  });

  it('GET /admin/users filters role and excludes suspended unverified teachers', async () => {
    const res = await request(app)
      .get('/admin/users')
      .query({ role: 'teacher', verified: 'false', page: 1, limit: 10 })
      .set(authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');
    expect(res.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          role: 'teacher',
          is_verified: false,
          suspended_at: null,
        }),
      ]),
    );
    expect(res.body.data.every((user: any) =>
      user.role === 'teacher' &&
      user.is_verified === false &&
      user.suspended_at === null
    )).toBe(true);
    expect(
      res.body.data.some((user: any) => user.id === suspendedTeacherId),
    ).toBe(false);
  });

  it('GET /admin/users supports role filtering and pagination', async () => {
    const res = await request(app)
      .get('/admin/users')
      .query({ role: 'student', page: 1, limit: 2 })
      .set(authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.every((user: any) => user.role === 'student')).toBe(true);
    expect(res.body.total).toBeGreaterThanOrEqual(2);
  });
});

describe('admin user mutations', () => {
  it('POST /admin/users creates a user', async () => {
    const email = `created-${testSuffix}@test.com`;
    const res = await request(app)
      .post('/admin/users')
      .set(authHeader(adminToken))
      .send({
        first_name: 'Created',
        last_name: 'Admin User',
        email,
        password: 'CreatedPass1!',
        role: 'teacher',
        is_verified: false,
      });

    expect([200, 201]).toContain(res.status);

    const [created] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email));
    if (!created) throw new Error('Created user was not returned');
    lifecycleUserId = created.id;
  });

  it('POST /admin/users rejects missing fields and duplicate email', async () => {
    const missing = await request(app)
      .post('/admin/users')
      .set(authHeader(adminToken))
      .send({ first_name: 'Missing' });
    expect(missing.status).toBe(400);
    expect(missing.body).toEqual({ message: 'Missing required fields' });

    const duplicate = await request(app)
      .post('/admin/users')
      .set(authHeader(adminToken))
      .send({
        first_name: 'Duplicate',
        last_name: 'User',
        email: 'ADMIN@TEST.COM',
        password: 'DuplicatePass1!',
        role: 'student',
        is_verified: false,
      });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body).toEqual({ message: 'Email already exists' });
  });

  it('PATCH /admin/users/:id updates role and verification', async () => {
    if (!lifecycleUserId) throw new Error('Lifecycle user was not created');

    const res = await request(app)
      .patch(`/admin/users/${lifecycleUserId}`)
      .set(authHeader(adminToken))
      .send({ role: 'student', is_verified: true });
    expect([200, 201]).toContain(res.status);

    const [updated] = await db
      .select({ role: users.role, is_verified: users.is_verified })
      .from(users)
      .where(eq(users.id, lifecycleUserId));
    expect(updated).toEqual({ role: 'student', is_verified: true });

    const invalid = await request(app)
      .patch(`/admin/users/${lifecycleUserId}`)
      .set(authHeader(adminToken))
      .send({ role: 'owner' });
    expect(invalid.status).toBe(400);
    expect(invalid.body).toEqual({ message: 'Invalid role' });

    const unknown = await request(app)
      .patch(`/admin/users/${unknownId}`)
      .set(authHeader(adminToken))
      .send({ role: 'student' });
    expect(unknown.status).toBe(404);
    expect(unknown.body).toEqual({ message: 'User not found' });
  });

  it('POST suspend deletes refresh tokens and blocks login; unsuspend restores login', async () => {
    if (!lifecycleUserId) throw new Error('Lifecycle user was not created');
    const email = `suspend-${testSuffix}@test.com`;
    const passwordHash = await bcrypt.hash('SuspendPass1!', 1);
    const [target] = await db
      .insert(users)
      .values({
        first_name: 'Suspend',
        last_name: 'Target',
        email,
        password_hash: passwordHash,
        role: 'student',
        is_verified: true,
      })
      .returning({ id: users.id });
    if (!target) throw new Error('Failed to seed suspend target');

    const login = await request(app)
      .post('/auth/login')
      .send({ email, password: 'SuspendPass1!' });
    expect(login.status).toBe(200);
    const cookies: string[] = login.get('Set-Cookie') ?? [];
    const refreshCookie = cookies.find((cookie) => cookie.startsWith('refreshToken='));
    expect(refreshCookie).toBeDefined();

    const suspend = await request(app)
      .post(`/admin/users/${target.id}/suspend`)
      .set(authHeader(adminToken));
    expect([200, 201]).toContain(suspend.status);

    const tokenRows = await db
      .select({ id: refresh_tokens.id })
      .from(refresh_tokens)
      .where(eq(refresh_tokens.user_id, target.id));
    expect(tokenRows).toHaveLength(0);

    const suspendedLogin = await request(app)
      .post('/auth/login')
      .send({ email, password: 'SuspendPass1!' });
    expect(suspendedLogin.status).toBe(403);
    expect(suspendedLogin.body.message).toBe('Account suspended');

    const refresh = await request(app)
      .post('/auth/refresh')
      .set('Cookie', cookies);
    expect(refresh.status).toBe(401);

    const unsuspend = await request(app)
      .post(`/admin/users/${target.id}/unsuspend`)
      .set(authHeader(adminToken));
    expect([200, 201]).toContain(unsuspend.status);

    const restoredLogin = await request(app)
      .post('/auth/login')
      .send({ email, password: 'SuspendPass1!' });
    expect(restoredLogin.status).toBe(200);

    await db.delete(users).where(eq(users.id, target.id));
  });

  it('DELETE /admin/users/:id cascades quizzes and attempts', async () => {
    const passwordHash = await bcrypt.hash('CascadePass1!', 1);
    const [owner] = await db
      .insert(users)
      .values({
        first_name: 'Cascade',
        last_name: 'Owner',
        email: `cascade-owner-${testSuffix}@test.com`,
        password_hash: passwordHash,
        role: 'teacher',
        is_verified: true,
      })
      .returning({ id: users.id });
    if (!owner) throw new Error('Failed to seed cascade owner');
    cascadeUserId = owner.id;

    const [quiz] = await db
      .insert(quizzes_db)
      .values({
        user_id: owner.id,
        quiz_title: 'Admin Cascade Quiz',
        status: 'published',
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
      .returning({ id: quizzes_db.id });
    if (!quiz) throw new Error('Failed to seed cascade quiz');
    cascadeQuizId = quiz.id;

    const [attempt] = await db
      .insert(quiz_attempts_db)
      .values({
        quiz_id: quiz.id,
        user_id: owner.id,
        score: 1,
        raw_score: 1,
        max_possible_score: 1,
        status: 'completed',
      })
      .returning({ id: quiz_attempts_db.id });
    if (!attempt) throw new Error('Failed to seed cascade attempt');
    cascadeAttemptId = attempt.id;

    const res = await request(app)
      .delete(`/admin/users/${owner.id}`)
      .set(authHeader(adminToken));
    expect([200, 204]).toContain(res.status);

    const [deletedUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, owner.id));
    const [deletedQuiz] = await db
      .select({ id: quizzes_db.id })
      .from(quizzes_db)
      .where(eq(quizzes_db.id, quiz.id));
    const [deletedAttempt] = await db
      .select({ id: quiz_attempts_db.id })
      .from(quiz_attempts_db)
      .where(eq(quiz_attempts_db.id, attempt.id));

    expect(deletedUser).toBeUndefined();
    expect(deletedQuiz).toBeUndefined();
    expect(deletedAttempt).toBeUndefined();
  });

  it('returns 404 for unknown user mutations', async () => {
    const suspend = await request(app)
      .post(`/admin/users/${unknownId}/suspend`)
      .set(authHeader(adminToken));
    expect(suspend.status).toBe(404);
    expect(suspend.body).toEqual({ message: 'User not found' });

    const unsuspend = await request(app)
      .post(`/admin/users/${unknownId}/unsuspend`)
      .set(authHeader(adminToken));
    expect(unsuspend.status).toBe(404);
    expect(unsuspend.body).toEqual({ message: 'User not found' });

    const deleteRes = await request(app)
      .delete(`/admin/users/${unknownId}`)
      .set(authHeader(adminToken));
    expect(deleteRes.status).toBe(404);
    expect(deleteRes.body).toEqual({ message: 'User not found' });
  });
});

describe('admin exams', () => {
  it('GET /admin/exams returns the pinned shape ordered by created_at DESC', async () => {
    const res = await request(app)
      .get('/admin/exams')
      .query({ page: 1, limit: 10, sort: 'created_at_desc' })
      .set(authHeader(adminToken));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('total');

    for (const exam of res.body.data) {
      expect(exam).toEqual(expect.objectContaining({
        id: expect.any(Number),
        quiz_title: expect.any(String),
        status: expect.any(String),
        due_date: expect.anything(),
        created_at: expect.any(String),
        teacher: {
          first_name: expect.any(String),
          last_name: expect.any(String),
        },
      }));
    }

    const timestamps = res.body.data.map((exam: any) =>
      new Date(exam.created_at).getTime(),
    );
    expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a));
  });
});
