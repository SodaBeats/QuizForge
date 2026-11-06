import request from 'supertest';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import app from '../../server.js';
import { db, pool } from '../../db/db.js';
import {
  classes_db,
  quiz_access_db,
  quiz_attempts_db,
  quizzes_db,
  refresh_tokens,
  students_classes_db,
  users,
} from '../../db/schema.js';
import {
  authHeader,
  loginAs,
  STUDENT2_CREDS,
  STUDENT_CREDS,
  TEACHER_CREDS,
} from './setup/testHelpers.js';

let dashboardTeacherId: number;
let dashboardTeacherToken: string;
let student1Id: number;
let studentToken: string;
let student2Id: number;
let quizIds: number[];
let foreignQuizId: number;
let emptyTeacherId: number;
let emptyTeacherToken: string;

const dueInHours = (hours: number) =>
  new Date(Date.now() + hours * 60 * 60 * 1000);

beforeAll(async () => {
  const dashboardEmail = `dashboard-${Date.now()}@test.com`;
  const passwordHash = await bcrypt.hash('DashboardPass1!', 1);
  const [dashboardTeacher] = await db
    .insert(users)
    .values({
      first_name: 'Dashboard',
      last_name: 'Teacher',
      email: dashboardEmail,
      password_hash: passwordHash,
      role: 'teacher',
    })
    .returning({ id: users.id });

  if (!dashboardTeacher) throw new Error('Failed to seed dashboard teacher');
  dashboardTeacherId = dashboardTeacher.id;

  const emptyEmail = `dashboard-empty-${Date.now()}@test.com`;
  const [emptyTeacher] = await db
    .insert(users)
    .values({
      first_name: 'Empty',
      last_name: 'Teacher',
      email: emptyEmail,
      password_hash: passwordHash,
      role: 'teacher',
    })
    .returning({ id: users.id });
  if (!emptyTeacher) throw new Error('Failed to seed empty dashboard teacher');
  emptyTeacherId = emptyTeacher.id;

  const [
    dashboardLogin,
    student1Login,
    student2Login,
    emptyTeacherLogin,
  ] =
    await Promise.all([
      loginAs(dashboardEmail, 'DashboardPass1!'),
      loginAs(STUDENT_CREDS.email, STUDENT_CREDS.password),
      loginAs(STUDENT2_CREDS.email, STUDENT2_CREDS.password),
      loginAs(emptyEmail, 'DashboardPass1!'),
    ]);

  dashboardTeacherToken = dashboardLogin.accessToken;
  emptyTeacherToken = emptyTeacherLogin.accessToken;
  studentToken = student1Login.accessToken;
  student1Id = student1Login.userId;
  student2Id = student2Login.userId;

  const classes = await db
    .insert(classes_db)
    .values([
      {
        teacher_id: dashboardTeacherId,
        class_name: 'Dashboard Class A',
        class_subject: 'Math',
      },
      {
        teacher_id: dashboardTeacherId,
        class_name: 'Dashboard Class B',
        class_subject: 'Science',
      },
    ])
    .returning({ id: classes_db.id });

  const [classA, classB] = classes;
  if (!classA || !classB) throw new Error('Failed to seed dashboard classes');

  await db.insert(students_classes_db).values([
    { class_id: classA.id, student_id: student1Id },
    { class_id: classB.id, student_id: student1Id },
    { class_id: classB.id, student_id: student2Id },
  ]);

  const quizzes = await db
    .insert(quizzes_db)
    .values([
      {
        user_id: dashboardTeacherId,
        quiz_title: 'Dashboard Restricted Active',
        status: 'published',
        accessibility: 'restricted',
        due_date: dueInHours(36),
      },
      {
        user_id: dashboardTeacherId,
        quiz_title: 'Dashboard Boundary Active',
        status: 'published',
        due_date: dueInHours(72),
      },
      ...[5, 6, 7, 8].map((hours) => ({
        user_id: dashboardTeacherId,
        quiz_title: `Dashboard Active ${hours}`,
        status: 'published',
        due_date: dueInHours(hours * 24),
      })),
      {
        user_id: dashboardTeacherId,
        quiz_title: 'Dashboard Expired',
        status: 'published',
        due_date: dueInHours(-24),
      },
      {
        user_id: dashboardTeacherId,
        quiz_title: 'Dashboard Draft',
        status: 'draft',
        due_date: dueInHours(24),
      },
    ])
    .returning({
      id: quizzes_db.id,
      quizTitle: quizzes_db.quiz_title,
      dueDate: quizzes_db.due_date,
    });

  quizIds = quizzes
    .filter(
      (quiz) =>
        quiz.quizTitle.startsWith('Dashboard Active') ||
        [
          'Dashboard Restricted Active',
          'Dashboard Boundary Active',
        ].includes(quiz.quizTitle),
    )
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .map((quiz) => quiz.id);
  const restrictedQuiz = quizzes.find(
    (quiz) => quiz.quizTitle === 'Dashboard Restricted Active',
  );
  const boundaryQuiz = quizzes.find(
    (quiz) => quiz.quizTitle === 'Dashboard Boundary Active',
  );
  const secondScoredQuiz = quizzes.find(
    (quiz) => quiz.quizTitle === 'Dashboard Active 5',
  );
  if (!restrictedQuiz || !boundaryQuiz || !secondScoredQuiz) {
    throw new Error('Failed to seed dashboard quizzes');
  }

  await db.insert(quiz_access_db).values([
    { quiz_id: restrictedQuiz.id, class_id: classA.id },
    { quiz_id: restrictedQuiz.id, class_id: classB.id },
  ]);
  await db.insert(quiz_attempts_db).values([
    {
      quiz_id: restrictedQuiz.id,
      user_id: student1Id,
      score: 40,
      status: 'completed',
    },
    {
      quiz_id: restrictedQuiz.id,
      user_id: student1Id,
      score: 90,
      status: 'completed',
    },
    {
      quiz_id: restrictedQuiz.id,
      user_id: student2Id,
      score: 100,
      status: 'in-progress',
    },
    {
      quiz_id: secondScoredQuiz.id,
      user_id: student1Id,
      score: 50,
      status: 'completed',
    },
    {
      quiz_id: secondScoredQuiz.id,
      user_id: student2Id,
      score: 71,
      status: 'completed',
    },
  ]);

  const [otherTeacher] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, TEACHER_CREDS.email));
  if (!otherTeacher) throw new Error('Failed to find foreign-owner teacher');

  const [foreignQuiz] = await db
    .insert(quizzes_db)
    .values({
      user_id: otherTeacher.id,
      quiz_title: 'Dashboard Foreign Owner',
      status: 'published',
      due_date: dueInHours(48),
    })
    .returning({ id: quizzes_db.id });
  if (!foreignQuiz) throw new Error('Failed to seed foreign-owner quiz');
  foreignQuizId = foreignQuiz.id;
});

