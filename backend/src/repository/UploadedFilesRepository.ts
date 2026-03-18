
import type { InferInsertModel } from 'drizzle-orm';
import { db } from '../db/db.js';
import { uploaded_files } from '../db/schema.js';

type UploadData = InferInsertModel<typeof uploaded_files>;

export const UploadedFilesRepository = {

  async insertFileToDb(uploadData: UploadData){
    const [result] = await db.insert(uploaded_files).values(uploadData).returning();
    return result;
  }

};