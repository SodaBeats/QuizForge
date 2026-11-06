import type { InferInsertModel } from 'drizzle-orm';
import {
  eq,
  count,
  and,
  desc,
  countDistinct,
  sql,
  gt,
  asc,
  lte,
  avg,
  max,
} from 'drizzle-orm';
import { db, type QueryClient } from '../db/db.js';
import {
  quizzes_db,
  quiz_attempts_db,
  questions_db,
  classes_db,
  quiz_access_db,
  students_classes_db,
} from '../db/schema.js';

type QuizInputData = InferInsertModel<typeof quizzes_db>;
type QuizUpdateData = Partial<QuizInputData>;

function getDashboardSubmissionCounts(userId: number) {
  const restrictedCounts = db
    .select({
      quizId: quiz_access_db.quiz_id,
      assignedCount: countDistinct(students_classes_db.student_id).as(
        'assignedCount',
      ),
      submittedCount:
        sql<number>`count(distinct case when ${quiz_attempts_db.id} is not null then ${students_classes_db.student_id} end)::int`.as(
          'restricted_submitted_count',
        ),
    })
    .from(quiz_access_db)
    .innerJoin(
      classes_db,
      and(
        eq(quiz_access_db.class_id, classes_db.id),
        eq(classes_db.teacher_id, userId),
      ),
    )
    .innerJoin(
      students_classes_db,
      eq(students_classes_db.class_id, classes_db.id),
    )
    .leftJoin(
      quiz_attempts_db,
      and(
        eq(quiz_attempts_db.quiz_id, quiz_access_db.quiz_id),
        eq(quiz_attempts_db.user_id, students_classes_db.student_id),
        eq(quiz_attempts_db.status, 'completed'),
      ),
    )
    .groupBy(quiz_access_db.quiz_id)
    .as('restricted_quiz_counts');

  const unrestrictedCounts = db
    .select({
      quizId: quiz_attempts_db.quiz_id,
      submittedCount: countDistinct(quiz_attempts_db.user_id).as(
        'unrestricted_submitted_count',
      ),
    })
    .from(quiz_attempts_db)
    .innerJoin(
      quizzes_db,
      and(
        eq(quiz_attempts_db.quiz_id, quizzes_db.id),
        eq(quizzes_db.user_id, userId),
        eq(quizzes_db.accessibility, 'anyone'),
      ),
    )
    .where(eq(quiz_attempts_db.status, 'completed'))
    .groupBy(quiz_attempts_db.quiz_id)
    .as('unrestricted_quiz_counts');

  return { restrictedCounts, unrestrictedCounts };
}

