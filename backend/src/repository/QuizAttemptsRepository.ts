
import type { InferInsertModel } from 'drizzle-orm';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/db.js';
import { quiz_attempts_db } from '../db/schema.js';

type AttemptInsertData = InferInsertModel<typeof quiz_attempts_db>;
type AttemptUpdataData = Partial<AttemptInsertData>;

export const QuizAttemptsRepo = {

  //update attempt
  async updateAttempt(data: AttemptUpdataData, quizId: number, attemptId: number){
    await db.update(quiz_attempts_db)
      .set(data).where(and(
        eq(quiz_attempts_db.quiz_id, quizId), eq(quiz_attempts_db.id, attemptId)
      ));
  },

};