import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { quizAccessValidator } from '../middlewares/quizAccessValidator.middleware.js';
import { UserQuizzesRepository } from '../repository/UserQuizzesRepository.js';
import { QuestionsRepository } from '../repository/QuestionsRepository.js';
import { QuizAttemptsRepo } from '../repository/QuizAttemptsRepository.js';

const router = express.Router();

//get quiz info, get user total attempt,
router.post('/',
  verifyToken,
  quizAccessValidator,
  async (req: Request, res: Response, next: NextFunction) => {
    
  try {
    const { token } = req.body;
    const userId = Number(req.user.id);

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid token' });
    }

    // FETCH QUIZ + ATTEMPT COUNT
    const quiz = await UserQuizzesRepository.getQuizAndAttemptCount(token, userId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz does not exist" });
    }

    // CHECK DEADLINE
    if (Date.now() > new Date(quiz.dueDate).getTime()) {
      return res.status(400).json({ success: false, message: "Quiz is past the deadline" });
    }

    // CHECK ATTEMPTS
    if (quiz.totalAttempts >= quiz.maxAttempts) {
      return res.status(400).json({
        success: false,
        message: "You have used all attempts for this quiz"
      });
    }

    // FETCH QUESTIONS RELATED TO QUIZ
    const questions = await QuestionsRepository.getQuestionsRelatedToQuiz(quiz.id);

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'This quiz has no questions'
      });
    }

    const formattedInsertData = {
      quiz_id: quiz.id,
      user_id: userId,
      score: 0,
      status: 'in-progress',
    };

    // CREATE ATTEMPT
    const attempt = await QuizAttemptsRepo.createAttempt(formattedInsertData);
    if(!attempt){
      return res.status(500).json({success: false, message: 'Failed to create attempt'});
    }

    return res.status(200).json({
      success: true,
      message: "Quiz Found!",
      quiz,
      questions,
      attemptStart: attempt?.attemptStart,
      attemptId: attempt?.attemptId,
      totalAttempts: quiz.totalAttempts
    });

  } catch (error) {
    next(error);
  }
});

//get and questions by quiz token, just in case
router.get('/:quizToken', verifyToken, async(req, res, next)=>{

  const {quizToken} = req.params;
  const userId = req.user.id;

  console.log('refetch ran');

  if(!quizToken || typeof (quizToken) !== 'string'){
    return res.status(400).json({success: false, message: 'Invalid token'});
  }

  try{
    
    // FETCH QUIZ + ATTEMPT COUNT
    const quiz = await UserQuizzesRepository.getQuizAndAttemptCount(quizToken, userId)

    if(!quiz){
      return res.status(404).json({success: false, message: "Quiz does not exist"});
    }

    //check quiz deadline
    const deadline = new Date(quiz.dueDate);
    if(Date.now() > deadline.getTime()){
      return res.status(400).json({success: false, message: "Quiz is past the deadline"});
    }

    // CHECK ATTEMPTS
    if (quiz.totalAttempts >= quiz.maxAttempts) {
      return res.status(400).json({
        success: false,
        message: "You have used all attempts for this quiz"
      });
    }

    //fetch questions related to quiz
    const questions = await QuestionsRepository.getQuestionsRelatedToQuiz(quiz.id);

    if(questions.length < 1){
      return res.status(404).json({success: false, message: 'This quiz has no questions'});
    }

    //fetch attempt start
    const attemptStart = await QuizAttemptsRepo.getExistingAttempt(quiz.id, userId);

    return res.status(200).json({
      success: true,
      message: "Quiz Found!",
      quiz: quiz,
      questions: questions,
      attemptStart: attemptStart?.start,
      attemptId: attemptStart?.id,
      totalAttempts: quiz.totalAttempts,
    });

  }catch(error){
    next(error);
  }
});


export default router;