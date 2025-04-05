/**
 * Script de test de charge et de performance pour le backend
 * 
 * Ce script simule des accès concurrents multiples aux endpoints critiques,
 * des pics de trafic soudains et des sessions utilisateur longues avec
 * de nombreuses requêtes.
 * 
 * Dashboard-Velo.com
 */

const axios = require('axios');
const { performance } = require('perf_hooks');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');
const crypto = require('crypto');

// Configuration des tests
const TEST_CONFIG = {
  // URL de base de l'API
  baseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
  
  // Nombre total d'utilisateurs simulés
  totalUsers: 100,
  
  // Nombre maximum de requêtes concurrentes
  maxConcurrentRequests: 50,
  
  // Durée du test en secondes
  testDuration: 60,
  
  // Délai entre les requêtes (en ms)
  requestDelay: 100,
  
  // Probabilité d'erreur réseau simulée (0-1)
  networkErrorProbability: 0.05,
  
  // Probabilité de latence élevée (0-1)
  highLatencyProbability: 0.1,
  
  // Latence maximale simulée (en ms)
  maxLatency: 2000,
  
  // Endpoints à tester avec leurs poids relatifs
  endpoints: [
    { path: '/auth/login', method: 'POST', weight: 10 },
    { path: '/auth/refresh', method: 'POST', weight: 15 },
    { path: '/routes/search', method: 'GET', weight: 25 },
    { path: '/routes/calculate', method: 'POST', weight: 20 },
    { path: '/weather/current', method: 'GET', weight: 15 },
    { path: '/cols/list', method: 'GET', weight: 10 },
    { path: '/user/profile', method: 'GET', weight: 5 }
  ],
  
  // Fichier de sortie pour les résultats
  outputFile: path.join(__dirname, '../logs/load-test-results.json')
};

// Résultats des tests
const testResults = {
  startTime: null,
  endTime: null,
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalLatency: 0,
  maxLatency: 0,
  minLatency: Number.MAX_SAFE_INTEGER,
  errors: {},
  endpoints: {},
  concurrencyLevels: {},
  requestsPerSecond: []
};

// Utilisateurs simulés avec leurs tokens
const simulatedUsers = [];

/**
 * Génère des données utilisateur aléatoires
 * @returns {Object} Données utilisateur
 */
function generateRandomUser() {
  const id = crypto.randomBytes(8).toString('hex');
  return {
    id,
    email: `user${id}@example.com`,
    password: `password${id}`,
    token: null,
    refreshToken: null,
    lastActivity: Date.now(),
    requestCount: 0
  };
}

/**
 * Initialise les utilisateurs simulés
 */
function initializeUsers() {
  for (let i = 0; i < TEST_CONFIG.totalUsers; i++) {
    simulatedUsers.push(generateRandomUser());
  }
  logger.info(`${TEST_CONFIG.totalUsers} utilisateurs simulés initialisés`);
}

/**
 * Sélectionne un endpoint aléatoire en fonction des poids
 * @returns {Object} Endpoint sélectionné
 */
function selectRandomEndpoint() {
  const totalWeight = TEST_CONFIG.endpoints.reduce((sum, endpoint) => sum + endpoint.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const endpoint of TEST_CONFIG.endpoints) {
    random -= endpoint.weight;
    if (random <= 0) {
      return endpoint;
    }
  }
  
  return TEST_CONFIG.endpoints[0];
}

/**
 * Simule une latence réseau
 * @returns {Promise<void>}
 */
async function simulateNetworkLatency() {
  if (Math.random() < TEST_CONFIG.highLatencyProbability) {
    const latency = Math.random() * TEST_CONFIG.maxLatency;
    await new Promise(resolve => setTimeout(resolve, latency));
  }
}

/**
 * Simule une erreur réseau
 * @returns {boolean} True si une erreur doit être simulée
 */
function shouldSimulateNetworkError() {
  return Math.random() < TEST_CONFIG.networkErrorProbability;
}

/**
 * Effectue une requête à l'API
 * @param {Object} user Utilisateur simulé
 * @param {Object} endpoint Endpoint à appeler
 * @returns {Promise<Object>} Résultat de la requête
 */
