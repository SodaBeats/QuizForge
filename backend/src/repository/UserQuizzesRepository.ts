import type { InferInsertModel } from 'drizzle-orm';
import { eq, count, and, desc, countDistinct } from 'drizzle-orm';
import { db } from '../db/db.js';
import { quizzes_db, quiz_attempts_db, questions_db } from '../db/schema.js';

type QuizInputData = InferInsertModel<typeof quizzes_db>;
type QuizUpdateData = Partial<QuizInputData>;

export const UserQuizzesRepository = {
  //insert quiz to table
  async insertNewQuiz(data: QuizInputData) {
    const [quiz] = await db.insert(quizzes_db).values(data).returning({
      id: quizzes_db.id,
      userId: quizzes_db.user_id,
      quizTitle: quizzes_db.quiz_title,
      quizDescription: quizzes_db.quiz_description,
      shareToken: quizzes_db.share_token,
      maxAttempts: quizzes_db.max_attempts,
      status: quizzes_db.status,
      dueDate: quizzes_db.due_date,
    });
    return quiz ?? null;
  },

  //get all quizzes related to user
  async getAllUserQuizzes(
    userId: number,
    limit: number = 20,
    offset: number = 0,
  ) {
    const quizzes = await db
      .select({
        id: quizzes_db.id,
        quizTitle: quizzes_db.quiz_title,
        description: quizzes_db.quiz_description,
        shareToken: quizzes_db.share_token,
        maxAttempts: quizzes_db.max_attempts,
        dueDate: quizzes_db.due_date,
        status: quizzes_db.status,
        questionCount: count(questions_db.id),
      })
      .from(quizzes_db)
      .leftJoin(questions_db, eq(quizzes_db.id, questions_db.quiz_id))
      .where(eq(quizzes_db.user_id, userId))
      .groupBy(quizzes_db.id)
      .orderBy(desc(quizzes_db.created_at))
      .limit(limit)
      .offset(offset);
    return quizzes ?? null;
  },

  //update quiz and return all data
  async updateQuizDataReturnAll(data: QuizUpdateData, quizId: number) {
    const [updated] = await db
      .update(quizzes_db)
      .set(data)
      .where(eq(quizzes_db.id, quizId))
      .returning();
    return updated ?? null;
  },

  // get quiz data and attempt count
  async getQuizAndAttemptCount(token: string, userId: number) {
    const [result] = await db
      .select({
        id: quizzes_db.id,
        userId: quizzes_db.user_id,
        quizTitle: quizzes_db.quiz_title,
        quizDescription: quizzes_db.quiz_description,
        shareToken: quizzes_db.share_token,
        maxAttempts: quizzes_db.max_attempts,
        dueDate: quizzes_db.due_date,
        totalAttempts: count(quiz_attempts_db.id),
      })
      .from(quizzes_db)
      .leftJoin(
        quiz_attempts_db,
        and(
          eq(quiz_attempts_db.quiz_id, quizzes_db.id),
          eq(quiz_attempts_db.user_id, userId),
        ),
      )
      .where(eq(quizzes_db.share_token, token.toLowerCase()))
      .groupBy(quizzes_db.id);

    return result;
  },

  //get quiz by token, return quiz id
  async getQuizByToken(token: string | string[]) {
    const actualToken = Array.isArray(token) ? token[0] : token;
    if (!actualToken) return null;

    const [result] = await db
      .select({ id: quizzes_db.id })
      .from(quizzes_db)
      .where(eq(quizzes_db.share_token, actualToken.toLowerCase()));
    return result?.id ?? null;
  },

  //get quiz by id, return user id
  async getQuizById(quizId: number) {
    if (!quizId || Number.isNaN(quizId)) return null;

    const [result] = await db
      .select()
      .from(quizzes_db)
      .where(eq(quizzes_db.id, quizId));
    return result ?? null;
  },

  async countTotalQuizzes(userId: number) {
    const [result] = await db
      .select({ totalQuizzes: count(quizzes_db.id) })
      .from(quizzes_db)
      .where(eq(quizzes_db.user_id, userId));
    return result ? result.totalQuizzes : 0;
  },

  async deleteQuiz(userId: number, quizId: number) {
    const [result] = await db
      .delete(quizzes_db)
      .where(and(eq(quizzes_db.user_id, userId), eq(quizzes_db.id, quizId)))
      .returning();

    return result ? { quizId: result.id } : null;
  },
};
