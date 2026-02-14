import express from 'express';
import { upload } from '../middlewares/upload.middleware.js';
import { fileHashMiddleware } from '../middlewares/fileHash.middleware.js';
import { extractText } from '../services/fileExtract.service.js';
import { verifyToken } from '../middlewares/auth.middleware.js';


//establish router
const router = express.Router();


router.post('/',
  verifyToken,
  upload.single('file'),         // multer middleware to process file
  fileHashMiddleware,           // middleware to generate file hash
  async (req, res, next)=>{
    //try to extract text and save to database
    //and then send to frontend if successful
    try{
      const extractedText = await extractText(req.file, req.user.id);
      res.status(200).json(extractedText);
    }catch(err){
      next(err);
    }
  }
);

export default router;