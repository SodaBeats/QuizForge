import { body, validationResult } from 'express-validator';

export const signupValidator = [
  body('first_name').trim().notEmpty().withMessage('First name is required').escape(),
  body('last_name').trim().notEmpty().withMessage('Last name is required').escape(),
  body('email').trim().isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('password').isLength({min: 6}).withMessage('Password is too short').escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
      return res.status(400).json({errors: errors.array()});
    }
    next();
  }
];