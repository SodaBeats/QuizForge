import { db, type QueryClient } from '../db/db.js';
import { quiz_access_db } from '../db/schema.js';

export const QuizAccessRepo = {
  async insert(quizId: number, classId: number, tx: QueryClient = db) {
    const [result] = await db
      .insert(quiz_access_db)
      .values({ quiz_id: quizId, class_id: classId })
      .returning();

    return result ?? null;
  },
};
