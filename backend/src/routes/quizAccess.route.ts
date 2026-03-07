import express from 'express';
import {eq} from 'drizzle-orm';
import { db } from '../db/db.js';
import { quizzes_db } from '../db/schema.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', verifyToken, async(req, res, next)=>{
  try{

    const {token} = req.body;
    const [quiz] = await db.select().from(quizzes_db).where(eq(quizzes_db.share_token, token.toLowerCase()));

    if(!quiz){
      return res.status(404).json({success: false, message: "Quiz does not exist"});
    }

    return res.status(200).json({success: true, message: "Quiz Found!", quiz: quiz});


  }catch(error){
    next(error);
  }
});

router.get('/:quizToken', verifyToken, async(req, res, next)=>{

  const {quizToken} = req.params;

  if(!quizToken || typeof (quizToken) !== 'string'){
    return res.status(400).json({success: false, message: 'Invalid token'});
  }

  try{
    
    const [quiz] = await db.select().from(quizzes_db).where(eq(quizzes_db.share_token, quizToken));
    if(!quiz){
      return res.status(404).json({success: false, message: "Quiz does not exist"});
    }

    return res.status(200).json({success: true, message: "Quiz Found!", quiz: quiz});

  }catch(error){
    next(error);
  }
});

export default router;