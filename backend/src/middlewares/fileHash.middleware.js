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
      req.file.fileHash = await hashFile(req.file.buffer);
    }
    
    //find the file with the same hash
    const existingFile = await db.query.uploaded_files.findFirst({
      where: eq(uploaded_files.file_hash, req.file.fileHash)
    });

    //extract the existing file from database and send to frontend
    if(existingFile){

      return res.json({
        success: true,
        fileId: existingFile.id,
        fileName: existingFile.filename,
        content: existingFile.extracted_text,
        type: req.file.mimetype
      });
    }

    // 3. Handle Multiple Files (WIP Fix)
    if (req.files) {
      const filesArray = Array.isArray(req.files) 
        ? req.files 
        : Object.values(req.files).flat();

      for (const file of filesArray) {
        file.fileHash = await hashBuffer(file.buffer);
        // Note: You'd need a strategy for duplicates in multiple uploads
      }
    }
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

async function hashFile(buffer) {
  const hash = crypto.createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex');
}

/**
 * Alternative: Stream-based hashing for large files -------------------- wip
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