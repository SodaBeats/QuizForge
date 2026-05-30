import type { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const classesInputValidator = [
  body('className')
    .trim()
    .blacklist('<>{}[]')
    .notEmpty()
    .withMessage('Class name is required'),
  body('subject')
    .trim()
    .blacklist('<>{}[]')
    .notEmpty()
    .withMessage('Subject is required'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];
