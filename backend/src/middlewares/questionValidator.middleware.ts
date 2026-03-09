
//TO DO: VALIDATE QUESTION INPUT

import type { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const questionInputValidator = [
  body('questionText').trim().notEmpty().withMessage('Question text is required').escape(),
  body('questionType').notEmpty().withMessage('Question type must not be empty'),
  body('optionA').optional().trim().escape(),
  body('optionB').optional().trim().escape(),
  body('optionC').optional().trim().escape(),
  body('optionD').optional().trim().escape(),
  body('correctAnswer').optional().trim().isString().escape(),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()){
      return res.status(400).json({errors: errors.array()});
    }
    next();
  }
];