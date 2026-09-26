import mammoth from 'mammoth';
import pdf from 'pdf-extraction';
import ollama from 'ollama';
import type { UploadedFileInterface } from '../types/file.js';
import { UploadedFilesRepository } from '../repository/UploadedFilesRepository.js';
import { textUtilities } from '../utils/textUtilities.util.js';
import { DocumentChunksRepo } from '../repository/DocumentChunksRepo.js';
import { db } from '../db/db.js';

export const extractText = async (
  file: UploadedFileInterface | null | undefined,
  userId: number,
) => {
  try {
    if (!file) {
      throw new Error('no file uploaded');
    }

    let extractedText = '';

    // Use appropriate library depending on Mimetype
    if (file.mimetype === 'application/pdf') {
      const result = await pdf(file.buffer);
      extractedText = result.text;
    } else if (
      file.mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      extractedText = result.value;
    } else {
      throw new Error(
        `Unsupported file type: ${file.mimetype}. Supported types: PDF, DOCX`,
      );
    }
    if (!extractedText || extractedText.trim() === '') {
      throw new Error('No text extracted from file');
    }

    // clean text format
    const cleanedText = textUtilities.cleanExtractedText(extractedText);

    // store the needed values into variables for ease of use
    const fileName = file.originalname;
    const fileHash = file.fileHash;
    // format file data for database insert
    const formattedData = {
      user_id: userId,
      filename: fileName,
      file_path: 'temporary_input',
      file_hash: fileHash,
      extracted_text: cleanedText,
    };

    console.log();
    // chunk text for RAG
    const chunks = textUtilities.seniorChunker(cleanedText);
    if (!chunks || chunks.length < 1) {
      throw new Error('Failed to chunk document');
    }

    // make embeddings for the chunks
    const batch = await ollama.embed({
      model: 'mxbai-embed-large:latest',
      input: chunks,
    });
    if (!batch.embeddings || batch.embeddings.length !== chunks.length) {
      throw new Error(
        `Embedding count mismatch: expected ${chunks.length}, got ${batch.embeddings?.length || 0}`,
      );
    }

    const transactionResult = await db.transaction(async (tx) => {
      const insertedFile = await UploadedFilesRepository.insertFileToDb(
        formattedData,
        tx,
      );

      if (!insertedFile || !insertedFile.id || !insertedFile.filename) {
        throw new Error('Failed to insert file to database');
      }

      // insert chunked texts with their corresponding embedding
      const dataToInsert = chunks.map((chunk, index) => {
        const vector = batch.embeddings[index];
        return {
          document_id: insertedFile.id,
          user_id: userId,
          content: chunk,
          embedding: vector,
        };
      });

      await DocumentChunksRepo.insertToDocumentChunksDb(dataToInsert, tx);

      return {
        id: insertedFile.id,
        filename: insertedFile.filename,
      };
    });

    return {
      success: true,
      fileId: transactionResult.id,
      fileName: transactionResult.filename,
      content: cleanedText,
      type: file.mimetype,
    };
  } catch (err: unknown) {
    console.error(err);
    if (err instanceof Error) {
      throw new Error(`File extraction service error: ${err.message}`);
    }
    throw new Error('File extraction service error');
  }
};
