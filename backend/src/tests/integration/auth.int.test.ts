// src/tests/integration/auth.int.test.ts
//
// Tests for:
//   POST /auth/signup
//   POST /auth/login
//   POST /auth/logout
//   POST /auth/refresh

import request from 'supertest';
import app from '../../server.js';
import { db, pool } from '../../db/db.js';

afterAll(async () => {
  if(pool) await pool.end();
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/signup
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /auth/signup', () => {

  it('503 — reports that signup is unavailable', async () => {
    const res = await request(app).post('/auth/signup');

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/signup is currently unavailable/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/login
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /auth/login', () => {

  it('200 — returns accessToken and user info on valid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'teacher@test.com', password: 'TeacherPass1!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user).toMatchObject({
      email: 'teacher@test.com',
      role: 'teacher',
    });
  });

  it('200 — sets an httpOnly refreshToken cookie', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'teacher@test.com', password: 'TeacherPass1!' });

    // supertest exposes Set-Cookie headers as an array
    const cookies: string[] = res.get('Set-Cookie') ?? [];
    const refreshCookie = cookies.find((c: string) => c.startsWith('refreshToken='));

    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toMatch(/HttpOnly/i);
  });

  it('401 — rejects wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'teacher@test.com', password: 'WrongPassword!' });

    expect(res.status).toBe(401);
  });

  it('401 — rejects non-existent email', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@test.com', password: 'SomePass1!' });

    expect(res.status).toBe(401);
  });

  it('400 — rejects missing email or password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'teacher@test.com' }); // no password

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/logout
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /auth/logout', () => {

  it('200 — clears the refreshToken cookie', async () => {
    // First log in to get a real cookie
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'teacher@test.com', password: 'TeacherPass1!' });

    const cookies: string[] = loginRes.get('Set-Cookie') ?? [];

    const res = await request(app)
      .post('/auth/logout')
      .set('Cookie', cookies);

    expect(res.status).toBe(200);

    // After logout the cookie should be cleared (Max-Age=0 or Expires in the past)
    const logoutCookies: string[] = res.get('Set-Cookie') ?? [];
    const cleared = logoutCookies.find((c: string) => c.startsWith('refreshToken='));
    expect(cleared).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/i);
  });

  it('200 — still returns 200 with no cookie (graceful noop)', async () => {
    const res = await request(app).post('/auth/logout');
    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /auth/refresh
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /auth/refresh', () => {

  it('200 — issues a new accessToken given a valid refreshToken cookie', async () => {
    // Log in first to get a real refresh token cookie
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'teacher@test.com', password: 'TeacherPass1!' });

    const cookies: string[] = loginRes.get('Set-Cookie') ?? [];

    const res = await request(app)
      .post('/auth/refresh')
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBeDefined();
  });

  it('401 — rejects request with no refresh token cookie', async () => {
    const res = await request(app).post('/auth/refresh');
    expect(res.status).toBe(401);
  });
});
