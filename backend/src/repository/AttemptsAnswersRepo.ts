
import type {InferInsertModel} from 'drizzle-orm';
import { and, asc, eq, desc, sql, count } from 'drizzle-orm';
import { db, type QueryClient } from '../db/db.js';
import { attempt_answers_db, questions_db } from '../db/schema.js';

type AttemptAnswersInsertData = InferInsertModel<typeof attempt_answers_db>;

export const AttemptAnswersRepo = {
  
  //record what answer user chose for a question
  async insertAttemptAnswer(data: AttemptAnswersInsertData[], tx: QueryClient = db){
    if(data.length === 0) return;
    await tx
      .insert(attempt_answers_db)
      .values(data)
      .onConflictDoNothing({
        target: [attempt_answers_db.attempt_id, attempt_answers_db.question_id]
      });
  },

  //one attempt's answers joined with their question definitions, in
  //submission order (attempts page detail modal)
  async getAttemptAnswersWithQuestions(attemptId: number) {
    const rows = await db
      .select({
        questionId: attempt_answers_db.question_id,
        questionText: questions_db.question_text,
        questionType: questions_db.question_type,
        optionA: questions_db.option_a,
        optionB: questions_db.option_b,
        optionC: questions_db.option_c,
        optionD: questions_db.option_d,
        chosenAnswer: attempt_answers_db.chosen_answer,
        // snapshot taken at submit time — never read questions_db.correct_answer,
        // which the teacher may have edited since
        correctAnswer: attempt_answers_db.correct_answer,
        isCorrect: attempt_answers_db.is_correct,
        points: attempt_answers_db.points,
        remarks: attempt_answers_db.remarks,
      })
      .from(attempt_answers_db)
      .innerJoin(
        questions_db,
        eq(attempt_answers_db.question_id, questions_db.id),
      )
      .where(eq(attempt_answers_db.attempt_id, attemptId))
      .orderBy(asc(attempt_answers_db.id));

    return rows;
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