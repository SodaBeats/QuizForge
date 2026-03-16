import express from 'express';
import {eq} from 'drizzle-orm';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { quiz_attempts_db } from '../db/schema.js';
import { db } from '../db/db.js';
import { getScore } from '../services/getScore.service.js';


const router = express.Router();

router.patch('/', verifyToken, async(req, res, next)=> {
  const {questions, answers, quiz} = req.body;
  const score = getScore(questions, answers);
  
  try{
    await db.update(quiz_attempts_db).set({
      score: score,
      status: 'completed'
    }).where(eq(quiz_attempts_db.quiz_id, quiz.id));

    res.status(201).json({success: true, message: 'Attempt received!'});
    
  }catch(error){
    next(error);
  }

});




export default router;