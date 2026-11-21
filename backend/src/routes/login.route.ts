import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import 'dotenv/config';
import { loginValidator } from '../middlewares/loginValidator.middleware.js';
import { handleLogin } from '../services/login.service.js';
import { refreshCookieOptions } from '../utils/cookieOptions.util.js';

const router = express.Router();

router.post(
  '/',
  loginValidator,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      //service for verifying and generating tokens
      const credentials = await handleLogin(req.body);

      res.cookie('refreshToken', credentials.refreshToken, {
        ...refreshCookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.json({
        success: true,
        accessToken: credentials.accessToken,
        user: {
          id: credentials.user.id,
          email: credentials.user.email,
          first_name: credentials.user.first_name,
          role: credentials.user.role,
        },
      });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
