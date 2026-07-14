/** @type {import('ts-jest').JestConfigWithTsJest} */
import baseConfig from './jest.config.base.js';

export default {
  ...baseConfig,
  displayName: 'integration',
  testMatch: ['<rootDir>/src/tests/integration/**/*.test.ts'],
  globalSetup: '<rootDir>/src/tests/integration/setup/globalSetup.ts',
  globalTeardown: '<rootDir>/src/tests/integration/setup/globalTeardown.ts',
  setupFilesAfterEnv: ['<rootDir>/src/tests/integration/setup/loadEnv.ts'],
};
