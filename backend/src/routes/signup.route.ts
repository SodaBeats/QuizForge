import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { signupValidator } from '../middlewares/signupValidator.middleware.js';
import { hashPassword, formatNewUser } from '../services/signup.service.js';
import { UserRepository } from '../repository/UserRepository.js';

const router = express.Router();

router.post('/', 
  signupValidator,
  async (req: Request, res: Response, next: NextFunction)=>{

  const { password } = req.body;

  try{
    //hash password
    const passwordHash = await hashPassword(password);
    // format data for database insertion
    const userData = formatNewUser(req.body, passwordHash);

    //save to database
    await UserRepository.registerUser(userData);

    return res.status(201).json({ 
        success: true, 
        message: 'Account created successfully. Please log in.' 
    });

  }catch(error: any){
    if(error.cause?.code === '23505'){
      return res.status(409).json({success: false, message: "This email is already in use"});
    }
    return next(error);
  }

});

export default router;