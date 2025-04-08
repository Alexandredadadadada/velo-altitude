module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.js', '**/*.test.ts', '**/*.test.tsx'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  collectCoverage: true,
  coverageReporters: ['text', 'html'],
  coverageDirectory: 'coverage',
  verbose: true,
  setupFilesAfterEnv: ['./server/tests/setup.js'],
  testTimeout: 30000,
};