afterAll(async () => {
  if (foreignQuizId) {
    await db.delete(quizzes_db).where(eq(quizzes_db.id, foreignQuizId));
  }
  if (dashboardTeacherId) {
    await db
      .delete(refresh_tokens)
      .where(eq(refresh_tokens.user_id, dashboardTeacherId));
  }
  if (emptyTeacherId) {
    await db
      .delete(refresh_tokens)
      .where(eq(refresh_tokens.user_id, emptyTeacherId));
  }
  if (dashboardTeacherId) {
    await db.delete(users).where(eq(users.id, dashboardTeacherId));
  }
  if (emptyTeacherId) {
    await db.delete(users).where(eq(users.id, emptyTeacherId));
  }
  if (pool) await pool.end();
});

describe('teacher dashboard endpoints', () => {
  it('requires an authenticated teacher', async () => {
    const unauthenticated = await request(app).get('/api/dashboard/stats');
    expect(unauthenticated.status).toBe(401);

    const student = await request(app)
      .get('/api/dashboard/stats')
      .set(authHeader(studentToken));
    expect(student.status).toBe(403);
  });

  it('returns zeroed stats and empty one-page lists for a teacher with no data', async () => {
    const stats = await request(app)
      .get('/api/dashboard/stats')
      .set(authHeader(emptyTeacherToken));
    const active = await request(app)
      .get('/api/dashboard/active-exams')
      .set(authHeader(emptyTeacherToken));
    const expiring = await request(app)
      .get('/api/dashboard/expiring')
      .set(authHeader(emptyTeacherToken));

    expect(stats.body).toEqual({
      activeExams: 0,
      totalStudents: 0,
      averageScore: 0,
      drafts: 0,
    });
    expect(active.body).toEqual({
      items: [],
      total: 0,
      page: 1,
      pageSize: 5,
      totalPages: 1,
    });
    expect(expiring.body).toEqual(active.body);
  });

  it("returns teacher-scoped stats with each student's best completed score", async () => {
    const response = await request(app)
      .get('/api/dashboard/stats')
      .set(authHeader(dashboardTeacherToken));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      activeExams: 6,
      totalStudents: 2,
      averageScore: 75.3,
      drafts: 1,
    });
  });

  it('returns active exams in five-item pages with roster submission counts', async () => {
    const firstPage = await request(app)
      .get('/api/dashboard/active-exams?page=1')
      .set(authHeader(dashboardTeacherToken));
    const secondPage = await request(app)
      .get('/api/dashboard/active-exams?page=2')
      .set(authHeader(dashboardTeacherToken));

    expect(firstPage.status).toBe(200);
    expect(firstPage.body).toMatchObject({
      total: 6,
      page: 1,
      pageSize: 5,
      totalPages: 2,
    });
    expect(firstPage.body.items).toHaveLength(5);
    expect(secondPage.body).toMatchObject({
      total: 6,
      page: 2,
      pageSize: 5,
      totalPages: 2,
    });
    expect(secondPage.body.items).toHaveLength(1);

    const allItems = [...firstPage.body.items, ...secondPage.body.items];
    expect(allItems.map((quiz) => quiz.id)).toEqual(quizIds);
    expect(allItems.map((quiz) => quiz.id)).not.toContain(foreignQuizId);

    expect(firstPage.body.items[0]).toMatchObject({
      quizTitle: 'Dashboard Restricted Active',
      assignedCount: 2,
      submittedCount: 1,
    });
    expect(firstPage.body.items[1]).toMatchObject({
      quizTitle: 'Dashboard Boundary Active',
      assignedCount: 0,
      submittedCount: 0,
    });
  });

  it('clamps pages to valid bounds and rejects malformed page values', async () => {
    const belowRange = await request(app)
      .get('/api/dashboard/active-exams?page=-5')
      .set(authHeader(dashboardTeacherToken));
    const aboveRange = await request(app)
      .get('/api/dashboard/active-exams?page=99')
      .set(authHeader(dashboardTeacherToken));
    const malformed = await request(app)
      .get('/api/dashboard/active-exams?page=1.5')
      .set(authHeader(dashboardTeacherToken));

    expect(belowRange.body.page).toBe(1);
    expect(aboveRange.body.page).toBe(2);
    expect(malformed.status).toBe(400);
  });

  it('returns only published exams due within the inclusive 72-hour window', async () => {
    const response = await request(app)
      .get('/api/dashboard/expiring?page=1')
      .set(authHeader(dashboardTeacherToken));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      total: 2,
      page: 1,
      pageSize: 5,
      totalPages: 1,
    });
    expect(
      response.body.items.map((quiz: { quizTitle: string }) => quiz.quizTitle),
    ).toEqual(['Dashboard Restricted Active', 'Dashboard Boundary Active']);
  });
});
