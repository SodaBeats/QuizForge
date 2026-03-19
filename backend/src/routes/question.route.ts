import express from 'express';
import type { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../middlewares/auth.middleware.js';
import { questionInputValidator } from '../middlewares/questionValidator.middleware.js';
import { UploadedFilesRepository } from '../repository/UploadedFilesRepository.js';
import { QuestionsRepository } from '../repository/QuestionsRepository.js';


//establish router
const router = express.Router();

// ROUTER FOR MAKING QUESTIONS
router.post('/',
  verifyToken,
  questionInputValidator,
  async (req: Request, res: Response, next: NextFunction)=>{

  // make sure the supplied document actually belongs to the user
  const docIdNum = Number(req.body.documentId);
  if (Number.isNaN(docIdNum)) {
    return res.status(400).json({ success: false, message: 'Invalid documentId' });
  }

  try{
    //checks if doc exists and is owned by owner. Returns boolean
    const owner = await UploadedFilesRepository.isDocOwnedByOwnerId(docIdNum, req.user.id);
    if (!owner) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    //format data for database insertion
    const formattedData = {
      document_id: docIdNum,
      question_text: req.body.questionText,
      question_type: req.body.questionType,
      correct_answer: req.body.correctAnswer,
      option_a: req.body.optionA,
      option_b: req.body.optionB,
      option_c: req.body.optionC,
      option_d: req.body.optionD
    };

    const insertedQuestion = await QuestionsRepository.insertQuestionToDb(formattedData);

    res.status(200).json({
      success: true, 
      documentId: insertedQuestion?.documentId, 
      questionId: insertedQuestion?.questionId
    });
    
  }catch(error){
    next(error);
  }
});

// ROUTER FOR GETTING QUESTIONS RELATED TO DOCUMENT
router.get('/', verifyToken, async(req, res, next)=>{
  
  const docIdNum = Number(req.query.documentId);
  if (Number.isNaN(docIdNum)) {
    return res.status(400).json({ success: false, message: 'documentId must be a number' });
  }

  try{
    // ensure the document belongs to this user before returning questions
    const owner = await UploadedFilesRepository.isDocOwnedByOwnerId(docIdNum, req.user.id);
    if (!owner) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    //get all questions related to docId
    const questions = await QuestionsRepository.getAllQuestionsByDocId(docIdNum);
    if(!questions){
      return res.status(404).json({success: false, message: 'No questions found'});
    }

    res.status(200).json(questions);

  }catch(error){
    next(error);
  }
});

// ROUTER FOR EDITING QUESTIONS     TO DO----------------------------------------------
router.patch('/:id',
  verifyToken,
  questionInputValidator,
  async(req: Request, res: Response, next: NextFunction)=>{

  const id = Number(req.params.id);
  const {
    questionText,
    questionType,
    correctAnswer,
    optionA,
    optionB,
    optionC,
    optionD
  } = req.body;

  try{
    // make sure the question belongs to this user by joining document ownership
    const documentId = await QuestionsRepository.checkWhichDocOwnsQuestion(id);
    if (!documentId) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const owner = await UploadedFilesRepository.isDocOwnedByOwnerId(documentId, req.user.id);
    if (!owner) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const formattedData = {
      document_id: documentId,
      question_text: questionText,
      question_type: questionType,
      correct_answer: correctAnswer,
      option_a: optionA,
      option_b: optionB,
      option_c: optionC,
      option_d: optionD
    };

    const updatedQuestion = await QuestionsRepository.updateQuestion(formattedData, id);

    if(!updatedQuestion){
      return res.status(404).json({success: false, message: 'Question not found'});
    }

    res.status(200).json({success: true});

  }catch(error){
    next(error);
  }
});

router.delete('/:id', verifyToken, async(req, res, next)=>{

  const questionIdNum = Number(req.params.id);
  if(!questionIdNum){
    return res.status(400).json({ success: false, message: 'You must select a question'});
  }
  try{
    const deletedQuestion = await QuestionsRepository.deleteQuestionById(questionIdNum);
    if (!deletedQuestion) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }else{
      return res.status(200).json({ success: true, message: 'Question Deleted!' });
    }
  }catch(error){
    next(error);
  }

});

export default router;