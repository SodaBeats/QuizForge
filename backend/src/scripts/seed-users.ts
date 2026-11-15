import 'dotenv/config';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/node-postgres';
import { inArray } from 'drizzle-orm';
import { users } from '../db/schema.js';
import { assertSafeDatabase } from './guards.js';

const SEED_PASSWORD = 'password';

const seedUsers = [
  { first_name: 'Test', last_name: 'Teacher', email: 'teacher@test.com', role: 'teacher' as const },
  { first_name: 'Test', last_name: 'Student 1', email: 'student1@test.com', role: 'student' as const },
  { first_name: 'Test', last_name: 'Student 2', email: 'student2@test.com', role: 'student' as const },
  { first_name: 'Test', last_name: 'Student 3', email: 'student3@test.com', role: 'student' as const },
  { first_name: 'Test', last_name: 'Student 4', email: 'student4@test.com', role: 'student' as const },
  { first_name: 'Test', last_name: 'Student 5', email: 'student5@test.com', role: 'student' as const },
];

async function main() {
  // Fail-closed guard — same as wipe-db.ts
  const databaseUrl = assertSafeDatabase();

  // Own pool — intentionally does NOT import src/db/db.ts (which demands JWT secrets)
  const pool = new Pool({ connectionString: databaseUrl, connectionTimeoutMillis: 10000 });
  try {
    const db = drizzle(pool, { schema: { users } });
    const emails = seedUsers.map((u) => u.email);

    // Fail if any target email already exists (run wipe first)
    const existing = await db
      .select({ email: users.email })
      .from(users)
      .where(inArray(users.email, emails));

    if (existing.length > 0) {
      const conflicts = existing.map((r) => r.email).join(', ');
      throw new Error(
        `Refusing to seed — ${existing.length} of ${seedUsers.length} emails already exist: ${conflicts}. ` +
          'Run `npm run db:wipe` first (or delete these users) and retry.',
      );
    }

    const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
    await db
      .insert(users)
      .values(seedUsers.map((u) => ({ ...u, password_hash: passwordHash })));

    console.log(`[seed] Inserted ${seedUsers.length} users (password for all: "${SEED_PASSWORD}"):`);
    for (const u of seedUsers) {
      console.log(`[seed]   ${u.email.padEnd(20)} role=${u.role}`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[seed] FAILED:', err instanceof Error ? err.message : err);
  process.exit(1);
});
