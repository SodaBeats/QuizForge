// src/tests/integration/setup/testHelpers.ts
//
// Shared utilities used across all test files.
//
// WHY THIS FILE EXISTS:
//   Most protected routes need a valid JWT in the Authorization header.
//   Instead of copy-pasting a login call in every test file, we centralise
//   it here.  loginAs() fires a real POST /auth/login and returns the token.

import request from 'supertest';
import app from '../../../server.js';

// ── Types ────────────────────────────────────────────────────────────────────

export interface LoginResult {
  accessToken: string;
  userId: number;
  role: string;
}

// ── loginAs ──────────────────────────────────────────────────────────────────
//
// Logs in with the given credentials and returns the access token.
// Throws if login fails so you get a clear error, not a cryptic 401 later.

export async function loginAs(
  email: string,
  password: string
): Promise<LoginResult> {
  const res = await request(app)
    .post('/auth/login')
    .send({ email, password });

  if (res.status !== 200) {
    throw new Error(
      `[testHelpers.loginAs] Login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`
    );
  }

  return {
    accessToken: res.body.accessToken,
    userId: res.body.user.id,
    role: res.body.user.role,
  };
}

// ── Pre-baked credentials ─────────────────────────────────────────────────────
// These match the users seeded in globalSetup.ts

export const TEACHER_CREDS = {
  email: 'teacher@test.com',
  password: 'TeacherPass1!',
};

export const STUDENT_CREDS = {
  email: 'student@test.com',
  password: 'StudentPass1!',
};

// ── authHeader ────────────────────────────────────────────────────────────────
// Convenience wrapper — pass directly into supertest's .set()

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export const generateShareToken = (length: number = 6): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz23456789'; // Removed confusing O, 0, I, 1, L
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};