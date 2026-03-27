// src/tests/integration/setup/globalTeardown.ts
//
// Runs ONCE after the entire test suite finishes.
// Wipes the test DB clean so the next run always starts fresh.

import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import {
  users,
  uploaded_files,
  questions_db,
  quizzes_db,
  quiz_questions_db,
  quiz_attempts_db,
  refresh_tokens,
} from '../../../db/schema.js';
import { pool } from '../../../db/db.js';

const typedPool = pool as any;

export default async function globalTeardown() {
  dotenv.config({ path: '.env.test' });

  if (!process.env.DATABASE_URL) return;

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql);

  console.log('\n[globalTeardown] Wiping test database...');
  await db.delete(quiz_attempts_db);
  await db.delete(quiz_questions_db);
  await db.delete(quizzes_db);
  await db.delete(questions_db);
  await db.delete(uploaded_files);
  await db.delete(refresh_tokens);
  await db.delete(users);
  if(typedPool) await typedPool.end();

  console.log('[globalTeardown] Done.\n');
}
