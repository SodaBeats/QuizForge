import { and, eq, lt, sql } from 'drizzle-orm';
import { type DB } from '../db/db.js';
import { quiz_attempts_db } from '../db/schema.js';

export async function finalizeExpiredAttempts(db: DB) {
  const closed = await db
    .update(quiz_attempts_db)
    .set({
      status: 'completed',
      attempt_remarks: 'auto-closed (time expired)',
    })
    .where(
      and(
        eq(quiz_attempts_db.status, 'in-progress'),
        lt(quiz_attempts_db.expires_at, sql`now() - interval '30 seconds'`),
      ),
    )
    .returning({ id: quiz_attempts_db.id });

  return closed;
}
