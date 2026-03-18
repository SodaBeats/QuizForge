
//TO DO: VALIDATE QUESTION INPUT

import type { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const questionInputValidator = [
  body('questionText').trim().notEmpty().withMessage('Question text is required'),
  body('questionType').notEmpty().withMessage('Question type must not be empty'),
  body('optionA').optional().trim(),
  body('optionB').optional().trim(),
  body('optionC').optional().trim(),
  body('optionD').optional().trim(),
  body('correctAnswer').optional().trim().isString().toLowerCase(),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
      return res.status(400).json({errors: errors.array()});
    }
    next();
  }
];