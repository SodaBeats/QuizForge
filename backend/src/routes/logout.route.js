import express from 'express';
import { db } from '../db/db.js';
import { eq } from 'drizzle-orm';
import 'dotenv/config';
import { refresh_tokens } from '../db/schema.js';

const router = express.Router();

router.post('/', async (req, res, next)=>{

  const refreshToken = req.cookies.refreshToken;

  try{
    if(refreshToken){
      await db.delete(refresh_tokens).where(eq(refresh_tokens.token, refreshToken));
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path:'/' //path must be the same as the declared path when creating the cookie
    });

    res.status(200).send();

  }catch(err){
    next(err);
  }

});

export default router;