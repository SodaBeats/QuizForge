import express from 'express';
import { db } from '../db/db.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { getScore } from '../services/getScore.service.js';
import { QuizAttemptsRepo } from '../repository/QuizAttemptsRepository.js';
import { AttemptAnswersRepo } from '../repository/AttemptsAnswersRepo.js';
import type { Question } from '../types/questionType.js';


const router = express.Router();

//QUIZ SUBMIT
//update attempt with score and marked "complete"
router.patch('/', verifyToken, async(req, res, next)=> {
  const {questions, answers, quiz, attemptId} = req.body;
  const userId = req.user.id;

  if(!questions || !answers || !quiz?.id || !attemptId){
    return res.status(400).json({success: false, message: 'Missing required fields'});
  }
  const score = getScore(questions, answers);

  const formattedData = {
    score: score,
    status: 'completed',
  };
  const formattedAttemptAnswers = questions.map((q: Question) => {
    return {
      quiz_id: quiz.id,
      attempt_id: attemptId,
      user_id: userId,
      question_id: q.id,
      chosen_answer: answers[q.id] ?? null,
      correct_answer: q.correctAnswer,
      is_correct: (answers[q.id] ?? null) === q.correctAnswer,
    }
  });
  
  try{
    await db.transaction(async(tx) => {
      await QuizAttemptsRepo.updateAttempt(formattedData, quiz.id, attemptId, userId, tx);
      await AttemptAnswersRepo.insertAttemptAnswer(formattedAttemptAnswers, tx);
    });
    return res.status(200).json({success: true, message: 'Attempt received!'});
    
  }catch(error){
    return next(error);
  }
});




export default router;