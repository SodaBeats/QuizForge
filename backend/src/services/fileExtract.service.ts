import mammoth from 'mammoth';
import pdf from 'pdf-extraction';
//import ollama from 'ollama';
import type { UploadedFileInterface } from '../types/file.js';
import { UploadedFilesRepository } from '../repository/UploadedFilesRepository.js';
import { textUtilities } from '../utils/textUtilities.util.js';
import { DocumentChunksRepo } from '../repository/DocumentChunksRepo.js';

export const extractText = async (
  file: UploadedFileInterface | null | undefined,
  userId: number,
) => {
  try {
    if (!file) {
      throw new Error('no file uploaded');
    }

    let extractedText = '';

    //Use appropriate library depending on Mimetype
    if (file.mimetype === 'application/pdf') {
      const data = await pdf(file.buffer);
      extractedText = data.text;
    } else if (
      file.mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      extractedText = result.value;
    }

    if (!extractedText || extractedText.trim() === '') {
      throw new Error('No text extracted from file');
    }

    //clean text format
    const cleanedText = textUtilities.cleanExtractedText(extractedText);

    //store the needed values into variables for ease of use
    const fileName = file.originalname;
    const fileHash = file.fileHash;

    //format data for database insert
    const formattedData = {
      user_id: userId,
      filename: fileName,
      file_path: 'temporary_input',
      file_hash: fileHash,
      extracted_text: cleanedText,
    };

    //when inserting to database, use schema property names
    const insertedFile =
      await UploadedFilesRepository.insertFileToDb(formattedData);

    if (!insertedFile) {
      throw new Error('Failed to insert file to database');
    }

    //chunk for vector database storage (RAG)
    const chunks = textUtilities.textChunker(cleanedText);

    // make embeddings for the chunks
    if (chunks && chunks.length > 0) {
      try {
        /*const batch = await ollama.embed({
          model: 'mxbai-embed-large:latest',
          input: chunks,
        });*/
        const dataToInsert = chunks.map((chunk, index) => {
          /*const vector = batch.embeddings[index];
          if (!vector) {
            throw new Error(`Embedding failed for chunk at index ${index}`);
          }*/
          return {
            document_id: insertedFile.id,
            user_id: userId,
            content: chunk,
            embedding: null,
          };
        });
        await DocumentChunksRepo.insertToDocumentChunksDb(dataToInsert);
      } catch (error) {
        console.error(error);
      }
    }
    return {
      success: true,
      fileId: insertedFile.id,
      fileName: insertedFile.filename,
      content: cleanedText,
      type: file.mimetype,
    };
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw new Error(`File extraction service error: ${err.message}`);
    }
    throw new Error('File extraction service error');
  }
};
