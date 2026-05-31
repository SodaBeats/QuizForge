import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { userBasedRateLimiter } from '../middlewares/userBasedRateLimiter.middleware.js';
import { classesInputValidator } from '../middlewares/classesValidator.middleware.js';
import { ClassesRepository } from '../repository/ClassesRepository.js';
import { ClassStudentsRepository } from '../repository/ClassStudentsRepo.js';
import { db } from '../db/db.js';

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

router.get(
  '/',
  verifyToken,
  userBasedRateLimiter(5, 5),
  async (req, res, next) => {
    if (req.user.role !== 'teacher') {
      return res
        .status(403)
        .json({ success: false, message: 'Unauthorized action' });
    }
    try {
      const classes = await ClassesRepository.getUserClasses(req.user.id);
      const students = await ClassStudentsRepository.getAllStudentsOfEachClass(
        classes.map((c) => c.id),
      );
      const classArray = classes.map((c) => ({
        ...c,
        students: students.filter((s) => s.classId === c.id),
      }));

      console.log(classArray);

      return res.status(200).json({ success: true, classArray });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
