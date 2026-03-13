import express from 'express';
import {eq} from 'drizzle-orm';
import { db } from '../db/db.js';
import { questions_db, quiz_questions_db, quizzes_db } from '../db/schema.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', verifyToken, async(req, res, next)=>{
  try{

    const {token} = req.body;

    if(!token || typeof (token) !== 'string'){
      return res.status(400).json({success: false, message: 'Invalid token'});
    }

    //fetch the quiz info
    const [quiz] = await db.select({
      id: quizzes_db.id,
      userId: quizzes_db.user_id,
      quizTitle: quizzes_db.quiz_title,
      quizDescription: quizzes_db.quiz_description,
      shareToken: quizzes_db.share_token,
      timeLimit: quizzes_db.time_limit,
      maxAttempts: quizzes_db.max_attempts,
      dueDate: quizzes_db.due_date,
    })
      .from(quizzes_db)
      .where(eq(quizzes_db.share_token, token.toLowerCase()));

      //check if quiz exists
    if(!quiz){
      return res.status(404).json({success: false, message: "Quiz does not exist"});
    }

    //check quiz deadline
    const deadline = new Date(quiz.dueDate);
    if(Date.now() > deadline.getTime()){
      return res.status(400).json({success: false, message: "Quiz is past the deadline"});
    }
    
    //fetch questions related to quiz
    const questions = await db.select({
      id: questions_db.id,
      questionText: questions_db.question_text,
      questionType: questions_db.question_type,
      correctAnswer: questions_db.correct_answer,
      optionA: questions_db.option_a,
      optionB: questions_db.option_b,
      optionC: questions_db.option_c,
      optionD: questions_db.option_d,
    })
      .from(questions_db)
      .innerJoin(quiz_questions_db, eq(questions_db.id, quiz_questions_db.question_id))
      .where(eq(quiz_questions_db.quiz_id, quiz.id))

    if(questions.length < 1){
      return res.status(404).json({success: false, message: 'This quiz has no questions'});
    }

    return res.status(200).json({
      success: true,
      message: "Quiz Found!",
      quiz: quiz,
      questions: questions,
    });

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
    
    //fetch the quiz info
    const [quiz] = await db.select()
      .from(quizzes_db)
      .where(eq(quizzes_db.share_token, quizToken.toLowerCase()));

    if(!quiz){
      return res.status(404).json({success: false, message: "Quiz does not exist"});
    }

    //fetch questions related to quiz
    const questions = await db.select({
      id: questions_db.id,
      questionText: questions_db.question_text,
      questionType: questions_db.question_type,
      correctAnswer: questions_db.correct_answer,
      optionA: questions_db.option_a,
      optionB: questions_db.option_b,
      optionC: questions_db.option_c,
      optionD: questions_db.option_d,
    })
      .from(questions_db)
      .innerJoin(quiz_questions_db, eq(questions_db.id, quiz_questions_db.question_id))
      .where(eq(quiz_questions_db.quiz_id, quiz.id))

    if(questions.length < 1){
      return res.status(404).json({success: false, message: 'This quiz has no questions'});
    }

    return res.status(200).json({
      success: true,
      message: "Quiz Found!",
      quiz: quiz,
      questions: questions
    });

  }catch(error){
    next(error);
  }
});

export default router;