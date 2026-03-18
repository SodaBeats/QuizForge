
import type { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const quizAccessValidator = [
  body('token').trim().notEmpty().withMessage('Please input a token')
    .isLength({min: 6}).withMessage('Must be a 6 character token').isAlphanumeric().withMessage('No special characters').toLowerCase(),
    (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];