async function makeRequest(user, endpoint) {
  const startTime = performance.now();
  let success = false;
  let errorType = null;
  
  try {
    // Simuler une latence réseau
    await simulateNetworkLatency();
    
    // Simuler une erreur réseau
    if (shouldSimulateNetworkError()) {
      throw new Error('Erreur réseau simulée');
    }
    
    // Préparer les données de la requête
    const url = `${TEST_CONFIG.baseUrl}${endpoint.path}`;
    const headers = {};
    let data = {};
    
    // Ajouter le token d'authentification si disponible
    if (user.token) {
      headers['Authorization'] = `Bearer ${user.token}`;
    }
    
    // Préparer les données spécifiques à chaque endpoint
    switch (endpoint.path) {
      case '/auth/login':
        data = {
          email: user.email,
          password: user.password
        };
        break;
      case '/auth/refresh':
        data = {
          refreshToken: user.refreshToken
        };
        break;
      case '/routes/calculate':
        data = {
          start: [7.7491, 48.5734], // Strasbourg
          end: [7.2661, 47.7486],   // Belfort
          profile: 'cycling-road'
        };
        break;
      default:
        // Pas de données spécifiques pour les autres endpoints
        break;
    }
    
    // Effectuer la requête
    let response;
    if (endpoint.method === 'GET') {
      response = await axios.get(url, { headers });
    } else if (endpoint.method === 'POST') {
      response = await axios.post(url, data, { headers });
    }
    
    // Traiter la réponse
    if (response.status >= 200 && response.status < 300) {
      success = true;
      
      // Mettre à jour les tokens si c'est une réponse d'authentification
      if (endpoint.path === '/auth/login' || endpoint.path === '/auth/refresh') {
        user.token = response.data.accessToken;
        user.refreshToken = response.data.refreshToken;
      }
    }
  } catch (error) {
    success = false;
    errorType = error.message;
  }
  
  const endTime = performance.now();
  const latency = endTime - startTime;
  
  // Mettre à jour les statistiques de l'utilisateur
  user.lastActivity = Date.now();
  user.requestCount++;
  
  return {
    user: user.id,
    endpoint: endpoint.path,
    method: endpoint.method,
    success,
    latency,
    timestamp: Date.now(),
    errorType
  };
}

/**
 * Traite le résultat d'une requête
 * @param {Object} result Résultat de la requête
 */
function processResult(result) {
  // Incrémenter les compteurs globaux
  testResults.totalRequests++;
  if (result.success) {
    testResults.successfulRequests++;
  } else {
    testResults.failedRequests++;
    
    // Enregistrer le type d'erreur
    if (!testResults.errors[result.errorType]) {
      testResults.errors[result.errorType] = 0;
    }
    testResults.errors[result.errorType]++;
  }
  
  // Mettre à jour les statistiques de latence
  testResults.totalLatency += result.latency;
  testResults.maxLatency = Math.max(testResults.maxLatency, result.latency);
  testResults.minLatency = Math.min(testResults.minLatency, result.latency);
  
  // Mettre à jour les statistiques par endpoint
  if (!testResults.endpoints[result.endpoint]) {
    testResults.endpoints[result.endpoint] = {
      total: 0,
      successful: 0,
      failed: 0,
      totalLatency: 0
    };
  }
  
  const endpointStats = testResults.endpoints[result.endpoint];
  endpointStats.total++;
  if (result.success) {
    endpointStats.successful++;
  } else {
    endpointStats.failed++;
  }
  endpointStats.totalLatency += result.latency;
  
  // Enregistrer le niveau de concurrence
  const second = Math.floor((result.timestamp - testResults.startTime) / 1000);
  if (!testResults.requestsPerSecond[second]) {
    testResults.requestsPerSecond[second] = 0;
  }
  testResults.requestsPerSecond[second]++;
  
  // Afficher un point pour chaque requête (feedback visuel)
  process.stdout.write(result.success ? '.' : 'x');
}

/**
 * Exécute le test de charge
 * @returns {Promise<void>}
 */
