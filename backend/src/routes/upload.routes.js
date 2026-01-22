import express from 'express';
import { upload } from '../middlewares/uploadMiddleware.js';
import { fileHashMiddleware } from '../middlewares/fileHashMiddleware.js';
import { extractText } from '../services/fileExtractService.js';


//establish router
const router = express.Router();


router.post('/',
  upload.single('file'),         // multer middleware to process file
  fileHashMiddleware,           // middleware to generate file hash
  async (req, res, next)=>{
    //try to extract text and save to database
    //and then send to frontend if successful
    try{
      const extractedText = await extractText(req.file);
      res.status(200).json(extractedText);
    }catch(err){
      next(err);
    }
});

export default router;