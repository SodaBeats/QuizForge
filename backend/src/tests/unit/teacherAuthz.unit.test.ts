// verifyTeacher (middlewares/teacherAuthz.middleware.ts): the three gates in
// order — role → suspension → isVerified — before next(). The isVerified
// gate is the backend half of the "awaiting verification" feature: a valid
// login is not enough for a teacher until an admin flips the flag (the
// frontend parks those accounts on /awaiting-verification).

import type { Request, Response, NextFunction } from 'express';
import { verifyTeacher } from '../../middlewares/teacherAuthz.middleware.js';

interface MockResponse {
  res: Response;
  statusCode: () => number;
  body: () => unknown;
}

function makeRes(): MockResponse {
  const state = { statusCode: 0, body: undefined as unknown };
  const res = {
    status(code: number) {
      state.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      state.body = payload;
      return res;
    },
  } as unknown as Response;

  return {
    res,
    statusCode: () => state.statusCode,
    body: () => state.body,
  };
}

function makeReq(user: Record<string, unknown>): Request {
  return {
    user: {
      id: 1,
      email: 'teacher@test.com',
      role: 'teacher',
      status: 'active',
      isVerified: true,
      ...user,
    },
  } as unknown as Request;
}

function run(user: Record<string, unknown>) {
  const { res, statusCode, body } = makeRes();
  let nextCalls = 0;
  const next: NextFunction = () => {
    nextCalls += 1;
  };

  verifyTeacher(makeReq(user), res, next);

  return { nextCalls, statusCode: statusCode(), body: body() };
}

describe('verifyTeacher', () => {
  it('blocks a non-teacher with 403 Forbidden action', () => {
    const result = run({ role: 'student' });

    expect(result.nextCalls).toBe(0);
    expect(result.statusCode).toBe(403);
    expect(result.body).toEqual({ success: false, message: 'Forbidden action' });
  });

  it('blocks a suspended teacher with 403 Account Suspended', () => {
    const result = run({ status: 'suspended' });

    expect(result.nextCalls).toBe(0);
    expect(result.statusCode).toBe(403);
    expect(result.body).toEqual({ success: false, message: 'Account Suspended' });
  });

  it('blocks an unverified teacher with 403 Awaiting verification', () => {
    const result = run({ isVerified: false });

    expect(result.nextCalls).toBe(0);
    expect(result.statusCode).toBe(403);
    expect(result.body).toEqual({
      success: false,
      message: 'Awaiting verification',
    });
  });

  it('reports suspension before verification when both apply', () => {
    const result = run({ status: 'suspended', isVerified: false });

    expect(result.nextCalls).toBe(0);
    expect(result.statusCode).toBe(403);
    expect(result.body).toEqual({ success: false, message: 'Account Suspended' });
  });

  it('lets a verified, active teacher through', () => {
    const result = run({});

    expect(result.nextCalls).toBe(1);
    expect(result.statusCode).toBe(0); // no res.status() call happened
    expect(result.body).toBeUndefined();
  });
});
