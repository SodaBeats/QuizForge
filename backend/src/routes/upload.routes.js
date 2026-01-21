import express from 'express';
import { upload } from '../middlewares/uploadMiddleware.js'; // import the multer middleware
import { fileHashMiddleware } from '../middlewares/fileHashMiddleware.js';//import file hash

const router = express.Router();

// route: POST /api/upload
//running a middleware called "upload"
router.post('/', 
  upload.single('file'), 
  fileHashMiddleware,
  async (req, res) => {
    const result = await extractText(req.file);
});

export default router;
