import 'dotenv/config';
import * as schema from './schema.js';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');

let db;
let pool;

if (process.env.NODE_ENV === 'test') {
  // CI/test environment — uses standard pg driver to connect to local Postgres
  const { drizzle } = await import('drizzle-orm/node-postgres');
  const { Pool } = await import('pg');

  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle(pool, { schema });
} 
else {
  // Production/dev — uses Neon serverless driver
  const { drizzle } = await import('drizzle-orm/neon-http');
  const { neon } = await import('@neondatabase/serverless');

  const sql = neon(process.env.DATABASE_URL);
  db = drizzle(sql, { schema });
}

export { db, pool };