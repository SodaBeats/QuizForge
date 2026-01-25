import express from 'express';
import { db } from '../db/db.js';
import { quiz_questions } from '../db/schema.js';


//establish router
const router = express.Router();


router.post('/', async (req, res, next)=>{
    if (!req.body?.questionText || !req.body?.questionType){
      res.status(500).json({success: false, message: 'Please fill required input'});
      return;
    }
    try{
      const [insertedQuestion] = await db.insert(quiz_questions).values({
        document_id: req.body.documentId,
        question_text: req.body.questionText?.trim(),
        question_type: req.body.questionType,
        correct_answer: req.body.correctAnswer,
        option_a: req.body.optionA?.trim(),
        option_b: req.body.optionB?.trim(),
        option_c: req.body.optionC?.trim(),
        option_d: req.body.optionD?.trim()
      }).returning();

      res.status(200).json({
        success: true, 
        documentId: insertedQuestion.document_id, 
        questionId: insertedQuestion.id
      });
    }catch(error){
      next(error);
    }
  });

export default router;