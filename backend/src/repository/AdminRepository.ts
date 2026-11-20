import bcrypt from 'bcrypt';
import {
  and,
  count,
  desc,
  eq,
  isNull,
  sql,
} from 'drizzle-orm';
import { db } from '../db/db.js';
import {
  quizzes_db,
  refresh_tokens,
  users,
} from '../db/schema.js';

export type AdminRole = 'student' | 'teacher' | 'admin';

export const AdminRepository = {
  async getStats() {
    const [[teachers], [students], [exams], [pendingTeachers]] =
      await Promise.all([
        db
          .select({ value: count(users.id).mapWith(Number) })
          .from(users)
          .where(eq(users.role, 'teacher')),
        db
          .select({ value: count(users.id).mapWith(Number) })
          .from(users)
          .where(eq(users.role, 'student')),
        db
          .select({ value: count(quizzes_db.id).mapWith(Number) })
          .from(quizzes_db),
        db
          .select({ value: count(users.id).mapWith(Number) })
          .from(users)
          .where(
            and(
              eq(users.role, 'teacher'),
              eq(users.is_verified, false),
              isNull(users.suspended_at),
            ),
          ),
      ]);

    return {
      teachers: teachers?.value ?? 0,
      students: students?.value ?? 0,
      exams: exams?.value ?? 0,
      pendingTeachers: pendingTeachers?.value ?? 0,
    };
  },

  async getUsers(options: {
    role?: AdminRole;
    verified?: boolean;
    page: number;
    limit: number;
  }) {
    const filters = [];

    if (options.role) {
      filters.push(eq(users.role, options.role));
    }

    if (options.role === 'teacher' && options.verified === false) {
      filters.push(eq(users.is_verified, false));
      filters.push(isNull(users.suspended_at));
    } else if (options.verified !== undefined) {
      filters.push(eq(users.is_verified, options.verified));
    }

    const where = filters.length > 0 ? and(...filters) : undefined;
    const offset = (options.page - 1) * options.limit;

    const [countResult] = await db
      .select({ total: count(users.id).mapWith(Number) })
      .from(users)
      .where(where);

    const data = await db
      .select({
        id: users.id,
        first_name: users.first_name,
        last_name: users.last_name,
        email: users.email,
        role: users.role,
        is_verified: users.is_verified,
        suspended_at: users.suspended_at,
        created_at: users.created_at,
      })
      .from(users)
      .where(where)
      .orderBy(desc(users.created_at), desc(users.id))
      .limit(options.limit)
      .offset(offset);

    return {
      data: data.map((user) => ({
        ...user,
        suspended_at: user.suspended_at?.toISOString() ?? null,
        created_at: user.created_at.toISOString(),
      })),
      total: countResult?.total ?? 0,
    };
  },

  async findByEmail(email: string) {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`lower(${users.email}) = lower(${email})`)
      .limit(1);
    return user ?? null;
  },

  async createUser(data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    role: AdminRole;
    is_verified: boolean;
  }) {
    const password_hash = await bcrypt.hash(data.password, 10);
    const [created] = await db
      .insert(users)
      .values({
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password_hash,
        role: data.role,
        is_verified: data.is_verified,
      })
      .returning({ id: users.id });
    return created ?? null;
  },

  async findById(id: number) {
    const [user] = await db
      .select({
        id: users.id,
        first_name: users.first_name,
        last_name: users.last_name,
        email: users.email,
        role: users.role,
        is_verified: users.is_verified,
        suspended_at: users.suspended_at,
        created_at: users.created_at,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user ?? null;
  },

  async updateUser(
    id: number,
    data: { role?: AdminRole; is_verified?: boolean },
  ) {
    const [updated] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning({ id: users.id });
    return updated ?? null;
  },

  async suspendUser(id: number) {
    return db.transaction(async (tx) => {
      const [updated] = await tx
        .update(users)
        .set({ suspended_at: new Date() })
        .where(eq(users.id, id))
        .returning({ id: users.id });

      if (!updated) return null;

      await tx.delete(refresh_tokens).where(eq(refresh_tokens.user_id, id));
      return updated;
    });
  },

  async unsuspendUser(id: number) {
    const [updated] = await db
      .update(users)
      .set({ suspended_at: null })
      .where(eq(users.id, id))
      .returning({ id: users.id });
    return updated ?? null;
  },

  async deleteUser(id: number) {
    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });
    return deleted ?? null;
  },

  async getExams(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const [countResult] = await db
      .select({ total: count(quizzes_db.id).mapWith(Number) })
      .from(quizzes_db);

    const data = await db
      .select({
        id: quizzes_db.id,
        quiz_title: quizzes_db.quiz_title,
        status: quizzes_db.status,
        due_date: quizzes_db.due_date,
        created_at: quizzes_db.created_at,
        teacher: {
          first_name: users.first_name,
          last_name: users.last_name,
        },
      })
      .from(quizzes_db)
      .innerJoin(users, eq(quizzes_db.user_id, users.id))
      .orderBy(desc(quizzes_db.created_at), desc(quizzes_db.id))
      .limit(limit)
      .offset(offset);

    return {
      data: data.map((exam) => ({
        ...exam,
        due_date: exam.due_date?.toISOString() ?? null,
        created_at: exam.created_at.toISOString(),
      })),
      total: countResult?.total ?? 0,
    };
  },
};
