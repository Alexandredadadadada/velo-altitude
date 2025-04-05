/**
 * Utilitaires pour les tests d'intégration
 * Implémente les recommandations de l'Agent 3 (Assurance Qualité & Intégration)
 */
const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');
const getPort = require('get-port');
const fs = require('fs').promises;

/**
 * Démarre un serveur de test
 * @returns {Promise<Object>} Informations sur le serveur
 */
async function setupTestServer() {
  // Trouver un port disponible
  const port = await getPort();
  
  // Créer un fichier .env temporaire pour les tests
  const testEnvPath = path.resolve(__dirname, '../.env.test');
  const originalEnvPath = path.resolve(__dirname, '../.env');
  
  // Copier le fichier .env existant
  try {
    await fs.copyFile(originalEnvPath, testEnvPath);
    
    // Modifier le port pour les tests
    let envContent = await fs.readFile(testEnvPath, 'utf8');
    envContent = envContent.replace(/PORT=\d+/, `PORT=${port}`);
    envContent = envContent.replace(/NODE_ENV=\w+/, 'NODE_ENV=test');
    
    await fs.writeFile(testEnvPath, envContent);
  } catch (error) {
    console.error('Error preparing test environment:', error);
    throw error;
  }
  
  // Démarrer le serveur avec l'environnement de test
  const serverProcess = spawn('node', ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      PORT: port.toString(),
      NODE_ENV: 'test',
      ENV_FILE: '.env.test'
    },
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
    url: `http://localhost:${port}`
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
    
    // Supprimer le fichier .env temporaire
    const testEnvPath = path.resolve(__dirname, '../.env.test');
    try {
      await fs.unlink(testEnvPath);
    } catch (error) {
      console.error('Error cleaning up test environment:', error);
    }
    
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
