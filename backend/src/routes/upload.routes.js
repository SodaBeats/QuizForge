import express from 'express';
import { upload } from '../middlewares/uploadMiddleware.js'; // import the multer middleware

const router = express.Router();

// route: POST /api/upload
//running a middleware called "upload"
router.post('/', upload.single('file'), (req, res) => {
  console.log(req.file);
  res.json({ message: 'File uploaded successfully!', file: req.file.filename });
});

export default router;
