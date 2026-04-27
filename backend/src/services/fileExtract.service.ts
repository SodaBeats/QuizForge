import mammoth from 'mammoth';
import pdf from 'pdf-extraction';
import ollama from 'ollama';
import Groq from 'groq-sdk';
import z from 'zod';
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
    const groq = new Groq();

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
    } else {
      throw new Error(
        `Unsupported file type: ${file.mimetype}. Supported types: PDF, DOCX`,
      );
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

    if (!insertedFile || !insertedFile.id || !insertedFile.filename) {
      throw new Error('Failed to insert file to database');
    }
    // TO DO: ADD A TOKENIZER TO COUNT TEXT TOKENS ----------------------------------------------

    // TO DO: ADD TEXT SANITAZTION TO MARKDOWN USING LIGHTWEIGHT AI --------------------------- (cleanedText variable)
    const ChunkResponseSchema = z.object({
      chunks: z.array(z.string()).min(1),
    });

    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a text chunking assistant. Return a JSON object with a 'chunks' key containing an array of strings.
            Rules:
            - Max chunk size: 500.
            - DO NOT separate Chapter Titles and Headers into their own chunks.
            - Never split a sentence across two chunks.
            - If a chunk is under 250 words, merge it with the next chunk.
            - Ensure no text is lost.
            - It is imperative that you only respond with the required format and nothing else.
            
            Sample Output:
            {
              "chunks": [
                "chunk 1...",
                "chunk 2...",
                "chunk 3...",
              ]
            }`,
        },
        {
          role: 'user',
          content: `Chunk this text: ${cleanedText}`,
        },
      ],
    });

    if (!response.choices[0]?.message.content) {
      throw new Error('Something went wrong with LLM response');
    }

    // Parse the raw string
    const rawData = JSON.parse(response.choices[0].message.content);
    // Zod Check
    const result = ChunkResponseSchema.safeParse(rawData);

    if (!result.success) {
      // LLM hallucination handler
      console.error(
        'LLM returned valid JSON, but wrong structure:',
        result.error,
      );
      throw new Error('Invalid chunk structure');
    }

    //chunk for vector database storage (RAG)
    const chunks = textUtilities.cleanAiOutput(result.data.chunks);

    console.log(chunks);

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

    const dataToInsert = chunks.map((chunk, index) => {
      const vector = batch.embeddings[index];
      return {
        document_id: insertedFile.id,
        user_id: userId,
        content: chunk,
        embedding: vector,
      };
    });
    await DocumentChunksRepo.insertToDocumentChunksDb(dataToInsert);

    return {
      success: true,
      fileId: insertedFile.id,
      fileName: insertedFile.filename,
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
