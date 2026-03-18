import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { signupValidator } from '../middlewares/signupValidator.middleware.js';
import { hashPassword, formatNewUser } from '../services/signup.service.js';
import { UserRepository } from '../repository/UserRepository.js';

const router = express.Router();

router.post('/', 
  signupValidator,
  async (req: Request, res: Response, next: NextFunction)=>{

  const { email, password } = req.body;

  try{

    //check if user exists
    const existingUser = await UserRepository.checkEmailUniqeness(email);
    if(existingUser.length > 0){
      return res.status(400).json({success: false, error: 'Email already exists'});
    }

    //hash password
    const passwordHash = await hashPassword(password);
    // format data for database insertion
    const userData = formatNewUser(req.body, passwordHash);

    //save to database
    await UserRepository.registerUser(userData);

    res.status(201).json({ 
        success: true, 
        message: 'Account created successfully. Please log in.' 
    });

  }catch(error){
    next(error);
  }

});

export default router;