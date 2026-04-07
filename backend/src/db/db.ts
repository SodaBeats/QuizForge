import 'dotenv/config';
import * as schema from './schema.js';

// ── Drivers ───────────────────────────────────────────────────────────────────
import { Pool } from 'pg';
import { drizzle as drizzlePg, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { neon } from '@neondatabase/serverless';
import { drizzle as drizzleNeon, NeonHttpDatabase } from 'drizzle-orm/neon-http';

import { PgTransaction } from 'drizzle-orm/pg-core';
import { NeonTransaction } from 'drizzle-orm/neon-http';

// ── Types ─────────────────────────────────────────────────────────────────────
export type DB = NodePgDatabase<typeof schema> | NeonHttpDatabase<typeof schema>;
export type AnyTransaction = PgTransaction<any, typeof schema, any> | NeonTransaction<typeof schema, any>;
export type QueryClient = DB | AnyTransaction;

// ── Env Guards ────────────────────────────────────────────────────────────────
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
if (!process.env.REFRESH_TOKEN_SECRET) throw new Error('REFRESH_TOKEN_SECRET is required');

// ── Driver Selection ──────────────────────────────────────────────────────────
let db: DB;
let pool: Pool | null = null;

if (process.env.NODE_ENV === 'test') {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    min: 1,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  db = drizzlePg(pool, { schema });
} else {
  const sql = neon(process.env.DATABASE_URL);
  db = drizzleNeon(sql, { schema });
}

export { db, pool };