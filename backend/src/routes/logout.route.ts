import express from 'express';
import { RefreshTokenRepository } from '../repository/RefreshTokenRepository.js';

const router = express.Router();

router.post('/', async (req, res, next)=>{

  const refreshToken = req.cookies.refreshToken;

  try{
    if(refreshToken){
      await RefreshTokenRepository.deleteRefreshToken(refreshToken);
    }

    return res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite:'lax',
      path:'/' //path must be the same as the declared path when creating the cookie
    })
    .status(200)
    .send();

  }catch(err){
    return next(err);
  }

});

export default router;