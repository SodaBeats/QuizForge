import 'dotenv/config';
import * as schema from './schema.js';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required');
if (!process.env.REFRESH_TOKEN_SECRET) throw new Error('REFRESH_TOKEN_SECRET is required');

//telling typescript what kind of database driver and what schema
export type DB = NodePgDatabase<typeof schema>;
export type Transaction = Parameters<Parameters<DB['transaction']>[0]>[0];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  min: 1,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const db = drizzle(pool, { schema });

export { db, pool };