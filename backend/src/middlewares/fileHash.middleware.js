import crypto from 'crypto';
import fs from 'fs';
import { promisify } from 'util';
import { db } from '../db/db.js';
import { uploaded_files } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const readFile = promisify(fs.readFile);

//Middleware to hash uploaded files
//Adds fileHash property to each file in req.file or req.files

export const fileHashMiddleware = async (req, res, next) => {
  try {
    // Hash the file content
    if (req.file) {
      req.file.fileHash = await hashFile(req.file.path);
    }
    
    //find the file with the same hash
    const existingFile = await db.query.uploaded_files.findFirst({
      where: eq(uploaded_files.file_hash, req.file.fileHash)
    });

    //extract the existing file from database and send to frontend
    if(existingFile){
      try{
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Failed to delete file:', err);
      }

      return res.json({
        success: true,
        fileId: existingFile.id,
        fileName: existingFile.filename,
        content: existingFile.extracted_text,
        type: req.file.mimetype
      });
    }

    //-----------------------------------------------------WORK IN PROGRESS
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
    //--------------------------------------------------------
    next();
  } catch (error) {
    next(error);
  }
};

/**
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