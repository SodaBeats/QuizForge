import express from 'express';
import { RefreshTokenRepository } from '../repository/RefreshTokenRepository.js';
import { clearRefreshCookie } from '../utils/cookieOptions.util.js';

const router = express.Router();

router.post('/', async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken;

  try {
    if (refreshToken) {
      await RefreshTokenRepository.deleteRefreshToken(refreshToken);
    }

    clearRefreshCookie(res);
    return res.status(200).send();
  } catch (err) {
    return next(err);
  }
});

export default router;
