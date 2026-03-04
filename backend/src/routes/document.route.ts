import express, { type NextFunction, type Request, type Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/db.js'
import { uploaded_files } from '../db/schema.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', verifyToken, async(req, res, next)=>{

  try{
    const documents = await db.select({
      title: uploaded_files.filename,
      id: uploaded_files.id,
    })
    .from(uploaded_files)
    .where(eq(uploaded_files.user_id, req.user.id));

    res.status(200).json(documents);
  }catch(err){
    next(err);
  }

});

router.get('/:id', verifyToken, async(req, res, next)=>{

  // express puts params under the name in the route; here it's "id" not "docId"
  const docIdNum = Number(req.params.id);
  if (!docIdNum) {
    return res.status(400).json({ error: 'documentId required' });
  }
  try{
    const [row] = await db.select({ id: uploaded_files.id, extracted_text: uploaded_files.extracted_text })
      .from(uploaded_files)
      .where(
        and(
          eq(uploaded_files.id, docIdNum),
          eq(uploaded_files.user_id, req.user.id) // make sure current user owns the file
        )
      );
    
    if (!row) {
      return res.status(404).json({ error: 'document not found' });
    }

    return res.status(200).json({ success: true, id: row.id, content: row.extracted_text });

  }catch(err){
    next(err);
  }

});

router.delete('/:id', verifyToken, async(req, res, next) => {

  const docIdNum = Number(req.params.id);
  if(!docIdNum) {
    return res.status(400).json({ success: false, message: 'Document ID required'});
  }
  try{
    const [deletedFile] = await db.delete(uploaded_files)
      .where(and(
        eq(uploaded_files.id, docIdNum),
        eq(uploaded_files.user_id, req.user.id) // SECURITY FIX: Ensure users can't delete other people's files
      ))
      .returning();

    if (!deletedFile) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }else{
      return res.status(200).json({ success: true });
    }
  }catch(error){
    next(error);
  }


});

export default router;