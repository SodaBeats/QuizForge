import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { users } from '../../../db/schema.js';

export default async function globalSetup() {
  dotenv.config({ path: '.env.test' });

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  // Push schema
  execSync('npx drizzle-kit push', {
    stdio: 'inherit',
    env: { ...process.env },
  });

  // Create its OWN pg connection — does not import db.ts at all
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema: { users } });

  try {
    await db.execute(sql`
      TRUNCATE TABLE 
        "quiz_attempts_db", "quiz_questions_db", "quizzes_db",
        "questions_db", "uploaded_files", "refresh_tokens", "users"
      RESTART IDENTITY CASCADE;
    `);

    const teacherHash = await bcrypt.hash('TeacherPass1!', 1);
    const studentHash = await bcrypt.hash('StudentPass1!', 1);

    const [teacher] = await db.insert(users).values({
      first_name: 'Test', last_name: 'Teacher',
      email: 'teacher@test.com',
      password_hash: teacherHash, role: 'teacher',
    }).returning();

    const [student] = await db.insert(users).values({
      first_name: 'Test', last_name: 'Student',
      email: 'student@test.com',
      password_hash: studentHash, role: 'student',
    }).returning();

    console.log(`[globalSetup] Seeded: Teacher(${teacher?.id}), Student(${student?.id})`);

  } finally {
    // Close its own pool — not db.ts's pool
    await pool.end();
  }
}