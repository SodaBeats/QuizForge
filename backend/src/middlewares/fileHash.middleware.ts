import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import { db } from '../db/db.js';
import { uploaded_files } from '../db/schema.js';
import { eq } from 'drizzle-orm';

interface fileWithHash extends Express.Multer.File {
  fileHash: string; // Add an optional fileHash property
  buffer: Buffer; // Ensure buffer is included in the type definition
}

//Middleware to hash uploaded files
//Adds fileHash property to each file in req.file or req.files

export const fileHashMiddleware = async (req: Request, res: Response, next: NextFunction) => {

  const file = req.file as fileWithHash; // Type assertion to include fileHash

  try {
    // Hash the file content
    if (file) {
      file.fileHash = await hashFile(file.buffer);
    }
    
    //find the file with the same hash (any user)
    const existingFile = await db.query.uploaded_files.findFirst({
      where: eq(uploaded_files.file_hash, file.fileHash),
      // we only need a few columns: user_id so we can check ownership
      columns: { id: true, filename: true, extracted_text: true, user_id: true }
    });

    // if a match was found, only short‑circuit when the owner is the current user
    if (existingFile && existingFile.user_id === req.user?.id) {
      // return info for the user's own copy – this avoids re‑processing
      return res.json({
        success: true,
        fileId: existingFile.id,
        fileName: existingFile.filename,
        content: existingFile.extracted_text,
        type: file.mimetype
      });
    }
    // note: same hash belonging to *another* user is ignored; the upload
    // will continue and a new row will be created for the current user.

    /* 3. Handle Multiple Files (WIP Fix)
    if (req.files) {
      const filesArray = Array.isArray(req.files) 
        ? req.files 
        : Object.values(req.files).flat();

      for (const file of filesArray) {
        file.fileHash = await hashBuffer(file.buffer);
        // Note: You'd need a strategy for duplicates in multiple uploads
      }
    }*/

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

async function hashFile(fileBuffer: Buffer): Promise<string> {
  const hash = crypto.createHash('sha256');
  hash.update(fileBuffer);
  return hash.digest('hex');
}

/**
 * Alternative: Stream-based hashing for large files -------------------- wip

export const hashFileStream = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', (error) => reject(error));
  });
};
*/
