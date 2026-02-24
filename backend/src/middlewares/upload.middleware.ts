import type { Request } from 'express';
import multer, { type FileFilterCallback } from 'multer';
import fs from 'fs';
import path from 'path';

// ensure uploads folder exists, creates one if none
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// configure multer storage
const storage = multer.memoryStorage();

// file filter to only allow DOCX and pdf files
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback) => {
  
  const allowedMimeTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Only DOCX and PDF files are allowed');
    (error as any).code = 'INVALID_FILE_TYPE';
    cb(error as any, false);
  }
};

// export middleware
export const upload = multer({ storage: storage, fileFilter: fileFilter, limits:{fileSize: 5*1024*1024, files: 1} });
