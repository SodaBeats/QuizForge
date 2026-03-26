// jest.config.js
/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],

  moduleNameMapper: {
    // Strips the ".js" extension from your imports so ts-jest can resolve them
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      { useESM: true },
    ],
  },

  // ── Real-DB integration test setup ────────────────────────────────────────
  //
  // globalSetup runs in its own Node process ONCE before Jest starts any tests.
  // It pushes the schema and seeds the test users.
  globalSetup: './src/tests/integration/setup/globalSetup.ts',

  // globalTeardown runs ONCE after all tests complete. It wipes the test DB.
  globalTeardown: './src/tests/integration/setup/globalTeardown.ts',

  // setupFilesAfterFramework runs inside each test worker, after the test
  // framework is installed. We use it to load .env.test so that every
  // test file sees the correct DATABASE_URL and JWT_SECRET.
  setupFilesAfterEnv: ['<rootDir>/src/tests/integration/setup/loadEnv.ts'],

  // ── Test file locations ───────────────────────────────────────────────────
  testMatch: [
    '<rootDir>/src/tests/integration/*.test.ts',
  ],
};