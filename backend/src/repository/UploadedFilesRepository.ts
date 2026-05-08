import type { InferInsertModel } from 'drizzle-orm';
import { eq, and, asc, desc, countDistinct } from 'drizzle-orm';
import { db, type QueryClient } from '../db/db.js';
import { uploaded_files } from '../db/schema.js';

type UploadData = InferInsertModel<typeof uploaded_files>;

export const UploadedFilesRepository = {
  //insert uploaded file to uploaded_files table
  async insertFileToDb(uploadData: UploadData, tx: QueryClient = db) {
    const [result] = await db
      .insert(uploaded_files)
      .values(uploadData)
      .returning();
    return result;
  },

  //get document info (id, userId, title, filePath, fileHash, createdAt) by owner id
  async getDocInfoByOwner(
    userId: number,
    limit: number = 0,
    offset: number = 0,
  ) {
    return await db
      .select({
        id: uploaded_files.id,
        userId: uploaded_files.user_id,
        title: uploaded_files.filename,
        filePath: uploaded_files.file_path,
        fileHash: uploaded_files.file_hash,
        createdAt: uploaded_files.created_at,
      })
      .from(uploaded_files)
      .where(eq(uploaded_files.user_id, userId))
      .orderBy(desc(uploaded_files.created_at))
      .limit(limit)
      .offset(offset);
  },

  async countDocumentsOwned(userId: number) {
    return await db
      .select({ totalDocuments: countDistinct(uploaded_files.user_id) ?? 0 })
      .from(uploaded_files)
      .where(eq(uploaded_files.user_id, userId));
  },

  //get documents id and extracted text by owner id
  async getDocIdAndTextByDocIdOwnerId(docId: number, userId: number) {
    const [row] = await db
      .select({
        id: uploaded_files.id,
        extracted_text: uploaded_files.extracted_text,
      })
      .from(uploaded_files)
      .where(
        and(
          eq(uploaded_files.id, docId),
          eq(uploaded_files.user_id, userId), // make sure current user owns the file
        ),
      );
    return row;
  },

  async isDocOwnedByOwnerId(docId: number, userId: number) {
    const ownerRecord = await db
      .select({ docId: uploaded_files.id })
      .from(uploaded_files)
      .where(
        and(eq(uploaded_files.id, docId), eq(uploaded_files.user_id, userId)),
      );
    return ownerRecord?.length > 0;
  },

  //delete documents by document id and owner id
  async deleteDocByDocIdOwnerId(docId: number, userId: number) {
    const [deleted] = await db
      .delete(uploaded_files)
      .where(
        and(eq(uploaded_files.id, docId), eq(uploaded_files.user_id, userId)),
      )
      .returning();

    return deleted;
  },
};
