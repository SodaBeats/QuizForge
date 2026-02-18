import express from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/db.js';
import { quiz_questions } from '../db/schema.js';
import { verifyToken } from '../middlewares/auth.middleware.js';


//establish router
const router = express.Router();


router.post('/',
  verifyToken,
  async (req, res, next)=>{
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
      documentId: insertedQuestion?.document_id, 
      questionId: insertedQuestion?.id
    });
  }catch(error){
    next(error);
  }
});

router.get('/', verifyToken, async(req, res, next)=>{
  const {documentId} = req.query;
  if (!documentId) {
    return res.status(400).json({ error: 'documentId required' });
  }

  // make sure we pass a number to `eq`
  const docIdNum = Number(documentId);
  if (Number.isNaN(docIdNum)) {
    return res.status(400).json({ error: 'documentId must be a number' });
  }

  try{
    const questions = await db.query.quiz_questions.findMany({
      where: eq(quiz_questions.document_id, docIdNum)
    });

    res.status(200).json(questions);

  }catch(error){
    next(error);
  }
});

router.put('/:id', verifyToken, async(req, res, next)=>{
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
        question_text: questionText,
        question_type: questionType,
        correct_answer: correctAnswer,
        option_a: optionA,
        option_b: optionB,
        option_c: optionC,
        option_d: optionD
      })
      .where (eq(quiz_questions.id, Number(id)))
      .returning();

    if(updatedQuestion.length < 1){
      return res.status(404).json({error: 'Question not found'});
    }

    res.status(200).json({success: true});

  }catch(error){
    next(error);
  }
});

export default router;