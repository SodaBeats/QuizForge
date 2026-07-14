/** @type {import('ts-jest').JestConfigWithTsJest} */
import baseConfig from './jest.config.base.js';

export default {
  ...baseConfig,
  displayName: 'unit',
  testMatch: ['<rootDir>/src/tests/unit/**/*.test.ts'],
  testPathIgnorePatterns: ['/integration/'],
};
