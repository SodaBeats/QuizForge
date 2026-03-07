
import express from 'express';
import { eq, count } from 'drizzle-orm';
import { db } from '../db/db.js';
import { questions_db, quiz_questions_db, quizzes_db } from '../db/schema.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', verifyToken, async(req, res, next)=>{
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

    await db.insert(quiz_questions_db).values(junctionRows);


    res.status(200).json({success: true, message: 'Quiz Forged!'});
  }catch(error){
    next(error);
  }

});

router.get('/', verifyToken, async(req, res, next)=>{
  
  const userId = req.user.id;
  try{
    //count all questions assigned to a quiz

    const userQuizzes = await db.select({
      id: quizzes_db.id,
      quizTitle: quizzes_db.quiz_title,
      description: quizzes_db.quiz_description,
      shareToken: quizzes_db.share_token,
      timeLimit: quizzes_db.time_limit,
      dueDate: quizzes_db.due_date,
      questionCount: count(quiz_questions_db.question_id),
    })
    .from(quizzes_db)
    // Join quizzes to the junction table where IDs match
    .leftJoin(
      quiz_questions_db, 
      eq(quizzes_db.id, quiz_questions_db.quiz_id)
    )
    .where(eq(quizzes_db.user_id, userId))
    // We MUST group by the quiz ID to get individual counts per quiz
    .groupBy(quizzes_db.id);

    res.status(200).json(userQuizzes);

  }catch(error){
    next(error);
  }
});

router.get('/:id/questions', verifyToken, async(req, res, next) => {
  const quizId = Number(req.params.id);
  
  if(!quizId){
    return res.status(400).json({success: false, message: 'You must select a quiz'});
  }
  try{
    const questionList = await db.select({
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
      .where(eq(quiz_questions_db.quiz_id, quizId))

    if(questionList.length<1){
      return res.status(404).json({success: false, message: 'There are no questions in this quiz'});
    }

    res.status(200).json({success: true, questionList});

  }catch(error){
    next(error);
  }


});

router.patch('/:quizId/question/:questionId', verifyToken, async(req, res, next)=>{
  const {questionId} = req.params;
  const { id } = req.body;

  const dataForDrizzle = {
    question_text: req.body.questionText.trim(),
    question_type: req.body.questionType,
    correct_answer: req.body.correctAnswer,
    option_a: req.body.optionA,
    option_b: req.body.optionB,
    option_c: req.body.optionC,
    option_d: req.body.optionD,
  };

  try{
    const [updatedQuestion] = await db.update(questions_db)
      .set(dataForDrizzle)
      .where(eq(questions_db.id, Number(questionId)))
      .returning();

    res.status(200).json({success: true, message: 'Question updated!', updatedQuestion: updatedQuestion});
  }catch(err){
    next(err);
  }
});

router.patch('/:id', verifyToken, async(req, res, next)=> {
  if(Object.keys(req.body).length < 1){
    return res.status(400).json({success: false, message: 'No changes to be saved'});
  }
  const {id} = req.params;
  const dataForDrizzle = {
    quiz_title: req.body.quizTitle.trim(),
    quiz_description: req.body.description.trim(),
    time_limit: req.body.timeLimit,
    due_date: new Date(req.body.dueDate)
  };

  try{
    const [updatedQuiz] = await db.update(quizzes_db).set(dataForDrizzle).where(eq(quizzes_db.id, Number(id))).returning();

    res.status(200).json({success: true, message: 'Quiz updated!', updatedQuiz});
  }catch(error){
    next(error);
  }
});

export default router;