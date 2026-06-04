import type { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const classesInputValidator = [
  body('className')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Classname must not exceed 100 characters')
    .matches(/^[^<>{}[\]]+$/)
    .withMessage('Class name contains invalid characters')
    .notEmpty()
    .withMessage('Class name is required'),
  body('subject')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Subject must not exceed 100 characters')
    .matches(/^[^<>{}[\]]+$/)
    .withMessage('Subject contains invalid characters')
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
