
import type { Request, Response, NextFunction } from "express";
import { body, validationResult } from 'express-validator';

//TO DO: .escape() is filtering apostrophes, which is kinda useful so fix that

export const quizInputValidator = [
  body('quizTitle').trim().notEmpty().withMessage('Quiz title is required').escape(),
  body('description').optional().trim(),
  body('shareToken').trim().notEmpty().withMessage('Share token is required').isAlphanumeric().toLowerCase().escape(),
  body('timeLimit').trim().notEmpty().withMessage('Time limit is required').isInt({min: 1}).withMessage('Time limit must be a valid number'),
  body('maxAttempts').optional().trim().isInt({min:1}).withMessage('Max attempts must be a valid number'),
  body('dueDate').trim().notEmpty().withMessage('Due date is required').isISO8601().withMessage('Invalid date format')
    .custom((value)=>{
      if(new Date(value) <= new Date()){
        throw new Error('Due date must be set in the future');
      }
      return true;
    }),
  body('status').trim().notEmpty().withMessage('Status is required').toLowerCase().escape(),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  }
];