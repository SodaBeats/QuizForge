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
};

export function setRefreshCookie(res: Response, token: string): void {
  if (!isProd) {
    res.cookie(REFRESH_COOKIE_NAME, token, {
      ...refreshCookieOptions,
      maxAge: REFRESH_MAX_AGE_MS,
    });
    return;
  }

  res.append(
    'Set-Cookie',
    [
      `${REFRESH_COOKIE_NAME}=${encodeURIComponent(token)}`,
      'Path=/',
      `Max-Age=${REFRESH_MAX_AGE_MS / 1000}`,
      'HttpOnly',
      'Secure',
      'SameSite=None',
      'Partitioned',
    ].join('; '),
  );
}

export function clearRefreshCookie(res: Response): void {
  if (!isProd) {
    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
    return;
  }

  // Clear the new partitioned cookie
  res.append(
    'Set-Cookie',
    `${REFRESH_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None; Partitioned`,
  );
  // Clear the old non-partitioned cookie that existing users still have
  res.append(
    'Set-Cookie',
    `${REFRESH_COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None`,
  );
}
