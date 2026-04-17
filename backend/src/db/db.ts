import 'dotenv/config';
import * as schema from './schema.js';

// ── Drivers ───────────────────────────────────────────────────────────────────
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { PgTransaction } from 'drizzle-orm/pg-core';

// ── Types ─────────────────────────────────────────────────────────────────────
export type DB = NodePgDatabase<typeof schema>;
export type AnyTransaction = PgTransaction<any, typeof schema, any>;
export type QueryClient = DB | AnyTransaction;

// ── Env Guards ────────────────────────────────────────────────────────────────
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
if (!process.env.REFRESH_TOKEN_SECRET) throw new Error('REFRESH_TOKEN_SECRET is required');

// ── Driver Selection ──────────────────────────────────────────────────────────
// Using pg.Pool for all environments to support transactions natively
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Recommended for Neon/Serverless environments to prevent hanging connections
  min: 1,
  max: process.env.NODE_ENV === 'test' ? 10 : 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Prevent idle connection drops from crashing the process (common with Neon)
pool.on('error', (err) => {
  console.error('[pg pool] Idle client error:', err.message);
});

const db = drizzle(pool, { schema });

export { db, pool };