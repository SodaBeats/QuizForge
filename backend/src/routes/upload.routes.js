import express from 'express';
import { upload } from '../middlewares/uploadMiddleware.js'; // import the multer middleware
import { fileHashMiddleware } from '../middlewares/fileHashMiddleware.js';//import file hash
import { extractText } from '../services/fileExtractService.js';

const router = express.Router();

// route: POST /api/upload
// running middlewares: upload, fileHashMiddleware
router.post('/', 
  upload.single('file'), 
  fileHashMiddleware,
  async (req, res, next) => {
    try{
      const result = await extractText(req.file);
      res.status(200).json(result);
    }catch (err) {
      next(err);
    }
});

export default router;
