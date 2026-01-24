import fs from 'fs';
import mammoth from 'mammoth';
import { db } from '../db/db.js';
import { uploaded_files } from '../db/schema.js';
import { filterExamWorthySentences } from './textFilter.service.js';

export const extractText = async(file) => {

  try{
    const filePath = file.path;
    const result = await mammoth.extractRawText({path: filePath});
    const extractedText = result.value;
    const filteredText = filterExamWorthySentences(extractedText);
    
    if (!extractedText || extractedText.trim() === '') {
      throw new Error('No text extracted from file');
    }

    //store the needed values into variables for ease of use
    const fileName = file.originalname;
    const fileHash = file.fileHash;

    //when inserting to database, use schema property names (snake case)
    const [insertedFile] = await db.insert(uploaded_files).values({
      filename: fileName,
      file_path: filePath,
      file_hash: fileHash,
      extracted_text: filteredText
    }).returning();

    return{
      success: true,
      fileId: insertedFile.id,
      fileName: insertedFile.filename,
      content: extractedText,
      type: file.mimetype
    }

  }catch(err){
    throw new Error(`Failed to extract DOCX text: ${err.message}`);
  }
}