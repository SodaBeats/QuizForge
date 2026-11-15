import 'dotenv/config';
import { Pool } from 'pg';
import readline from 'node:readline/promises';
import { assertSafeDatabase } from './guards.js';

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

/** Parse host + database name from the connection string for display/confirmation. */
function parseTarget(databaseUrl: string): { host: string; database: string } {
  try {
    const url = new URL(databaseUrl);
    const database = url.pathname.replace(/^\//, '');
    return { host: url.host, database: database || '(unknown)' };
  } catch {
    return { host: '(unparseable URL)', database: '(unknown)' };
  }
}

async function confirm(database: string): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = (
      await rl.question(`Type the database name "${database}" to confirm wipe: `)
    ).trim();
    if (answer !== database) {
      throw new Error(
        `Confirmation mismatch (typed "${answer}") — aborting. Nothing was wiped.`,
      );
    }
  } finally {
    rl.close();
  }
}

async function main() {
  // Fail-closed guard (DATABASE_URL set, DEV_HOST_HINT set, URL contains hint host)
  const databaseUrl = assertSafeDatabase();
  const { host, database } = parseTarget(databaseUrl);
  console.log(`[wipe] Target → host=${host} db=${database}`);

  if (!process.argv.includes('--yes')) {
    await confirm(database);
  } else {
    console.log('[wipe] --yes passed — skipping typed confirmation (guard still applied).');
  }

  // Own pool — intentionally does NOT import src/db/db.ts (which demands JWT secrets)
  const pool = new Pool({ connectionString: databaseUrl, connectionTimeoutMillis: 10000 });
  try {
    // Dynamic list so no table can be missed (globalSetup's hardcoded list omits
    // classes_db, students_classes_db, quiz_access_db)
    const { rows } = await pool.query(
      `SELECT table_name
         FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name`,
    );

    if (rows.length === 0) {
      console.log('[wipe] Nothing to wipe — no tables in the public schema.');
      return;
    }

    const list = rows.map((r) => quoteIdent(r.table_name)).join(', ');
    await pool.query(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
    console.log(`[wipe] Truncated ${rows.length} table(s) — RESTART IDENTITY CASCADE.`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[wipe] FAILED:', err instanceof Error ? err.message : err);
  process.exit(1);
});
