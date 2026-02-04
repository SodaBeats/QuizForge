import express from 'express';
import { db } from '../db/db.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { loginValidator } from '../middlewares/loginValidator.middleware.js';
import { refresh_tokens } from '../db/schema.js';

const router = express.Router();

router.post('/', 
  loginValidator,
  async (req, res, next)=>{

    const { email, password } = req.body;


    try{

      //check if the account exists
      const [existingUser] = await db.select().from(users).where(eq(users.email, email));
      if(!existingUser){
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
      
      //check if password is correct
      const validPassword = await bcrypt.compare(password, users.password_hash);
      if (!validPassword) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }
      
      //generate access token
      const accessToken = jwt.sign(
        {id: existingUser.id, email: existingUser.email, role: existingUser.role},
        process.env.JWT_SECRET,
        {expiresIn: '15m'}
      );

      //generate refresh token
      const refreshToken = jwt.sign(
        {id: existingUser.id},
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn: '7d'}
      );
      const expiresAt = new Date(Date.now() + 7*24*60*60*1000); // 7 days

      //insert refresh token to database
      const newRefreshToken = await db.insert(refresh_tokens).values({
        user_id: existingUser.id,
        token: refreshToken,
        expires_at: expiresAt,
        revoked: false
      });


    }catch(error){
      next(error);
    }

  }
);