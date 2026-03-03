
import express from 'express';
import { db } from '../db/db.js';
import { quiz_questions_db, quizzes_db } from '../db/schema.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', verifyToken, async(req, res, next)=>{
  //TODO: QUIZ MAKE ENDPOINT
  const {fileId, title, description, timeLimit, dueDate} = req.body;
  const {id, role} = req.user;
  
  //verify contents
  if(!fileId || !title){
    return res.status(400).json({success: false, message: 'Incomplete Input'});
  }
  if(role!=='teacher'){
    return res.status(400).json({success: false, message: 'Unauthorized action'});
  }

  try{
    const [newQuiz] = await db.insert(quizzes_db).values({
      user_id: id,
      quiz_title: req.body.title.trim(),
      quiz_description: req.body.description?.trim(),
      share_token: req.body.shareToken.trim().toLowerCase(),
      time_limit: req.body.timeLimit,
      due_date: new Date(req.body.dueDate)
    }).returning({id: quizzes_db.id});

    const newQuizId = newQuiz?.id;
    const questionIds = req.body.questionIds;

    const junctionRows = questionIds.map((qId: Number)=>({
      quiz_id: newQuizId,
      question_id: qId
    }));

    // TO DO: FINISH THIS
    await db.insert(quiz_questions_db).values(junctionRows);


    res.status(200).json({success: true, message: 'Quiz Forged!'});
  }catch(error){
    next(error);
  }

});

export default router;