import 'dotenv/config';
import type { Response } from 'express';

const isProd = process.env.NODE_ENV === 'production';

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const refreshCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
  path: '/',
  partitioned: isProd,
};

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    ...refreshCookieOptions,
    maxAge: REFRESH_MAX_AGE_MS,
  });
}

export function clearRefreshCookie(res: Response): void {
  // Clear the new partitioned cookie
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);

  // Clear the old non-partitioned cookie that existing users still have
  if (isProd) {
    res.clearCookie(REFRESH_COOKIE_NAME, {
      ...refreshCookieOptions,
      partitioned: false,
    });
  }
}
