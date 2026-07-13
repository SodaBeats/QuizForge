# Backend test-run troubleshooting notes

## Summary

The terminal trouble is coming from a mismatch between the Jest configuration and the way the repository is laid out.

## Root causes

1. Jest is configured to discover only integration tests.
   - Current config in [backend/jest.config.js](jest.config.js) uses:
     - `testMatch: ['<rootDir>/src/tests/integration/*.test.ts']`
   - This means the unit test folder at `src/tests/unit` is never discovered by the default Jest run.
   - Evidence from terminal:
     - `npm run test -- src/tests/unit`
     - Result: `No tests found, exiting with code 1`

2. The `test:unit` script is wired to the wrong Jest entrypoint.
   - In [backend/package.json](package.json):
     - `"test:unit": "npm run test -- src/tests/unit"`
   - Because the default `npm run test` command uses the repo-level Jest config, it still respects the integration-only `testMatch` and will not find the unit tests.

3. Integration setup runs even when you are trying to run a unit test.
   - [backend/jest.config.js](jest.config.js) defines:
     - `globalSetup`
     - `globalTeardown`
     - `setupFilesAfterEnv`
   - These hooks are tied to the integration test environment and will execute during Jest startup.
   - The setup file at [backend/src/tests/integration/setup/globalSetup.ts](src/tests/integration/setup/globalSetup.ts) throws when `DATABASE_URL` is missing.

4. The test environment file has an empty `DATABASE_URL`.
   - Current value in [.env.test](.env.test):
     - `DATABASE_URL=`
   - That makes the integration test bootstrap unusable because the setup code requires a real database connection string.
   - Evidence from terminal:
     - `Jest: Got error running globalSetup ... reason: DATABASE_URL is not set`

5. The unit test folder exists, but the default config does not include it.
   - Present unit files:
     - [backend/src/tests/unit/getScore.unit.test.ts](src/tests/unit/getScore.unit.test.ts)
     - [backend/src/tests/unit/signup.unit.test.ts](backend/src/tests/unit/signup.unit.test.ts)
   - Yet Jest still reports `No tests found` because the pattern does not include the unit directory.

6. The repository uses ESM + ts-jest, which makes ad-hoc terminal commands more fragile.
   - The backend package is type: `module`.
   - Jest is configured with ESM handling.
   - This means terminal commands that bypass the repository's normal config or use malformed JSON strings for `--config` are much more likely to fail.

## Practical takeaways

- If you want unit tests to run easily from the terminal, the Jest `testMatch` or a separate unit-only Jest config must be corrected.
- If you want integration tests to run, the database URL in `.env.test` must be populated and the test database must be reachable.
- The current failure is not caused by the service code itself; it is caused by test discovery and environment configuration noise around Jest.
