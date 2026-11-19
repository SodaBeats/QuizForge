import express from 'express';
import { RefreshTokenRepository } from '../repository/RefreshTokenRepository.js';
import { refreshCookieOptions } from '../utils/cookieOptions.util.js';

const router = express.Router();

router.post('/', async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  try {
    if (refreshToken) {
      await RefreshTokenRepository.deleteRefreshToken(refreshToken);
    }

    return res
      .clearCookie('refreshToken', refreshCookieOptions)
      .status(200)
      .send();
  } catch (err) {
    return next(err);
  }
});

export default router;
