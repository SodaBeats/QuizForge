import express from 'express';
import {eq, and} from 'drizzle-orm';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { quiz_attempts_db } from '../db/schema.js';
import { db } from '../db/db.js';
import { getScore } from '../services/getScore.service.js';
import { QuizAttemptsRepo } from '../repository/QuizAttemptsRepository.js';


const router = express.Router();

//QUIZ SUBMIT
//update attempt with score and marked "complete"
router.patch('/', verifyToken, async(req, res, next)=> {
  const {questions, answers, quiz, attemptId} = req.body;
  const score = getScore(questions, answers);

  const formattedData = {
    score: score,
    status: 'completed',
  };
  
  try{
    await QuizAttemptsRepo.updateAttempt(formattedData, quiz.id, attemptId);
    res.status(201).json({success: true, message: 'Attempt received!'});
    
  }catch(error){
    next(error);
  }
});




export default router;