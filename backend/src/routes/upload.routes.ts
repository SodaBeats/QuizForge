import express from 'express';
import type { Request, Response } from 'express';
import { upload } from '../middlewares/upload.middleware.js';
import { fileHashMiddleware } from '../middlewares/fileHash.middleware.js';
import { extractText } from '../services/fileExtract.service.js';
import { verifyToken } from '../middlewares/auth.middleware.js';


//establish router
const router = express.Router();

interface FileWithHash extends Express.Multer.File{
  fileHash: string;
}

router.post('/',
  verifyToken,
  upload.single('file'),         // multer middleware to process file
  fileHashMiddleware,           // middleware to generate file hash
  async (req, res: Response, next) => {
    // we'll narrow the type once inside
    const file = req.file as FileWithHash;

    try {
      if (!file) {
        return res.status(400).json({ message: 'No file provided' });
      }
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthenticated' });
      }

      // translate the Multer file into my own interface shape
      //I can just pass multerReq.file in the extracText function
      //but that function would then be reliant on Multer
      //by makiing my own object interface, the function won't care if multer exists
      //also multerReq.file would have too much properties, so I made fileObj with only
      //the properties I need
      const fileObj = {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
        fileHash: file.fileHash,
      };

      const extractedText = await extractText(fileObj, req.user.id);
      res.status(200).json(extractedText);
    } catch (err) {
      next(err);
    }
  }
);

export default router;