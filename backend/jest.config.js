/**
 * Jest Configuration for sBTC Payment Gateway Backend
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Root directories for tests and source code
  roots: ['<rootDir>/src', '<rootDir>/tests'],

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/*.test.js',
    '**/*.spec.js'
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!src/server.js', // Exclude main server file from coverage
  ],

  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'cobertura'
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    },
    // Stricter thresholds for critical services
    './src/services/paymentService.js': {
      branches: 85,
      functions: 90,
      lines: 85,
      statements: 85
    },
    './src/services/merchantService.js': {
      branches: 85,
      functions: 90,
      lines: 85,
      statements: 85
    }
  },

  // Module path mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Verbose output
  verbose: true,

  // Force exit after tests complete
  forceExit: true,

  // Timeout for tests (10 seconds)
  testTimeout: 10000,

  // Handle async operations
  detectOpenHandles: true,

  // Transform configuration (if needed for ES6+ features)
  transform: {},

  // Global variables available in tests
  globals: {
    'NODE_ENV': 'test'
  }
};