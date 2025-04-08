/** @type {import('jest').Config} */
module.exports = {
  // Racine du projet pour les tests
  roots: ['<rootDir>/src'],
  
  // Environnement de test pour React
  testEnvironment: 'jsdom',
  
  // Fichier d'initialisation avec les mocks globaux
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  
  // Transformation des fichiers avec babel et ts-jest
  transform: {
    // Fichiers JavaScript/JSX avec babel-jest
    '^.+\\.(js|jsx)$': 'babel-jest',
    
    // Fichiers TypeScript/TSX avec ts-jest
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      // Autres options de ts-jest
      isolatedModules: true,
      diagnostics: {
        warnOnly: true
      }
    }],
  },
  
  // Mappage pour les imports dans les tests
  moduleNameMapper: {
    // Mocks pour les fichiers médias
    '\\.(jpg|jpeg|png|gif|svg|webp|ico)$': '<rootDir>/src/__mocks__/fileMock.js',
    
    // Mocks pour les fichiers CSS
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    
    // Alias pour les imports (correspond à tsconfig paths)
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Patterns pour trouver les fichiers de test
  testMatch: [
    '**/__tests__/**/*.+(js|jsx|ts|tsx)',
    '**/?(*.)+(spec|test).+(js|jsx|ts|tsx)',
  ],
  
  // Extensions de fichiers à considérer
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // Configuration de la sortie
  verbose: true,
  
  // Timeout pour les tests longs
  testTimeout: 15000,
  
  // Signaler les APIs dépréciées
  errorOnDeprecated: true,
  
  // Configuration de la couverture de code
  collectCoverage: process.env.COLLECT_COVERAGE === 'true',
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/__mocks__/',
    '/fixtures/',
  ],
  
  // Ignorer certains chemins pour les tests
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
  ],
  
  // Options de débogage
  bail: 1, // Arrêter après le premier échec pour identifier les problèmes plus rapidement
  logHeapUsage: true, // Afficher l'utilisation de la mémoire
  detectOpenHandles: true, // Détecter les handles restés ouverts
  
  // Pour les tests qui utilisent des timers
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  
  // Restaurer les mocks entre les tests
  restoreMocks: true,
  clearMocks: true,
  resetMocks: false,
};
