
import type { InferInsertModel } from "drizzle-orm";
import { eq, count } from 'drizzle-orm';
import { db } from '../db/db.js';
import { quizzes_db, quiz_questions_db } from "../db/schema.js";

type QuizInputData = InferInsertModel<typeof quizzes_db>;
type QuizUpdateData = Partial<QuizInputData>;

export const UserQuizzesRepository = {

  //insert quiz to table
  async insertNewQuiz(data: QuizInputData){
    const [quiz] = await db.insert(quizzes_db).values(data).returning({id: quizzes_db.id});
    return quiz ?? null;
  },

  //get all quizzes related to user
  async getAllUserQuizzes(userId: number){
    const quizzes = await db.select({
          id: quizzes_db.id,
          quizTitle: quizzes_db.quiz_title,
          description: quizzes_db.quiz_description,
          shareToken: quizzes_db.share_token,
          timeLimit: quizzes_db.time_limit,
          maxAttempts: quizzes_db.max_attempts,
          dueDate: quizzes_db.due_date,
          status: quizzes_db.status,
          questionCount: count(quiz_questions_db.question_id),
        })
        .from(quizzes_db)
        // Join quizzes to the junction table where IDs match
        .leftJoin(
          quiz_questions_db, 
          eq(quizzes_db.id, quiz_questions_db.quiz_id)
        )
        .where(eq(quizzes_db.user_id, userId))
        //group by quiz ID to get individual counts per quiz
        .groupBy(quizzes_db.id);

    return quizzes ?? null;
  },

  //update quiz and return all data
  async updateQuizDataReturnAll(data: QuizUpdateData, quizId: number){
    const [updated] = await db.update(quizzes_db).set(data).where(eq(quizzes_db.id, quizId)).returning();
    return updated;
  },

  
};