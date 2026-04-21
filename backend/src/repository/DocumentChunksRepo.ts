import type { InferInsertModel } from 'drizzle-orm';
import { db } from '../db/db.js';
import { document_chunks_db } from '../db/schema.js';

type DocumentChunksInsertData = InferInsertModel<typeof document_chunks_db>;

export const DocumentChunksRepo = {
  //insert chunks with embeddings
  async insertToDocumentChunksDb(data: DocumentChunksInsertData[]) {
    await db.insert(document_chunks_db).values(data);
  },
};
