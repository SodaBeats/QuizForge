
import type { Request, Response, NextFunction } from "express";
import { body, validationResult } from 'express-validator';

export const quizInputValidator = [
  body('title').trim().notEmpty().withMessage('Quiz title is required').escape(),
  body('description').trim().escape().optional(),
  body('shareToken').trim().notEmpty().withMessage('Share token is required').isAlphanumeric().escape(),
  body('timeLimit').trim().notEmpty().withMessage('Time limit is required').isInt({min: 1}),
  body('dueDate').trim().notEmpty().withMessage('Due date is required')
    .isISO8601().withMessage('Invalid date format')
    .custom((value)=>{
      if(value <= new Date()){
        throw new Error('Due date must be set in the future');
      }
      return true;
    }),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);

    if(!errors.isEmpty()){
      return res.status(400).json({errors: errors.array()});
    }
    next();
  }
];