import 'dotenv/config';

const isProd = process.env.NODE_ENV === 'production';

export const refreshCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
  path: '/',
};
