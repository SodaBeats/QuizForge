import fs from 'fs';
import mammoth from 'mammoth';
import { db } from '../db/db.js';
import { uploaded_files } from '../db/schema.js';

export const extractText = async(file) => {

  try{
    const filePath = file.path;
    console.log('BEFORE mammoth');//debugging
    const result = await mammoth.extractRawText({path: filePath});
    console.log('AFTER mammoth');//debugging
    const extractedText = result.value;

    console.log('Extracted text length:', extractedText.length); // DEBUG
    console.log('File hash:', file.fileHash); // DEBUG
    
    if (!extractedText || extractedText.trim() === '') {
      throw new Error('No text extracted from file');
    }

    const fileName = file.originalname;
    const fileHash = file.fileHash;

    //when inserting to database, use schema property names (camelCase)
    const [insertedFile] = await db.insert(uploaded_files).values({
      filename: fileName,
      filePath: filePath,
      fileHash: fileHash,
      extractedText: extractedText
    }).returning();

    return{
      success: true,
      fileId: insertedFile.id,
      fileName: insertedFile.filename,
      content: insertedFile.extractedText,
      type: file.mimetype
    }

  }catch(err){
    throw new Error(`Failed to extract DOCX text: ${err.message}`);
  }
}