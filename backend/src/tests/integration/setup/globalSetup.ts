// src/tests/integration/setup/globalSetup.ts
//
// Runs ONCE before the entire test suite.
// Responsibilities:
//   1. Load .env.test so DATABASE_URL points at your test DB
//   2. Run drizzle-kit push to make sure the schema is up to date
//   3. Seed one teacher + one student that all test files can rely on

import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
// 1. Correct Drizzle import for standard Postgres
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm'; 
import pkg from 'pg';
const { Pool } = pkg;
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

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not set in .env.test or environment');
  }

  // ── 2. Push schema to test DB ────────────────────────────────────────────
  try {
    console.log('\n[globalSetup] Pushing schema to test database...');
    // We pass the environment variables explicitly to the child process
    execSync('npx drizzle-kit push', {
      stdio: 'inherit',
      env: { ...process.env },
    });
  } catch (error) {
    console.error("❌ ERROR: Database sync failed!");
    process.exit(1);
  }

  // ── 3. Initialize Database Connection ────────────────────────────────────
  const pool = new Pool({ connectionString: dbUrl });
  const db = drizzle(pool);

  console.log('[globalSetup] Cleaning and Seeding test database...');

  try {
    // ── 4. Nuclear cleanup with CASCADE ───────────────────────────────────
    // Using db.execute with the 'sql' tag from drizzle-orm
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

    // ── 5. Seed a teacher and a student ───────────────────────────────────
    // Specialist Tip: Use a low salt round (1) in tests to make them FAST
    const teacherHash = await bcrypt.hash('TeacherPass1!', 1);
    const studentHash = await bcrypt.hash('StudentPass1!', 1);

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

    console.log(`[globalSetup] Seeded: Teacher(${teacher?.id}), Student(${student?.id})`);

  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  } finally {
    // ── 6. Close the pool ──────────────────────────────────────────────────
    // This is vital! If you don't close the pool, the setup process might
    // hang and prevent Jest from starting the actual tests.
    await pool.end();
    console.log('[globalSetup] Setup connection closed. Starting tests...\n');
  }
}