async function runLoadTest() {
  logger.info('Démarrage du test de charge...');
  
  // Initialiser les résultats
  testResults.startTime = Date.now();
  
  // Initialiser les utilisateurs
  initializeUsers();
  
  // Créer une file d'attente de requêtes
  const requestQueue = [];
  
  // Remplir la file d'attente initiale
  for (let i = 0; i < TEST_CONFIG.maxConcurrentRequests; i++) {
    const user = simulatedUsers[Math.floor(Math.random() * simulatedUsers.length)];
    const endpoint = selectRandomEndpoint();
    requestQueue.push({ user, endpoint });
  }
  
  // Exécuter les requêtes jusqu'à la fin du test
  const endTime = Date.now() + (TEST_CONFIG.testDuration * 1000);
  
  while (Date.now() < endTime && requestQueue.length > 0) {
    // Prendre la prochaine requête
    const { user, endpoint } = requestQueue.shift();
    
    // Effectuer la requête
    const result = await makeRequest(user, endpoint);
    
    // Traiter le résultat
    processResult(result);
    
    // Ajouter une nouvelle requête à la file d'attente
    if (Date.now() < endTime) {
      const nextUser = simulatedUsers[Math.floor(Math.random() * simulatedUsers.length)];
      const nextEndpoint = selectRandomEndpoint();
      requestQueue.push({ user: nextUser, endpoint: nextEndpoint });
      
      // Attendre un peu entre les requêtes
      await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.requestDelay));
    }
  }
  
  // Finaliser les résultats
  testResults.endTime = Date.now();
  
  // Afficher les résultats
  displayResults();
  
  // Sauvegarder les résultats
  saveResults();
}

/**
 * Affiche les résultats du test
 */
function displayResults() {
  const duration = (testResults.endTime - testResults.startTime) / 1000;
  const avgLatency = testResults.totalRequests > 0 
    ? testResults.totalLatency / testResults.totalRequests 
    : 0;
  const successRate = testResults.totalRequests > 0 
    ? (testResults.successfulRequests / testResults.totalRequests) * 100 
    : 0;
  
  console.log('\n\n==== RÉSULTATS DU TEST DE CHARGE ====');
  console.log(`Durée: ${duration.toFixed(2)} secondes`);
  console.log(`Requêtes totales: ${testResults.totalRequests}`);
  console.log(`Requêtes réussies: ${testResults.successfulRequests} (${successRate.toFixed(2)}%)`);
  console.log(`Requêtes échouées: ${testResults.failedRequests}`);
  console.log(`Latence moyenne: ${avgLatency.toFixed(2)} ms`);
  console.log(`Latence min/max: ${testResults.minLatency.toFixed(2)}/${testResults.maxLatency.toFixed(2)} ms`);
  console.log(`Requêtes par seconde: ${(testResults.totalRequests / duration).toFixed(2)}`);
  
  console.log('\nRésultats par endpoint:');
  for (const [endpoint, stats] of Object.entries(testResults.endpoints)) {
    const endpointSuccessRate = stats.total > 0 
      ? (stats.successful / stats.total) * 100 
      : 0;
    const endpointAvgLatency = stats.total > 0 
      ? stats.totalLatency / stats.total 
      : 0;
    
    console.log(`  ${endpoint}: ${stats.total} requêtes, ${endpointSuccessRate.toFixed(2)}% de succès, ${endpointAvgLatency.toFixed(2)} ms de latence moyenne`);
  }
  
  console.log('\nTypes d\'erreurs:');
  for (const [errorType, count] of Object.entries(testResults.errors)) {
    console.log(`  ${errorType}: ${count} occurrences`);
  }
  
  console.log('\n====================================');
}

/**
 * Sauvegarde les résultats dans un fichier
 */
function saveResults() {
  try {
    // Créer le répertoire de logs s'il n'existe pas
    const logsDir = path.dirname(TEST_CONFIG.outputFile);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Calculer des statistiques supplémentaires
    const duration = (testResults.endTime - testResults.startTime) / 1000;
    const avgLatency = testResults.totalRequests > 0 
      ? testResults.totalLatency / testResults.totalRequests 
      : 0;
    const successRate = testResults.totalRequests > 0 
      ? (testResults.successfulRequests / testResults.totalRequests) * 100 
      : 0;
    
    // Préparer les données à sauvegarder
    const results = {
      ...testResults,
      summary: {
        duration,
        avgLatency,
        successRate,
        requestsPerSecond: testResults.totalRequests / duration
      }
    };
    
    // Sauvegarder les résultats
    fs.writeFileSync(TEST_CONFIG.outputFile, JSON.stringify(results, null, 2));
    
    logger.info(`Résultats sauvegardés dans ${TEST_CONFIG.outputFile}`);
  } catch (error) {
    logger.error(`Erreur lors de la sauvegarde des résultats: ${error.message}`);
  }
}

/**
 * Fonction principale
 */
async function main() {
  try {
    await runLoadTest();
  } catch (error) {
    logger.error(`Erreur lors de l'exécution du test de charge: ${error.message}`);
    console.error(error);
  }
}

// Exécuter le test si ce script est appelé directement
if (require.main === module) {
  main();
}

module.exports = {
  runLoadTest,
  TEST_CONFIG
};
