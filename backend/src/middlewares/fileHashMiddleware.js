import crypto from 'crypto';
import fs from 'fs';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);

//Middleware to hash uploaded files
//Adds fileHash property to each file in req.file or req.files

export const fileHashMiddleware = async (req, res, next) => {
  try {
    // Handle single file upload (req.file)
    if (req.file) {
      req.file.fileHash = await hashFile(req.file.path);
    }

    // Handle multiple file uploads (req.files)
    if (req.files) {
      // If req.files is an array
      if (Array.isArray(req.files)) {
        for (const file of req.files) {
          file.fileHash = await hashFile(file.path);
        }
      } 
      // If req.files is an object (field-based uploads)
      else {
        for (const fieldName in req.files) {
          const files = req.files[fieldName];
          for (const file of files) {
            file.fileHash = await hashFile(file.path);
          }
        }
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

/*
 * Hash a file using SHA-256
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} - Hex hash string
 */

async function hashFile(filePath) {
  const fileBuffer = await readFile(filePath);
  const hash = crypto.createHash('sha256');
  hash.update(fileBuffer);
  return hash.digest('hex');
}

/**
 * Alternative: Stream-based hashing for large files
 */
export const hashFileStream = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (error) => reject(error));
  });
};

// Usage example with Express and Multer:
/*
import express from 'express';
import multer from 'multer';
import { fileHashMiddleware } from './middleware/fileHash.js';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.post('/upload', 
  upload.single('file'), 
  fileHashMiddleware, 
  (req, res) => {
    console.log('File hash:', req.file.fileHash);
    res.json({
      filename: req.file.filename,
      hash: req.file.fileHash
    });
  }
);
*/