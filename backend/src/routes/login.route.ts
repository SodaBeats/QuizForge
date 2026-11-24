import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import 'dotenv/config';
import { setRefreshCookie } from '../utils/cookieOptions.util.js';
import { loginValidator } from '../middlewares/loginValidator.middleware.js';
import { handleLogin } from '../services/login.service.js';

const router = express.Router();

router.post(
  '/',
  loginValidator,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      //service for verifying and generating tokens
      const credentials = await handleLogin(req.body);

      setRefreshCookie(res, credentials.refreshToken);

      return res.json({
        success: true,
        accessToken: credentials.accessToken,
        user: credentials.user,
      });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
