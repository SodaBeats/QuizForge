import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { db } from '../db/db.js';
import { users } from '../db/schema.js';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { signupValidator } from '../middlewares/signupValidator.middleware.js';

const router = express.Router();

router.post('/', 
  signupValidator,
  async (req: Request, res: Response, next: NextFunction)=>{

  const { first_name, last_name, email, password, role } = req.body;

  try{

    const existingUser = await db.select().from(users).where(eq(users.email, email));

    if(existingUser.length > 0){
      return res.status(400).json({success: false, error: 'Email already exists'});
    }
    const password_hash = await bcrypt.hash(password, 10);

    const newUser = await db.insert(users).values({
      first_name: first_name,
      last_name: last_name,
      email: email,
      password_hash: password_hash,
      role: role || 'student'
    });

    res.status(201).json({ 
        success: true, 
        message: 'Account created successfully. Please log in.' 
    });

  }catch(error){
    next(error);
  }

});

export default router;