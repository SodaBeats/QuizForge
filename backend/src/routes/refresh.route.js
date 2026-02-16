import express from 'express';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import { refresh_tokens, users } from '../db/schema.js';

const router = express.Router();

router.post('/', async (req, res, next)=>{

  //get the refresh token from the cookie
  const refreshToken = req.cookies.refreshToken;

  //verify if there is a refresh token
  if(!refreshToken){
    return res.status(401).send();
  }

  //verify if refresh token is untampered
  try{
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    //get the refresh token from the database
    const [activeRefresh] = await db.select().from(refresh_tokens).where(eq(refresh_tokens.token, refreshToken));

    //check if it exists, returns a failure if none
    if(!activeRefresh){
      const error = new Error('Token not found');
      error.status = 401;
      throw error;
    }

    //get the owner of the refresh token
    const [user] = await db.select().from(users).where(eq(users.id, activeRefresh.user_id));

    //check if user exists
    if (!user) {
      const error = new Error('User does not exist');
      error.status = 401;
      throw error;
    }

    //generate new access token
    const newAccessToken = jwt.sign(
      {id: user.id, email: user.email, role: user.role},
      process.env.JWT_SECRET,
      {expiresIn: '15m'}
    );

    //send the new access token back to the frontend
    res.status(200).json({success: true, accessToken: newAccessToken});

  }
  catch(error){
    //if jwt verify fails (expired or tampered), it throws an error and lands here
    if(error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError'){
      return res.status(401).json({message: 'Invalid or expired refresh token'});
    }
    next(error);
  }

});

export default router;