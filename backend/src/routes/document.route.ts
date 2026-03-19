import express, { type NextFunction, type Request, type Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/db.js'
import { uploaded_files } from '../db/schema.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { UploadedFilesRepository } from '../repository/UploadedFilesRepository.js';

const router = express.Router();

router.get('/', verifyToken, async(req, res, next)=>{

  try{
    //get all documents by user ID
    const documents = await UploadedFilesRepository.getDocTitleAndIdByOwner(req.user.id);
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
    const row = await UploadedFilesRepository.getDocIdAndTextByDocIdOwnerId(docIdNum, req.user.id);
    
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
    const deletedFile = UploadedFilesRepository.deleteDocByDocIdOwnerId(docIdNum, req.user.id);

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