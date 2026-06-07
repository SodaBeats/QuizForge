import type { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

//TO DO: .escape() is filtering apostrophes, which is kinda useful so fix that

export const quizInputValidator = [
  body('quizTitle')
    .trim()
    .blacklist('<>{}\\[\\]')
    .notEmpty()
    .withMessage('Quiz title is required'),
  body('description').optional().trim().blacklist('<>{}\\[\\]'),
  body('shareToken')
    .trim()
    .blacklist('<>{}\\[\\]')
    .notEmpty()
    .withMessage('Share token is required')
    .isAlphanumeric()
    .toLowerCase(),
  body('accessibility')
    .trim()
    .notEmpty()
    .default('anyone')
    .isIn(['anyone', 'restricted'])
    .withMessage('Invalid accessibility value'),
  body('maxAttempts')
    .optional()
    .trim()
    .isInt({ min: 1 })
    .withMessage('Max attempts must be a valid number'),
  body('dueDate')
    .trim()
    .notEmpty()
    .withMessage('Due date is required')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Due date must be set in the future');
      }
      return true;
    }),
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Status is required')
    .toLowerCase()
    .isIn(['draft', 'published'])
    .withMessage('Status must be Draft or Published'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];
