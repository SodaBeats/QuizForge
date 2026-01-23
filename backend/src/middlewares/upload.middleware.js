import multer from 'multer';
import fs from 'fs';
import path from 'path';

// ensure uploads folder exists, creates one if none
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

// file filter to only allow DOCX files
const fileFilter = (req, file, cb) => {
  const allowedMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const allowedExtension = '.docx';

  if (file.mimetype === allowedMimeType || file.originalname.toLowerCase().endsWith(allowedExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Only DOCX files are allowed'));
  }
};

// export middleware
export const upload = multer({ storage, fileFilter });
