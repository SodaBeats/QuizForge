import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import pkg from 'pg';
const { Pool } = pkg;

export default async function globalTeardown() {
  dotenv.config({ path: '.env.test' });

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('[globalTeardown] No DATABASE_URL found, skipping...');
    return;
  }

  // 1. Initialize the correct driver for CI/Local Postgres
  const pool = new Pool({ connectionString: dbUrl });
  const db = drizzle(pool);

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
    await pool.end();
    console.log('[globalTeardown] Connection closed. Done.\n');
  }
}