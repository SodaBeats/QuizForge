import multer from 'multer';
import fs from 'fs';
import path from 'path';

// ensure uploads folder exists, creates one if none
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// configure multer storage
const storage = multer.memoryStorage();

// file filter to only allow DOCX and pdf files
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf'];
  const allowedExtension = ['.docx', '.pdf'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only DOCX and PDF files allowed'));
  }
};

// export middleware
export const upload = multer({ storage: storage, fileFilter: fileFilter, limits:{fileSize: 5*1024*1024, files: 1} });
