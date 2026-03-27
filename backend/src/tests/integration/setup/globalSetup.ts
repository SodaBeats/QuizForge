// src/tests/integration/setup/globalSetup.ts
//
// Runs ONCE before the entire test suite.
// Responsibilities:
//   1. Load .env.test so DATABASE_URL points at your test DB
//   2. Run drizzle-kit push to make sure the schema is up to date
//   3. Seed one teacher + one student that all test files can rely on

import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';
import {
  users,
  uploaded_files,
  questions_db,
  quizzes_db,
  quiz_questions_db,
  quiz_attempts_db,
  refresh_tokens,
} from '../../../db/schema.js';

export default async function globalSetup() {
  // ── 1. Load test environment variables ──────────────────────────────────
  dotenv.config({ path: '.env.test' });

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in .env.test');
  }

  // ── 2. Push schema to test DB (safe to run repeatedly) ──────────────────
  try{
    console.log('\n[globalSetup] Pushing schema to test database...');
    execSync('npx drizzle-kit push', {
      stdio: 'inherit',
      env: { ...process.env },
    });
  }catch(error){
    console.error("❌ ERROR: Database sync failed!");
    process.exit(1);
  }

  // ── 3. Wipe all tables in the correct FK order ───────────────────────────
  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  console.log('[globalSetup] Cleaning test database...');
  try {
  // We use raw SQL because TRUNCATE is significantly faster than DELETE 
  // and CASCADE solves all Foreign Key ordering issues instantly.
    await sql`
      TRUNCATE TABLE 
        "quiz_attempts_db", 
        "quiz_questions_db", 
        "quizzes_db", 
        "questions_db", 
        "uploaded_files", 
        "refresh_tokens", 
        "users" 
      RESTART IDENTITY CASCADE;
    `;
    console.log('✅ Database wiped clean.');
  } catch (error) {
    console.error('❌ Nuclear cleanup failed:', error);
    throw error; // Force the test to stop if we can't clean the DB
  }

  // ── 4. Seed a teacher and a student ─────────────────────────────────────
  console.log('[globalSetup] Seeding test users...');

  const teacherHash = await bcrypt.hash('TeacherPass1!', 10);
  const studentHash = await bcrypt.hash('StudentPass1!', 10);

  const [teacher] = await db
    .insert(users)
    .values({
      first_name: 'Test',
      last_name: 'Teacher',
      email: 'teacher@test.com',
      password_hash: teacherHash,
      role: 'teacher',
    })
    .returning({ id: users.id });

  const [student] = await db
    .insert(users)
    .values({
      first_name: 'Test',
      last_name: 'Student',
      email: 'student@test.com',
      password_hash: studentHash,
      role: 'student',
    })
    .returning({ id: users.id });

  console.log(
    `[globalSetup] Done. Teacher ID=${teacher?.id}, Student ID=${student?.id}\n`
  );
}
