import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../../../db/schema.js';

export default async function globalTeardown() {
  dotenv.config({ path: '.env.test' });

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('[globalTeardown] No DATABASE_URL found, skipping...');
    return;
  }

  const pool = new Pool({connectionString: process.env.DATABASE_URL});
  const db = drizzle(pool, {schema})

  console.log('\n[globalTeardown] Wiping test database for a clean exit...');

  try {
    // 2. Use the same Nuclear Option to handle Foreign Keys
    await db.execute(sql`
      TRUNCATE TABLE 
        "quiz_attempts_db", 
        "quiz_questions_db", 
        "quizzes_db", 
        "questions_db", 
        "uploaded_files", 
        "refresh_tokens", 
        "users" 
      RESTART IDENTITY CASCADE;
    `);
    console.log('✅ Database wiped clean.');
  } catch (error) {
    // We don't want to crash the whole process if teardown fails, 
    // but we should know why.
    console.error('⚠️ [globalTeardown] Cleanup warning:', error);
  } finally {
    // 3. CRITICAL: Close the pool so Jest can exit
    if(pool) await pool.end();
    console.log('[globalTeardown] Connection closed. Done.\n');
  }
}