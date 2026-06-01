import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { userBasedRateLimiter } from '../middlewares/userBasedRateLimiter.middleware.js';
import { classesInputValidator } from '../middlewares/classesValidator.middleware.js';
import { ClassesRepository } from '../repository/ClassesRepository.js';
import { ClassStudentsRepository } from '../repository/ClassStudentsRepo.js';
import { UserRepository } from '../repository/UserRepository.js';

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

// get user classes and students in each class
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

      return res.status(200).json({ success: true, classArray });
    } catch (error) {
      next(error);
    }
  },
);

// find student by email
router.get(
  '/:classId/students/find',
  verifyToken,
  userBasedRateLimiter(60, 10),
  async (req, res, next) => {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized action',
      });
    }
    const classId = Number(req.params.classId);
    if (!classId || isNaN(classId))
      return res
        .status(400)
        .json({ success: false, message: 'Invalid class ID' });
    const email = req.query.email;
    if (!email || typeof email !== 'string')
      return res.status(400).json({ success: false, message: 'Invalid email' });

    try {
      const student = await UserRepository.selectUserByEmail(email);
      if (!student)
        return res
          .status(404)
          .json({ success: false, message: 'This user does not exist' });
      if (student.role === 'teacher' || student.role === 'admin')
        return res
          .status(400)
          .json({ success: false, message: 'Unavaliable email' });

      const inClass = await ClassStudentsRepository.checkIfUserInClass(
        student.id,
        classId,
      );
      if (inClass)
        return res
          .status(400)
          .json({ success: false, message: 'User is already in class' });

      return res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
