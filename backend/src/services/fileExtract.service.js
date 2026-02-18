import mammoth from 'mammoth';
import pdf from 'pdf-extraction';
import { db } from '../db/db.js';
import { uploaded_files } from '../db/schema.js';
import { cleanExtractedText } from './textCleaner.service.js';

export const extractText = async(file, userId) => {

  try{
    if(!file){
      throw new Error('no file uploaded');
    }

    let extractedText = '';

    //Use appropriate library depending on Mimetype
    if(file.mimetype === 'application/pdf'){
      const data = await pdf(file.buffer);
      extractedText = data.text;
    }
    else if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      extractedText = result.value;
    }

    if (!extractedText || extractedText.trim() === '') {
      throw new Error('No text extracted from file');
    }

    const cleanedText = cleanExtractedText(extractedText);

    //store the needed values into variables for ease of use
    const fileName = file.originalname;
    const fileHash = file.fileHash;

    //when inserting to database, use schema property names (snake case)
    const [insertedFile] = await db.insert(uploaded_files).values({
      user_id: userId,
      filename: fileName,
      file_path: 'temporary_input',
      file_hash: fileHash,
      extracted_text: cleanedText
    }).returning();

    return{
      success: true,
      fileId: insertedFile.id,
      fileName: insertedFile.filename,
      content: cleanedText,
      type: file.mimetype
    }

  }catch(err){
    throw new Error(`File extraction service error: ${err.message}`);
  }
}