import express from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/db.js';
import { quiz_questions, uploaded_files } from '../db/schema.js';
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

  // make sure the supplied document actually belongs to the user
  const docIdNum = Number(req.body.documentId);
  if (Number.isNaN(docIdNum)) {
    return res.status(400).json({ error: 'Invalid documentId' });
  }

  try{
    const [owner] = await db.select().from(uploaded_files).where(
      and(
        eq(uploaded_files.id, docIdNum),
        eq(uploaded_files.user_id, req.user.id)
      )
    );
    if (!owner) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const [insertedQuestion] = await db.insert(quiz_questions).values({
      document_id: docIdNum,
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
    // ensure the document belongs to this user before returning questions
    const [owner] = await db.select().from(uploaded_files).where(
      and(
        eq(uploaded_files.id, docIdNum),
        eq(uploaded_files.user_id, req.user.id)
      )
    );
    if (!owner) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const questions = await db.query.quiz_questions.findMany({
      where: eq(quiz_questions.document_id, docIdNum)
    });

    res.status(200).json(questions);

  }catch(error){
    next(error);
  }
});

router.put('/:id', verifyToken, async(req, res, next)=>{
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
    const [question] = await db.select({ document_id: quiz_questions.document_id })
      .from(quiz_questions)
      .where(eq(quiz_questions.id, id));

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const [owner] = await db.select().from(uploaded_files).where(
      and(
        eq(uploaded_files.id, question.document_id),
        eq(uploaded_files.user_id, req.user.id)
      )
    );
    if (!owner) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const updatedQuestion = await db.update(quiz_questions)
      .set({
        question_text: questionText?.trim(),
        question_type: questionType,
        correct_answer: correctAnswer,
        option_a: optionA?.trim(),
        option_b: optionB?.trim(),
        option_c: optionC?.trim(),
        option_d: optionD?.trim()
      })
      .where (eq(quiz_questions.id, id))
      .returning();

    if(updatedQuestion.length < 1){
      return res.status(404).json({error: 'Question not found'});
    }

    res.status(200).json({success: true});

  }catch(error){
    next(error);
  }
});

router.delete('/:id', verifyToken, async(req, res, next)=>{

  const questionIdNum = Number(req.params.id);
  if(!questionIdNum){
    return res.status(400).json({ success: false, message: 'Question ID required'});
  }
  try{
    const [deletedQuestion] = await db.delete(quiz_questions)
      .where(eq(quiz_questions.id, questionIdNum))
      .returning();
      
    if (!deletedQuestion) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }else{
      return res.status(200).json({ success: true });
    }
  }catch(error){
    next(error);
  }

});

export default router;