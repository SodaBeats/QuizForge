import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { userBasedRateLimiter } from '../middlewares/userBasedRateLimiter.middleware.js';
import { classesInputValidator } from '../middlewares/classesValidator.middleware.js';
import { ClassesRepository } from '../repository/Classes.Repository.js';

const router = express.Router();

// Create a class
router.post(
  '/',
  verifyToken,
  userBasedRateLimiter(5, 5),
  classesInputValidator,
  async (req: Request, res: Response, next: NextFunction) => {
    if (req.user.role !== 'teacher') {
      return res
        .status(403)
        .json({ success: false, message: 'Unauthorized action' });
    }
    try {
      const dataToInsert = {
        teacher_id: req.user.id,
        class_name: req.body.className,
        class_subject: req.body.subject,
      };
      const newClass = await ClassesRepository.insertClassToDb(dataToInsert);
      if (!newClass) {
        return res
          .status(500)
          .json({ success: false, message: 'Failed to create class' });
      }
      return res.status(201).json({ success: true, newClass });
    } catch (error) {
      return next(error);
    }
  },
);

export default router;
