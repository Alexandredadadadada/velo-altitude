module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/*.test.js'],
  collectCoverage: true,
  coverageReporters: ['text', 'html'],
  coverageDirectory: 'coverage',
  verbose: true,
  setupFilesAfterEnv: ['./server/tests/setup.js'],
  testTimeout: 30000,
};
