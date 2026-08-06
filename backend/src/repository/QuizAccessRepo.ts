import { eq } from 'drizzle-orm';
import { db, type QueryClient } from '../db/db.js';
import { quiz_access_db } from '../db/schema.js';

export const QuizAccessRepo = {
  async insert(quizId: number, classIds: number[], tx: QueryClient = db) {
    const result = await tx
      .insert(quiz_access_db)
      .values(
        classIds.map((classId) => ({ quiz_id: quizId, class_id: classId })),
      )
      .returning();

    return result.length > 0 ? true : false;
  },

  async quizAccess(quizId: number) {
    const result = await db
      .select({ classId: quiz_access_db.class_id })
      .from(quiz_access_db)
      .where(eq(quiz_access_db.quiz_id, quizId));

    return result.length > 0 ? result.map((row) => row.classId) : null;
  },

  async updateAccess(quizId: number, classIds: number[], tx: QueryClient = db) {
    await tx
      .delete(quiz_access_db)
      .where(eq(quiz_access_db.quiz_id, quizId))
      .returning();
    if (classIds.length > 0) {
      const result = await tx
        .insert(quiz_access_db)
        .values(
          classIds.map((classId) => ({ quiz_id: quizId, class_id: classId })),
        )
        .returning();
      return result.length > 0 ? true : false;
    }
    return true;
  },
};
