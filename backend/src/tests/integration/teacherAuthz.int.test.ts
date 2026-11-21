// End-to-end coverage for the isVerified gate in verifyTeacher
// (middlewares/teacherAuthz.middleware.ts): a valid login is not enough for
// a teacher until an admin flips is_verified. Both teachers here are fresh
// fixtures with their own rate-limiter keys, so this file doesn't compete
// with the other suites for the shared per-user request budget.

import request from 'supertest';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import app from '../../server.js';
import { db, pool } from '../../db/db.js';
import { users } from '../../db/schema.js';
import { authHeader, loginAs } from './setup/testHelpers.js';

const testSuffix = Date.now();

let unverifiedTeacherId: number;
let verifiedTeacherId: number;

const unverifiedEmail = `unverified-${testSuffix}@test.com`;
const verifiedEmail = `verified-${testSuffix}@test.com`;
const password = 'VerifyGatePass1!';

beforeAll(async () => {
  const passwordHash = await bcrypt.hash(password, 1);

  const [unverified, verified] = await db
    .insert(users)
    .values([
      {
        first_name: 'Unverified',
        last_name: 'Teacher',
        email: unverifiedEmail,
        password_hash: passwordHash,
        role: 'teacher',
        is_verified: false,
      },
      {
        first_name: 'Verified',
        last_name: 'Teacher',
        email: verifiedEmail,
        password_hash: passwordHash,
        role: 'teacher',
        is_verified: true,
      },
    ])
    .returning({ id: users.id });

  if (!unverified || !verified) {
    throw new Error('Failed to seed verification fixtures');
  }
  unverifiedTeacherId = unverified.id;
  verifiedTeacherId = verified.id;
});

afterAll(async () => {
  const ids = [unverifiedTeacherId, verifiedTeacherId].filter(
    (id): id is number => Number.isInteger(id),
  );
  for (const id of ids) {
    await db.delete(users).where(eq(users.id, id));
  }
  if (pool) await pool.end();
});

describe('teacher verification enforcement (verifyTeacher)', () => {
  it('403s an unverified teacher on a teacher API route', async () => {
    const login = await loginAs(unverifiedEmail, password);

    const res = await request(app)
      .get('/api/dashboard/stats')
      .set(authHeader(login.accessToken));

    expect(res.status).toBe(403);
    expect(res.body).toEqual({ success: false, message: 'Awaiting verification' });
  });

  it('still lets a verified teacher through', async () => {
    const login = await loginAs(verifiedEmail, password);

    const res = await request(app)
      .get('/api/dashboard/stats')
      .set(authHeader(login.accessToken));

    expect(res.status).toBe(200);
    // shape only — averageScore is null for a teacher with no attempts
    expect(Object.keys(res.body).sort()).toEqual(
      ['activeExams', 'averageScore', 'drafts', 'totalStudents'].sort(),
    );
  });
});
