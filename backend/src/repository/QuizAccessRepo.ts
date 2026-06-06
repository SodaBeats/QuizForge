import { db, type QueryClient } from '../db/db.js';
import { quiz_access_db } from '../db/schema.js';

export const QuizAccessRepo = {
  async insert(quizId: number, classIds: number[], tx: QueryClient = db) {
    const result = await db
      .insert(quiz_access_db)
      .values(
        classIds.map((classId) => ({ quiz_id: quizId, class_id: classId })),
      )
      .returning();

    return result.length > 0 ? true : false;
  },
};
