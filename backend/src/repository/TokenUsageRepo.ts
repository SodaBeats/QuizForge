import { and, eq, sql } from 'drizzle-orm';
import { db } from '../db/db.js';
import { token_usage_db } from '../db/schema.js';

export type UsageKind = 'embedding' | 'generation';

export const TokenUsageRepo = {
  async getUsage(userId: number, today: string) {
    const [row] = await db
      .select({
        embedding: token_usage_db.embedding_tokens,
        generation: token_usage_db.generation_tokens,
      })
      .from(token_usage_db)
      .where(
        and(
          eq(token_usage_db.user_id, userId),
          eq(token_usage_db.usage_date, today),
        ),
      );

    return row ?? null;
  },

  async recordUsage(
    userId: number,
    today: string,
    kind: UsageKind,
    tokens: number,
  ) {
    // Explicit branches keep Drizzle's column typing intact
    // (computed keys like [COLUMNS[kind]] widen the type to a string index).
    const values =
      kind === 'embedding'
        ? { user_id: userId, usage_date: today, embedding_tokens: tokens }
        : { user_id: userId, usage_date: today, generation_tokens: tokens };

    const set =
      kind === 'embedding'
        ? {
            embedding_tokens: sql`${token_usage_db.embedding_tokens} + ${tokens}`,
          }
        : {
            generation_tokens: sql`${token_usage_db.generation_tokens} + ${tokens}`,
          };

    await db
      .insert(token_usage_db)
      .values(values)
      .onConflictDoUpdate({
        target: [token_usage_db.user_id, token_usage_db.usage_date],
        set,
      });
  },
};
