import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { verifyTeacher } from '../middlewares/teacherAuthz.middleware.js';
import { userBasedRateLimiter } from '../middlewares/userBasedRateLimiter.middleware.js';
import { UserQuizzesRepository } from '../repository/UserQuizzesRepository.js';
import { ClassStudentsRepository } from '../repository/ClassStudentsRepo.js';

const router = express.Router();

// get data for teacher home dashboard
router.get(
  '/',
  verifyToken,
  verifyTeacher,
  userBasedRateLimiter(10, 40),
  async (req, res, next) => {
    try {
      const activeExams = await UserQuizzesRepository.countActiveExams(
        req.user.id,
      );
      const totalStudents = await ClassStudentsRepository.studentTotalCount(
        req.user.id,
      );
      const closing = await UserQuizzesRepository.getClosingSoonExams(
        req.user.id,
      );
    } catch (error) {
      next(error);
    }
  },
);

export default router;
