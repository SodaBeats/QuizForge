import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { verifyTeacher } from '../middlewares/teacherAuthz.middleware.js';
import { userBasedRateLimiter } from '../middlewares/userBasedRateLimiter.middleware.js';
import { ClassStudentsRepository } from '../repository/ClassStudentsRepo.js';
import { UserQuizzesRepository } from '../repository/UserQuizzesRepository.js';

const router = express.Router();

const PAGE_SIZE = 5;

function parsePage(value: unknown): number | null {
  if (value === undefined) return 1;
  if (typeof value !== 'string' || !/^-?\d+$/.test(value)) return null;

  const page = Number(value);
  return Number.isSafeInteger(page) ? Math.max(page, 1) : null;
}

router.use(
  verifyToken,
  verifyTeacher,
  userBasedRateLimiter(10, 40),
);

router.get(
  '/stats',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const [activeExams, totalStudents, averageScore, drafts] =
        await Promise.all([
          UserQuizzesRepository.countActiveExams(req.user.id),
          ClassStudentsRepository.studentTotalCount(req.user.id),
          UserQuizzesRepository.getAverageScoreUsingBestAttempts(req.user.id),
          UserQuizzesRepository.countDraftQuizzes(req.user.id),
        ]);

      return res.status(200).json({
        activeExams,
        totalStudents,
        averageScore,
        drafts,
      });
    } catch (error) {
      return next(error);
    }
  },
);

router.get(
  '/active-exams',
  async (req: Request, res: Response, next: NextFunction) => {
    const page = parsePage(req.query.page);
    if (page === null) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid pagination parameters' });
    }

    try {
      const result = await UserQuizzesRepository.getActiveExams(
        req.user.id,
        page,
        PAGE_SIZE,
      );
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  },
);

router.get(
  '/expiring',
  async (req: Request, res: Response, next: NextFunction) => {
    const page = parsePage(req.query.page);
    if (page === null) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid pagination parameters' });
    }

    try {
      const result = await UserQuizzesRepository.getExpiringExams(
        req.user.id,
        page,
        PAGE_SIZE,
      );
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
