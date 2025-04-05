const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Configuration pour les tests
process.env.NODE_ENV = 'test';
process.env.TEST_MONGODB_URI = 'mongodb://localhost:27017/cycling-dashboard-test';
process.env.JWT_SECRET = 'test-jwt-secret-key';

// Créer le répertoire des logs si nécessaire
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Désactiver la sortie console pendant les tests
if (process.env.JEST_WORKER_ID !== undefined) {
  // Conserver les références originales
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info
  };

  // Remplacer les méthodes pour les tests silencieux
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  console.info = jest.fn();

  // Mais écrire quand même dans un fichier de log
  const logFile = path.join(logDir, `test-${new Date().toISOString().split('T')[0]}.log`);
  
  const logToFile = (level, ...args) => {
    try {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : arg
      ).join(' ');
      
      fs.appendFileSync(logFile, `${new Date().toISOString()} [${level}] ${message}\n`);
    } catch (e) {
      // Ignorer les erreurs d'écriture de fichier pendant les tests
    }
  };

  // Ajouter des fonctions de log qui écrivent dans le fichier
  console._log = (...args) => {
    logToFile('LOG', ...args);
    return originalConsole.log(...args);
  };
  
  console._error = (...args) => {
    logToFile('ERROR', ...args);
    return originalConsole.error(...args);
  };
}

// Configuration de Mongoose pour les tests
mongoose.set('strictQuery', false);

// Fonction pour se connecter à la base de données de test
async function setupDatabase() {
  try {
    await mongoose.connect(process.env.TEST_MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console._log('Connected to test database');
  } catch (error) {
    console._error('Error connecting to test database:', error);
  }
}

// Fonction pour nettoyer la base de données après les tests
async function clearDatabase() {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
}

// Fonction pour se déconnecter de la base de données
async function disconnectDatabase() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
    console._log('Disconnected from test database');
  }
}

// Avant tous les tests
beforeAll(async () => {
  await setupDatabase();
});

// Après chaque test
afterEach(async () => {
  await clearDatabase();
});

// Après tous les tests
afterAll(async () => {
  await disconnectDatabase();
});

// Exporter les fonctions utilitaires
module.exports = {
  setupDatabase,
  clearDatabase,
  disconnectDatabase
};
