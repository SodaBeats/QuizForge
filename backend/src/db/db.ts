import 'dotenv/config';
import * as schema from './schema.js';
import { drizzle as drizzlePg, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleNeon, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { Pool } from 'pg';
import { neon } from '@neondatabase/serverless'; 

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

type DB = NodePgDatabase<typeof schema> | NeonHttpDatabase<typeof schema>;

let db: DB;
let pool: Pool | undefined;

if (process.env.NODE_ENV === 'test') {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzlePg(pool, { schema });
} 
else {
  const sql = neon(process.env.DATABASE_URL!);
  db = drizzleNeon(sql, { schema });
}

export { db, pool };