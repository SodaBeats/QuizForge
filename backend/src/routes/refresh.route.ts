import express from 'express';
import jwt from 'jsonwebtoken';
import { handleAccessTokenGeneration } from '../services/refresh.service.js';

const router = express.Router();

router.post('/', async (req, res, next)=>{

  //get the refresh token from the cookie
  const refreshToken = req.cookies.refreshToken;

  //verify if there is a refresh token
  if(!refreshToken){
    return res.status(401).send();
  }

  try{

    //service for access token generation
    const newAccessToken = await handleAccessTokenGeneration(refreshToken);
    const userInfo = jwt.verify(newAccessToken, process.env.JWT_SECRET);

    //send the new access token back to the frontend
    res.status(200).json({ success: true, accessToken: newAccessToken, userInfo: userInfo });

  }
  catch(error){
    //if jwt verify fails (expired or tampered), it throws an error and lands here
    if(error instanceof Error){
      if(error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError'){
        return res.status(401).json({message: 'Invalid or expired refresh token'});
      }
    }
    next(error);
  }

});

export default router;