export const UserQuizzesRepository = {
  //insert quiz to table
  async insertNewQuiz(data: QuizInputData, tx: QueryClient = db) {
    const [quiz] = await tx.insert(quizzes_db).values(data).returning({
      id: quizzes_db.id,
      userId: quizzes_db.user_id,
      quizTitle: quizzes_db.quiz_title,
      quizDescription: quizzes_db.quiz_description,
      shareToken: quizzes_db.share_token,
      accessibility: quizzes_db.accessibility,
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
        accessibility: quizzes_db.accessibility,
        questionCount: countDistinct(questions_db.id),
        // Aggregate class_id integers into a array of numbers
        classIds: sql<number[]>`
        COALESCE(
          json_agg(DISTINCT ${quiz_access_db.class_id}) 
          FILTER (WHERE ${quiz_access_db.class_id} IS NOT NULL), 
          '[]'::json
        )
      `.as('class_ids'),
      })
      .from(quizzes_db)
      .leftJoin(questions_db, eq(quizzes_db.id, questions_db.quiz_id))
      .leftJoin(quiz_access_db, eq(quizzes_db.id, quiz_access_db.quiz_id))
      .where(eq(quizzes_db.user_id, userId))
      .groupBy(quizzes_db.id)
      .orderBy(desc(quizzes_db.created_at))
      .limit(limit)
      .offset(offset);

    return quizzes ?? null;
  },

  //update quiz and return all data
  async updateQuizDataReturnAll(
    data: QuizUpdateData,
    quizId: number,
    tx: QueryClient = db,
  ) {
    const [updated] = await tx
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
        accessibility: quizzes_db.accessibility,
        shareToken: quizzes_db.share_token,
        maxAttempts: quizzes_db.max_attempts,
        status: quizzes_db.status,
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

  async countActiveExams(userId: number) {
    const [result] = await db
      .select({ activeExams: count(quizzes_db.id) })
      .from(quizzes_db)
      .where(
        and(
          eq(quizzes_db.user_id, userId),
          eq(quizzes_db.status, 'published'),
          gt(quizzes_db.due_date, new Date()),
        ),
      );
    return result ? result.activeExams : 0;
  },

  async countDraftQuizzes(userId: number) {
    const [result] = await db
      .select({ drafts: count(quizzes_db.id) })
      .from(quizzes_db)
      .where(
        and(eq(quizzes_db.user_id, userId), eq(quizzes_db.status, 'draft')),
      );
    return result?.drafts ?? 0;
  },

  async getAverageScoreUsingBestAttempts(userId: number) {
    const bestAttempts = db
      .select({
        quizId: quiz_attempts_db.quiz_id,
        studentId: quiz_attempts_db.user_id,
        bestScore: max(quiz_attempts_db.score).mapWith(Number).as('bestScore'),
      })
      .from(quiz_attempts_db)
      .innerJoin(quizzes_db, eq(quiz_attempts_db.quiz_id, quizzes_db.id))
      .where(
        and(
          eq(quizzes_db.user_id, userId),
          eq(quiz_attempts_db.status, 'completed'),
        ),
      )
      .groupBy(quiz_attempts_db.quiz_id, quiz_attempts_db.user_id)
      .as('best_attempts');

    const quizAverages = db
      .select({ average: avg(bestAttempts.bestScore).as('average') })
      .from(bestAttempts)
      .groupBy(bestAttempts.quizId)
      .as('quiz_averages');

    const [result] = await db
      .select({
        averageScore:
          sql<number>`COALESCE(ROUND(AVG(${quizAverages.average}), 1), 0)::float`.mapWith(
            Number,
          ),
      })
      .from(quizAverages);

    return result?.averageScore ?? 0;
  },

  async getActiveExams(userId: number, page: number = 1, pageSize: number = 5) {
    const now = new Date();
    const activeFilter = and(
      eq(quizzes_db.user_id, userId),
      eq(quizzes_db.status, 'published'),
      gt(quizzes_db.due_date, now),
    );
    const [{ total } = { total: 0 }] = await db
      .select({ total: count(quizzes_db.id) })
      .from(quizzes_db)
      .where(activeFilter);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(Math.max(page, 1), totalPages);

    const { restrictedCounts, unrestrictedCounts } =
      getDashboardSubmissionCounts(userId);

    const items = await db
      .select({
        id: quizzes_db.id,
        quizTitle: quizzes_db.quiz_title,
        dueDate: quizzes_db.due_date,
        accessibility: quizzes_db.accessibility,
        assignedCount:
          sql<number>`case when ${quizzes_db.accessibility} = 'restricted' then coalesce(${restrictedCounts.assignedCount}, 0) else 0 end`.mapWith(
            Number,
          ),
        submittedCount:
          sql<number>`case when ${quizzes_db.accessibility} = 'restricted' then coalesce(${restrictedCounts.submittedCount}, 0) else coalesce(${unrestrictedCounts.submittedCount}, 0) end`.mapWith(
            Number,
          ),
      })
      .from(quizzes_db)
      .leftJoin(restrictedCounts, eq(restrictedCounts.quizId, quizzes_db.id))
      .leftJoin(
        unrestrictedCounts,
        eq(unrestrictedCounts.quizId, quizzes_db.id),
      )
      .where(activeFilter)
      .orderBy(asc(quizzes_db.due_date), asc(quizzes_db.id))
      .limit(pageSize)
      .offset((currentPage - 1) * pageSize);

    return {
      items,
      total,
      page: currentPage,
      pageSize,
      totalPages,
    };
  },

  async getExpiringExams(
    userId: number,
    page: number = 1,
    pageSize: number = 5,
    hours: number = 72,
  ) {
    const now = new Date();
    const cutoff = new Date(now.getTime() + hours * 60 * 60 * 1000);
    const expiringFilter = and(
      eq(quizzes_db.user_id, userId),
      eq(quizzes_db.status, 'published'),
      gt(quizzes_db.due_date, now),
      lte(quizzes_db.due_date, cutoff),
    );
    const [{ total } = { total: 0 }] = await db
      .select({ total: count(quizzes_db.id) })
      .from(quizzes_db)
      .where(expiringFilter);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(Math.max(page, 1), totalPages);
    const { restrictedCounts, unrestrictedCounts } =
      getDashboardSubmissionCounts(userId);
    const items = await db
      .select({
        id: quizzes_db.id,
        quizTitle: quizzes_db.quiz_title,
        dueDate: quizzes_db.due_date,
        accessibility: quizzes_db.accessibility,
        assignedCount:
          sql<number>`case when ${quizzes_db.accessibility} = 'restricted' then coalesce(${restrictedCounts.assignedCount}, 0) else 0 end`.mapWith(
            Number,
          ),
        submittedCount:
          sql<number>`case when ${quizzes_db.accessibility} = 'restricted' then coalesce(${restrictedCounts.submittedCount}, 0) else coalesce(${unrestrictedCounts.submittedCount}, 0) end`.mapWith(
            Number,
          ),
      })
      .from(quizzes_db)
      .leftJoin(restrictedCounts, eq(restrictedCounts.quizId, quizzes_db.id))
      .leftJoin(
        unrestrictedCounts,
        eq(unrestrictedCounts.quizId, quizzes_db.id),
      )
      .where(expiringFilter)
      .orderBy(asc(quizzes_db.due_date), asc(quizzes_db.id))
      .limit(pageSize)
      .offset((currentPage - 1) * pageSize);

    return {
      items,
      total,
      page: currentPage,
      pageSize,
      totalPages,
    };
  },
};
