import express from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { quiz_attempts_db } from '../db/schema.js';
import { db } from '../db/db.js';
import { getScore } from '../services/getScore.service.js';


const router = express.Router();

router.post('/', verifyToken, async(req, res, next)=> {
  const {questions, answers, quiz} = req.body;
  const score = getScore(questions, answers);

  try{
    await db.insert(quiz_attempts_db).values({
      quiz_id: quiz.id,
      user_id: req.user.id,
      score: score,
    })

    res.status(201).json({success: true, message: 'Attempt received!'});
    
  }catch(error){
    next(error);
  }

});




export default router;