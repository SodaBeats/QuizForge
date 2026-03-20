
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { quizInputValidator } from '../middlewares/quizInputValidator.middleware.js';
import { questionInputValidator } from '../middlewares/questionValidator.middleware.js';
import { UserQuizzesRepository } from '../repository/UserQuizzesRepository.js';
import { QuestionsToQuizRepo } from '../repository/QuestionsToQuizRepo.js';
import { QuestionsRepository } from '../repository/QuestionsRepository.js';

const router = express.Router();

//Router for making a quiz
router.post('/',
  verifyToken,
  quizInputValidator,
  async(req: Request, res: Response, next: NextFunction)=>{

  const {fileId, quizTitle} = req.body;
  const {id, role} = req.user;
  
  //verify contents
  if(!fileId || !quizTitle){
    return res.status(400).json({success: false, message: 'Incomplete Input'});
  }
  if(role!=='teacher'){
    return res.status(400).json({success: false, message: 'Unauthorized action'});
  }

  const formattedData = {
    user_id: id,
    quiz_title: req.body.quizTitle,
    quiz_description: req.body.description,
    share_token: req.body.shareToken,
    time_limit: req.body.timeLimit,
    max_attempts: req.body.maxAttempts,
    due_date: new Date(req.body.dueDate),
    status: req.body.status
  };

  try{
    //insert quiz data to database
    const newQuiz = await UserQuizzesRepository.insertNewQuiz(formattedData);
    if (!newQuiz){
      return res.status(500).json({success: false, message: 'Failed to create quiz'});
    }

    const newQuizId = newQuiz?.id;
    const questionIds = req.body.questionIds;

    if(!Array.isArray(questionIds) || questionIds.length<=0){
      return res.status(400).json({success: false, message: 'No questions provided'});
    }

    //assigning question IDs to the quiz id and insert into junction table
    const junctionRows = questionIds.map((qId: number) => {
      return {
        quiz_id: newQuizId,
        question_id: qId,
      };
    });

    await QuestionsToQuizRepo.assignQuestionsToQuizzes(junctionRows);

    res.status(200).json({success: true, message: 'Quiz Forged!'});

  }catch(error){
    next(error);
  }

});

//get all quizzes related to user
router.get('/', verifyToken, async(req, res, next)=>{
  
  const userId = req.user.id;
  try{

    //count all questions assigned to a quiz
    const userQuizzes = await UserQuizzesRepository.getAllUserQuizzes(userId);
    if(!userQuizzes || userQuizzes.length<1){
      return res.status(404).json({success: false, message: 'This user does not have quizzes.'});
    }

    res.status(200).json(userQuizzes);

  }catch(error){
    next(error);
  }
});

//get all questions related to selected quiz
router.get('/questions', verifyToken, async(req, res, next) => {
  const {quizId} = req.query;
  
  if(!quizId){
    return res.status(400).json({success: false, message: 'You must select a quiz'});
  }
  
  try{
    const questionList = await QuestionsRepository.getQuestionsRelatedToQuiz(Number(quizId));

    if(questionList.length<1){
      return res.status(404).json({success: false, message: 'There are no questions in this quiz'});
    }

    res.status(200).json({success: true, questionList});

  }catch(error){
    next(error);
  }
});

// Router for question updates
router.patch('/:quizId/question/:questionId',
  verifyToken,
  questionInputValidator,
  async(req: Request, res: Response, next: NextFunction)=>{

  const {questionId} = req.params;

  const dataForDrizzle = {
    question_text: req.body.questionText,
    question_type: req.body.questionType,
    correct_answer: req.body.correctAnswer,
    option_a: req.body.optionA,
    option_b: req.body.optionB,
    option_c: req.body.optionC,
    option_d: req.body.optionD,
  };

  try{
    const updatedQuestion = await QuestionsRepository.updateQuestionReturning(dataForDrizzle, Number(questionId));
    res.status(200).json({success: true, message: 'Question updated!', updatedQuestion: updatedQuestion});
  }catch(err){
    next(err);
  }
});

//Router for quiz metadata updates
router.patch('/:id',
  verifyToken,
  quizInputValidator,
  async(req: Request, res: Response, next: NextFunction)=> {

  if(Object.keys(req.body).length < 1){
    return res.status(400).json({success: false, message: 'No changes to be saved'});
  }

  const {id} = req.params;
  const dataForDrizzle = {
    quiz_title: req.body.quizTitle,
    quiz_description: req.body.description,
    time_limit: req.body.timeLimit,
    due_date: new Date(req.body.dueDate),
    max_attempts: req.body.maxAttempts,
    status: req.body.status
  };

  try{
    const updatedQuiz = await UserQuizzesRepository.updateQuizDataReturnAll(dataForDrizzle, Number(id));

    res.status(200).json({success: true, message: 'Quiz updated!', updatedQuiz});
  }catch(error){
    next(error);
  }
});

export default router;