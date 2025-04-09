/**
 * Utilitaires pour les tests d'intégration
 * Implémente les recommandations de l'Agent 3 (Assurance Qualité & Intégration)
 */
const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');
const getPort = require('get-port');

/**
 * Démarre un serveur de test avec des variables d'environnement prédéfinies
 * @returns {Promise<Object>} Informations sur le serveur
 */
async function setupTestServer() {
  // Trouver un port disponible
  const port = await getPort();
  
  // Configuration des variables d'environnement pour les tests
  const testEnv = {
    ...process.env,
    PORT: port.toString(),
    NODE_ENV: 'test',
    // Définir ici les autres variables d'environnement nécessaires aux tests
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/velo_altitude_test',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379/1',
    // Variables spécifiques pour les tests
    AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE || 'https://api.test.velo-altitude.fr',
    AUTH0_ISSUER_BASE_URL: process.env.AUTH0_ISSUER_BASE_URL || 'https://test.velo-altitude.eu.auth0.com',
    SKIP_API_VALIDATION: 'true'
  };
  
  // Démarrer le serveur avec l'environnement de test
  const serverProcess = spawn('node', ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: testEnv,
    detached: true
  });
  
  // Écouter les erreurs
  serverProcess.stderr.on('data', (data) => {
    console.error(`Server error: ${data}`);
  });
  
  // Attendre que le serveur soit prêt
  await waitForServerReady(port);
  
  return {
    process: serverProcess,
    port,
    url: `http://localhost:${port}`,
    env: testEnv
  };
}

/**
 * Attend que le serveur soit prêt
 * @param {number} port - Port du serveur
 * @returns {Promise<void>}
 */
async function waitForServerReady(port) {
  const maxAttempts = 30;
  const interval = 500;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      await axios.get(`http://localhost:${port}/api/health`);
      console.log(`Test server is ready on port ${port}`);
      return;
    } catch (error) {
      // Attendre avant la prochaine tentative
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  
  throw new Error(`Server did not start within ${maxAttempts * interval / 1000} seconds`);
}

/**
 * Arrête le serveur de test
 * @param {Object} server - Informations sur le serveur
 * @returns {Promise<void>}
 */
async function teardownTestServer(server) {
  if (server && server.process) {
    // Arrêter le processus serveur
    process.kill(-server.process.pid);
    console.log('Test server stopped');
  }
}

/**
 * Crée un utilisateur de test
 * @param {string} baseUrl - URL de base de l'API
 * @returns {Promise<Object>} Informations sur l'utilisateur
 */
async function createTestUser(baseUrl) {
  const email = `test-${Date.now()}@example.com`;
  const password = 'TestPassword123!';
  
  try {
    const registerResponse = await axios.post(`${baseUrl}/auth/register`, {
      email,
      password,
      name: 'Test User'
    });
    
    const loginResponse = await axios.post(`${baseUrl}/auth/login`, {
      email,
      password
    });
    
    return {
      id: registerResponse.data.userId,
      email,
      password,
      name: 'Test User',
      token: loginResponse.data.token
    };
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
}

/**
 * Nettoie les données de test
 * @param {string} baseUrl - URL de base de l'API
 * @param {string} token - Token d'authentification
 * @returns {Promise<void>}
 */
async function cleanupTestData(baseUrl, token) {
  try {
    // Supprimer les données créées pendant les tests
    await axios.delete(`${baseUrl}/test/cleanup`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}

module.exports = {
  setupTestServer,
  teardownTestServer,
  createTestUser,
  cleanupTestData
};
