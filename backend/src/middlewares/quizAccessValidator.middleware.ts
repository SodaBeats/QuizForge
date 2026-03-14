
import type { Request, Response, NextFunction } from 'express';
import { param, validationResult } from 'express-validator';

export const quizAccessValidator = [
  param('quizToken').trim().notEmpty().withMessage('Please input a token').isAlphanumeric().toLowerCase(),
  param('userId').trim().notEmpty().withMessage('You must be logged in').isInt({min: 1}),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];