/**
 * Configuration Jest pour Velo-Altitude
 * Utilisé pour exécuter les tests unitaires et d'intégration
 */

module.exports = {
  // Répertoire racine
  rootDir: '../',
  
  // Chemins d'imports pour les tests
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/client/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/client/src/__tests__/__mocks__/fileMock.js'
  },
  
  // Chemins de recherche pour les tests
  testMatch: [
    '<rootDir>/client/src/**/__tests__/**/*.{js,jsx}',
    '<rootDir>/client/src/**/*.{spec,test}.{js,jsx}'
  ],
  
  // Configuration de l'environnement de test
  testEnvironment: 'jsdom',
  
  // Configuration de la couverture de code
  collectCoverageFrom: [
    'client/src/**/*.{js,jsx}',
    '!client/src/**/*.d.ts',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  
  // Configuration des transformations
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
    '^.+\\.css$': '<rootDir>/config/cssTransform.js',
    '^(?!.*\\.(js|jsx|css|json)$)': '<rootDir>/config/fileTransform.js'
  },
  
  // Configuration des hooks
  setupFilesAfterEnv: [
    '<rootDir>/client/src/setupTests.js'
  ],
  
  // Configuration de la couverture
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },
  
  // Ignorer certains fichiers/dossiers
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/.netlify/'
  ],
  
  // Mocks pour les modules qui peuvent poser problème
  modulePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/build/',
    '<rootDir>/.netlify/'
  ],
  
  // Affichage des résultats de test
  verbose: true
};
