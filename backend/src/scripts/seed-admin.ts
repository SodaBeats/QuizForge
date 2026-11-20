import 'dotenv/config';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { users } from '../db/schema.js';

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const firstName = process.env.ADMIN_FIRST_NAME || 'Admin';
const lastName = process.env.ADMIN_LAST_NAME || 'User';

if (!email || !password) {
  console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set.');
  process.exit(1);
}

const main = async () => {
  const databaseUrl = process.env.DEV_DATABASE_URL;
  if (!databaseUrl) {
    console.error('PROD_DATABASE_URL must be set.');
    process.exit(1);
  }
  console.log(`Target DB host: ${new URL(databaseUrl).host}`);

  const pool = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 10000,
  });

  try {
    const db = drizzle(pool, { schema: { users } });
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      // Idempotent: promote the existing account, don't touch the password.
      await db
        .update(users)
        .set({ role: 'admin', is_verified: true, suspended_at: null })
        .where(eq(users.id, existing.id));
      console.log(`Existing user ${email} promoted to admin.`);
      return;
    }

    const password_hash = await bcrypt.hash(password, 12);

    await db.insert(users).values({
      first_name: firstName,
      last_name: lastName,
      email,
      password_hash,
      role: 'admin',
      is_verified: true,
    });

    console.log(`Admin created: ${email}`);
  } finally {
    await pool.end();
  }
};

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .then(() => process.exit(0));
