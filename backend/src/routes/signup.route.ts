import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { db } from '../db/db.js';
import { users } from '../db/schema.js';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { signupValidator } from '../middlewares/signupValidator.middleware.js';
import { hashPassword, formatNewUser } from '../services/signup.service.js';

const router = express.Router();

router.post('/', 
  signupValidator,
  async (req: Request, res: Response, next: NextFunction)=>{

  const { email, password } = req.body;

  try{

    //check if user exists
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if(existingUser.length > 0){
      return res.status(400).json({success: false, error: 'Email already exists'});
    }

    //hash password and prepare data for data insertion
    const passwordHash = await hashPassword(password);
    const userData = formatNewUser(req.body, passwordHash);

    //save to database
    await db.insert(users).values(userData);

    res.status(201).json({ 
        success: true, 
        message: 'Account created successfully. Please log in.' 
    });

  }catch(error){
    next(error);
  }

});

export default router;