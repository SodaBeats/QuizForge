import type { InferInsertModel } from 'drizzle-orm';
import { eq, and, countDistinct, avg, asc, desc, max, sql } from 'drizzle-orm';
import { db, type QueryClient } from '../db/db.js';
import { quiz_attempts_db, students_classes_db, users } from '../db/schema.js';

type AttemptInsertData = InferInsertModel<typeof quiz_attempts_db>;
type AttemptUpdateData = Partial<AttemptInsertData>;

export const QuizAttemptsRepo = {
  //create attempt, return start time and attempt id
  async createAttempt(data: AttemptInsertData) {
    const [inserted] = await db
      .insert(quiz_attempts_db)
      .values(data)
      .returning();
    return inserted
      ? {
          attemptStart: inserted.created_at,
          attemptId: inserted.id,
        }
      : null;
  },

  //update attempt
  async updateAttempt(
    data: AttemptUpdateData,
    quizId: number,
    attemptId: number,
    userId: number,
    tx: QueryClient = db,
  ) {
    await tx
      .update(quiz_attempts_db)
      .set(data)
      .where(
        and(
          eq(quiz_attempts_db.quiz_id, quizId),
          eq(quiz_attempts_db.id, attemptId),
          eq(quiz_attempts_db.user_id, userId),
          eq(quiz_attempts_db.status, 'in-progress'),
        ),
      );
  },

  //get existing attempt
  async getExistingAttempt(quizId: number, userId: number) {
    const [attempt] = await db
      .select({
        id: quiz_attempts_db.id,
        start: quiz_attempts_db.created_at,
      })
      .from(quiz_attempts_db)
      .where(
        and(
          eq(quiz_attempts_db.quiz_id, quizId),
          eq(quiz_attempts_db.user_id, userId),
          eq(quiz_attempts_db.status, 'in-progress'),
        ),
      )
      .limit(1);

    return attempt ?? null;
  },

  //get first finished attempt
  async getFirstFinishedAttempt(quizId: number) {
    const [result] = await db
      .select()
      .from(quiz_attempts_db)
      .where(
        and(
          eq(quiz_attempts_db.quiz_id, quizId),
          eq(quiz_attempts_db.status, 'completed'),
        ),
      )
      .orderBy(asc(quiz_attempts_db.created_at))
      .limit(1);

    return result ?? null;
  },

  //delete attempt
  async deleteAttempt(userId: number, quizId: number) {
    const [deletedAttempt] = await db
      .delete(quiz_attempts_db)
      .where(
        and(
          eq(quiz_attempts_db.user_id, userId),
          eq(quiz_attempts_db.quiz_id, quizId),
          eq(quiz_attempts_db.status, 'in-progress'),
        ),
      )
      .returning();

    return deletedAttempt
      ? {
          deletedAttemptId: deletedAttempt.id,
        }
      : null;
  },

  //get total takers and average score
  async getTotalTakersAndAverage(quizId: number) {
    const [result] = await db
      .select({
        totalTakers: countDistinct(quiz_attempts_db.user_id),
        average: avg(quiz_attempts_db.score).mapWith(Number),
      })
      .from(quiz_attempts_db)
      .where(
        and(
          eq(quiz_attempts_db.quiz_id, quizId),
          eq(quiz_attempts_db.status, 'completed'),
        ),
      );

    if (!result) return null;

    return {
      totalTakers: result.totalTakers,
      average: result.average !== null ? Math.round(result.average) : null,
    };
  },

  //GET HIGHEST SCORE AND NAME FROM QUIZ ATTEMPTS
  async getHighestScoreAndName(quizId: number) {
    const [result] = await db
      .select({
        highestScore: quiz_attempts_db.score,
        name: users.first_name,
        lastName: users.last_name,
      })
      .from(quiz_attempts_db)
      .innerJoin(users, eq(quiz_attempts_db.user_id, users.id))
      .where(
        and(
          eq(quiz_attempts_db.quiz_id, quizId),
          eq(quiz_attempts_db.status, 'completed'),
        ),
      )
      .orderBy(desc(quiz_attempts_db.score))
      .limit(1);

    if (!result) return null;

    const { highestScore, name, lastName } = result;

    return {
      highestScore,
      name,
      lastName,
    };
  },

  //GET LOWEST SCORE FROM QUIZ ATTEMPTS
  async getLowestScore(quizId: number) {
    const [result] = await db
      .select({
        lowestScore: quiz_attempts_db.score,
      })
      .from(quiz_attempts_db)
      .where(
        and(
          eq(quiz_attempts_db.quiz_id, quizId),
          eq(quiz_attempts_db.status, 'completed'),
        ),
      )
      .orderBy(asc(quiz_attempts_db.score))
      .limit(1);

    return result?.lowestScore ?? null;
  },

  //GET TOP 5 PERFORMING STUDENTS (UNIQUE)
  async getStudentRanking(quizId: number) {
    const result = await db
      .select({
        studentId: quiz_attempts_db.user_id,
        name: users.first_name,
        lastName: users.last_name,
        score: max(quiz_attempts_db.score).mapWith(Number),
      })
      .from(quiz_attempts_db)
      .innerJoin(users, eq(quiz_attempts_db.user_id, users.id))
      .where(
        and(
          eq(quiz_attempts_db.quiz_id, quizId),
          eq(quiz_attempts_db.status, 'completed'),
        ),
      )
      .groupBy(quiz_attempts_db.user_id, users.first_name, users.last_name)
      .orderBy(desc(max(quiz_attempts_db.score)))
      .limit(5);

    return result;
  },

  //GET THE ATTEMPT WITH HIGHEST SCORE FOR EACH UNIQUE USER
  async getBestAttemptsPerUser(quizId: number) {
    const query = sql`
      WITH ranked_attempts AS (
        SELECT 
          id, 
          user_id, 
          score, 
          created_at,
          ROW_NUMBER() OVER (
            PARTITION BY user_id 
            ORDER BY score DESC, created_at DESC
          ) as rank
        FROM ${quiz_attempts_db}
        WHERE quiz_id = ${quizId}
      )
      SELECT id, user_id as "userId", score, created_at as "createdAt"
      FROM ranked_attempts
      WHERE rank = 1
    `;

    const result = await db.execute(query);

    return result.rows ?? [];
  },

  // Get per-class average
  async getPerClassAverage(quizId: number, teacherId: number) {
    const query = sql`
      WITH teacher_classes AS (
        SELECT id, class_name
        FROM classes_db WHERE teacher_id = ${teacherId}
      )
      SELECT 
        tc.id AS classId,
        tc.class_name AS className,
        COALESCE(ROUND(AVG(a.score), 1), 0) as averageScore,
        COUNT(a.user_id) AS takers
      FROM teacher_classes tc
      LEFT JOIN ${students_classes_db} sc ON sc.class_id = tc.id
      JOIN ${quiz_attempts_db} a ON a.user_id = sc.student_id AND a.quiz_id = ${quizId}
      GROUP BY tc.id, tc.class_name
      ORDER BY averageScore DESC
    `;

    const result = await db.execute(query);
    return result.rows;
  },
};
