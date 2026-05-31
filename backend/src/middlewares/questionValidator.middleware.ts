import type { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const questionInputValidator = [
  body('questionText')
    .trim()
    .blacklist('<>{}\\[\\]')
    .notEmpty()
    .withMessage('Question text is required'),
  body('questionType')
    .notEmpty()
    .withMessage('Question type must not be empty'),
  body('optionA').optional().trim().blacklist('<>{}[]'),
  body('optionB').optional().trim().blacklist('<>{}[]'),
  body('optionC').optional().trim().blacklist('<>{}[]'),
  body('optionD').optional().trim().blacklist('<>{}[]'),
  body('correctAnswer')
    .optional()
    .trim()
    .blacklist('<>{}[]')
    .isString()
    .toLowerCase(),
  body('timeLimit')
    .trim()
    .notEmpty()
    .withMessage('Time Limit is required')
    .isInt({ min: 5 })
    .withMessage('Time limit must at least be 5 seconds'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
