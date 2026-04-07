
import type {InferInsertModel} from 'drizzle-orm';
import { eq, desc, sql, count } from 'drizzle-orm';
import { db, type QueryClient } from '../db/db.js';
import { attempt_answers_db, questions_db } from '../db/schema.js';

type AttemptAnswersInsertData = InferInsertModel<typeof attempt_answers_db>;

export const AttemptAnswersRepo = {
  
  //record what answer user chose for a question
  async insertAttemptAnswer(data: AttemptAnswersInsertData[], tx: QueryClient = db){
    await tx.insert(attempt_answers_db).values(data)
  },

  //get percentage of how many got a question right
  async getQuestionCorrectionRate(quizId: number){
    // Step 1 — one row per (user, question): true only if they NEVER got it wrong
    const perStudentPerQuestion = db
      .select({
        question_id: attempt_answers_db.question_id,
        user_id: attempt_answers_db.user_id,
        got_it_right: sql<boolean>`bool_and(${attempt_answers_db.is_correct})`.as('got_it_right'),
      })
      .from(attempt_answers_db)
      .where(eq(attempt_answers_db.quiz_id, quizId))
      .groupBy(attempt_answers_db.question_id, attempt_answers_db.user_id)
      .as('per_student');

    // Step 2 — across all students, what % got it right?
    const result = await db
      .select({
        questionId: perStudentPerQuestion.question_id,
        questionText: questions_db.question_text,
        totalStudents: count(perStudentPerQuestion.user_id),
        gotRight: sql<number>`sum(case when ${perStudentPerQuestion.got_it_right} then 1 else 0 end)`,
        successRate: sql<number>`round(avg(case when ${perStudentPerQuestion.got_it_right} then 100 else 0 end))`,
      })
      .from(perStudentPerQuestion)
      .innerJoin(questions_db, eq(perStudentPerQuestion.question_id, questions_db.id,))
      .groupBy(perStudentPerQuestion.question_id, questions_db.question_text)
      .orderBy(({successRate})=> desc(successRate));

    return result ?? null;
  }
};