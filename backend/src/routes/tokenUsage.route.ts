import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { verifyTeacher } from '../middlewares/teacherAuthz.middleware.js';
import { userBasedRateLimiter } from '../middlewares/userBasedRateLimiter.middleware.js';
import { TokenUsageRepo } from '../repository/TokenUsageRepo.js';
import { DAILY_LIMITS, today } from '../services/tokenBudget.service.js';

const router = express.Router();

router.use(verifyToken, verifyTeacher);

// Today's token budget for the signed-in teacher. The quiz maker headers
// (FileViewer = embedding, QuestionEditor = generation) read this so the
// numbers match what assertBudget() enforces.
router.get('/', userBasedRateLimiter(10, 50), async (req, res, next) => {
  try {
    const usage = await TokenUsageRepo.getUsage(req.user.id, today());

    return res.status(200).json({
      embedding: {
        used: usage?.embedding ?? 0,
        limit: DAILY_LIMITS.embedding,
      },
      generation: {
        used: usage?.generation ?? 0,
        limit: DAILY_LIMITS.generation,
      },
    });
  } catch (err) {
    return next(err);
  }
});

export default router;
