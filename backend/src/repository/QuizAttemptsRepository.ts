import type { InferInsertModel } from 'drizzle-orm';
import {
  eq,
  and,
  countDistinct,
  avg,
  asc,
  desc,
  max,
  sql,
  inArray,
} from 'drizzle-orm';
import { db, type QueryClient } from '../db/db.js';
import {
  quiz_attempts_db,
  students_classes_db,
  users,
} from '../db/schema.js';

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
        COUNT(DISTINCT a.user_id) AS takers
      FROM teacher_classes tc
      LEFT JOIN ${students_classes_db} sc ON sc.class_id = tc.id
      LEFT JOIN ${quiz_attempts_db} a ON a.user_id = sc.student_id AND a.quiz_id = ${quizId} AND a.status = 'completed'
      GROUP BY tc.id, tc.class_name
      ORDER BY averageScore DESC
    `;

    const result = await db.execute(query);
    return result.rows;
  },

  //GET ALL COMPLETED ATTEMPTS FOR A QUIZ + THE STUDENTS WHO MADE THEM
  // (exam attempts page list). Two result sets so the client keeps doing its
  // own grouping; students carry classIds for the restricted-exam class tabs.
  async getCompletedAttemptsWithStudents(quizId: number) {
    const attempts = await db
      .select({
        id: quiz_attempts_db.id,
        studentId: quiz_attempts_db.user_id,
        rawScore: quiz_attempts_db.raw_score,
        maxPossibleScore: quiz_attempts_db.max_possible_score,
        // NOTE: stand-in for submittedAt until a submitted_at column exists
        // (created_at is when the attempt started, not when it was graded).
        submittedAt: quiz_attempts_db.created_at,
      })
      .from(quiz_attempts_db)
      .where(
        and(
          eq(quiz_attempts_db.quiz_id, quizId),
          eq(quiz_attempts_db.status, 'completed'),
        ),
      )
      .orderBy(desc(quiz_attempts_db.created_at));

    if (attempts.length === 0) return { attempts: [], students: [] };

    const studentIds = [...new Set(attempts.map((a) => a.studentId))];

    const studentRows = await db
      .select({
        id: users.id,
        name: sql<string>`${users.first_name} || ' ' || ${users.last_name}`.as(
          'name',
        ),
        classId: students_classes_db.class_id,
      })
      .from(users)
      .leftJoin(
        students_classes_db,
        eq(students_classes_db.student_id, users.id),
      )
      .where(inArray(users.id, studentIds));

    const studentsById = new Map<
      number,
      { id: number; name: string; classIds: number[] }
    >();
    for (const row of studentRows) {
      const student = studentsById.get(row.id) ?? {
        id: row.id,
        name: row.name,
        classIds: [],
      };
      if (row.classId != null) student.classIds.push(row.classId);
      studentsById.set(row.id, student);
    }

    return { attempts, students: [...studentsById.values()] };
  },
};
