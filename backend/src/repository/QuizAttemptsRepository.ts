
import type { InferInsertModel } from 'drizzle-orm';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/db.js';
import { quiz_attempts_db } from '../db/schema.js';

type AttemptInsertData = InferInsertModel<typeof quiz_attempts_db>;
type AttemptUpdateData = Partial<AttemptInsertData>;

export const QuizAttemptsRepo = {

  //create attempt, return start time and attempt id
  async createAttempt(data: AttemptInsertData){
    const [inserted] = await db.insert(quiz_attempts_db)
      .values(data)
      .returning({
        attemptStart: quiz_attempts_db.created_at,
        attemptId: quiz_attempts_db.id
      });
    return inserted ?? null;
  },

  //update attempt
  async updateAttempt(data: AttemptUpdateData, quizId: number, attemptId: number){
    await db.update(quiz_attempts_db)
      .set(data).where(and(
        eq(quiz_attempts_db.quiz_id, quizId), eq(quiz_attempts_db.id, attemptId)
      ));
  },

  //get existing attempt
  async getExistingAttempt(quizId: number, userId: number){
    const [attempt] = await db.select({
      id: quiz_attempts_db.id,
      start: quiz_attempts_db.created_at
    })
      .from(quiz_attempts_db)
      .where(and(
        eq(quiz_attempts_db.quiz_id, quizId),
        eq(quiz_attempts_db.user_id, userId),
        eq(quiz_attempts_db.status, 'in-progress')))
      .limit(1);

    return attempt ?? null;
  },

};