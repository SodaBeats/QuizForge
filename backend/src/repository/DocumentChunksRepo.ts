import type { InferInsertModel } from 'drizzle-orm';
import { eq, and, count, sql, inArray } from 'drizzle-orm';
import { db } from '../db/db.js';
import { document_chunks_db } from '../db/schema.js';

type DocumentChunksInsertData = InferInsertModel<typeof document_chunks_db>;

export const DocumentChunksRepo = {
  //insert chunks with embeddings
  async insertToDocumentChunksDb(data: DocumentChunksInsertData[]) {
    await db.insert(document_chunks_db).values(data);
  },

  //get chunks
  async getDocumentChunks(documentId: number, userId: number) {
    const chunks = await db
      .select()
      .from(document_chunks_db)
      .where(
        and(
          eq(document_chunks_db.document_id, documentId),
          eq(document_chunks_db.user_id, userId),
        ),
      );
    return chunks.length > 0 ? chunks : null;
  },

  //count chunks
  async countChunks(documentId: number, userId: number) {
    const [counted] = await db
      .select({ count: count() })
      .from(document_chunks_db)
      .where(
        and(
          eq(document_chunks_db.document_id, documentId),
          eq(document_chunks_db.user_id, userId),
        ),
      );

    return counted?.count ?? null;
  },

  // fetch relevant chunks based on embedding, documentIds, and userId
  async getRelevantChunksWithSources(
    queryEmbedding: number[],
    sources: number[],
    userId: number,
  ) {
    if (sources.length <= 0) {
      return null;
    }
    // Threshold
    const similarity = sql<number>`${document_chunks_db.embedding} <=> ${JSON.stringify(queryEmbedding)}`;

    const result = await db
      .select({
        id: document_chunks_db.id,
        documentId: document_chunks_db.document_id,
        userId: document_chunks_db.user_id,
        content: document_chunks_db.content,
        distance: similarity,
      })
      .from(document_chunks_db)
      .where(
        and(
          eq(document_chunks_db.user_id, userId),
          inArray(document_chunks_db.document_id, sources),
          sql`${similarity} < 0.4`, // reject bad matches
        ),
      )
      .orderBy(similarity)
      .limit(5);

    return result.length > 0 ? result : null;
  },
};
