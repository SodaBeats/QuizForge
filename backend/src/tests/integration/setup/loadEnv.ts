// src/tests/integration/setup/loadEnv.ts
//
// This file is referenced in jest.config.js under setupFilesAfterFramework.
// It runs inside each Jest worker process so that process.env has the
// test database URL and JWT secret before any test file imports your app.

import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

if (!process.env.DATABASE_URL) {
  throw new Error("FATAL: DATABASE_URL not found during test setup!");
}

console.log("✅ Environment Loaded Successfully");