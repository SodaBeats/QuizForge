import 'dotenv/config';

/**
 * Safety guard shared by destructive/db-seeding scripts (wipe-db, seed-users).
 *
 * Aborts unless ALL of the following hold:
 *   1. DATABASE_URL is set
 *   2. DEV_HOST_HINT is set
 *   3. DATABASE_URL contains the DEV_HOST_HINT host
 *
 * No bypass flag — a failed check always throws.
 * Returns DATABASE_URL on success.
 */
export function assertSafeDatabase(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('[guard] DATABASE_URL is not set — aborting.');
  }

  const devHostHint = process.env.DEV_HOST_HINT;
  if (!devHostHint) {
    throw new Error(
      '[guard] DEV_HOST_HINT is not set — refusing to touch an unverified database. Abort.',
    );
  }

  if (!databaseUrl.includes(devHostHint)) {
    throw new Error(
      `[guard] DATABASE_URL does not contain DEV_HOST_HINT host (${devHostHint}) — ` +
        'this does not look like the dev database. Abort.',
    );
  }

  return databaseUrl;
}
