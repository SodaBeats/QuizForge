import express from 'express';
import type { Request, Response } from 'express';
import { upload } from '../middlewares/upload.middleware.js';
import { fileHashMiddleware } from '../middlewares/fileHash.middleware.js';
import { extractText } from '../services/fileExtract.service.js';
import { verifyToken } from '../middlewares/auth.middleware.js';


//establish router
const router = express.Router();

// extend the express Request object to capture the custom fields added by middleware
interface MulterRequest extends Request {
  // multer will populate "file" when using memoryStorage
  file: Express.Multer.File & { fileHash: string };
  // auth middleware attaches a user property containing at least an id
  user?: { id: number } | any;
}

router.post('/',
  verifyToken,
  upload.single('file'),         // multer middleware to process file
  fileHashMiddleware,           // middleware to generate file hash
  async (req, res: Response, next) => {
    // we'll narrow the type once inside
    const multerReq = req as MulterRequest;

    try {
      if (!multerReq.file) {
        return res.status(400).json({ message: 'No file provided' });
      }
      if (!multerReq.user) {
        return res.status(401).json({ message: 'Unauthenticated' });
      }

      // translate the Multer file into our own interface shape
      const fileObj = {
        buffer: multerReq.file.buffer,
        mimetype: multerReq.file.mimetype,
        originalname: multerReq.file.originalname,
        fileHash: multerReq.file.fileHash,
      };

      const extractedText = await extractText(fileObj, multerReq.user.id);
      res.status(200).json(extractedText);
    } catch (err) {
      next(err);
    }
  }
);

export default router;