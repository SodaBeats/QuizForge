import express from 'express';
import { eq } from 'drizzle-orm';
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

  router.get('/', async(req, res, next)=>{
    const {documentId} = req.query;
    if (!documentId) {
      return res.status(400).json({ error: 'documentId required' });
    }
    try{
      const questions = await db.query.quiz_questions.findMany({
        where: eq(quiz_questions.document_id, documentId)
      });
      res.status(200).json(questions);

    }catch(error){
      next(error);
    }
  });

  //WORK ON THIS
  router.put('/:id', async(req, res, next)=>{
    const {id} = req.params;
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
      const updatedQuestion = await db.update(quiz_questions)
        .set({
          question_text, question_type,
          correct_answer, option_a,
          option_b, option_c,
          option_d
        })
        .where (eq(quiz_questions.id, Number(id)));

      if(!updatedQuestion){
        return res.status(400).json({error: 'Question not found'});
      }

      res.status(200).json({success: true});

    }catch(error){
      next(error);
    }
  });

export default router;