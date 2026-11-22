import mammoth from 'mammoth';
import pdf from 'pdf-extraction';
import { embedText } from '../lib/embedText.js';
import type { UploadedFileInterface } from '../types/file.js';
import { UploadedFilesRepository } from '../repository/UploadedFilesRepository.js';
import { textUtilities } from '../utils/textUtilities.util.js';
import { DocumentChunksRepo } from '../repository/DocumentChunksRepo.js';
import { assertBudget, estimateTokens, today } from './tokenBudget.service.js';
import { db } from '../db/db.js';
import { TokenUsageRepo } from '../repository/TokenUsageRepo.js';

const isProd = process.env.NODE_ENV === 'production';
const minWords = 150;
const maxWords = isProd ? 800 : 450;

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

    // chunk text for RAG
    const chunks = textUtilities.seniorChunker(cleanedText, minWords, maxWords);
    if (!chunks || chunks.length < 1) {
      throw new Error('Failed to chunk document');
    }
    const estimated = chunks.reduce((sum, c) => sum + estimateTokens(c), 0);
    await assertBudget(userId, 'embedding', estimated);

    // make embeddings for the chunks (embedText validates count/dimensions)
    const embeddings = await embedText(chunks);

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
        const vector = embeddings[index];
        return {
          document_id: insertedFile.id,
          user_id: userId,
          content: chunk,
          embedding: vector,
        };
      });

      await DocumentChunksRepo.insertToDocumentChunksDb(dataToInsert, tx);

      await TokenUsageRepo.recordUsage(userId, today(), 'embedding', estimated);

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
