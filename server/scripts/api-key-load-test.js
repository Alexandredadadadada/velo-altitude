/**
 * Test de charge et de résilience pour le système de gestion sécurisée des clés API
 * 
 * Ce script simule des accès concurrents multiples aux clés API et teste
 * la résilience du système face à des pannes réseau ou des indisponibilités de services.
 * 
 * Dashboard-Velo.com
 */

const path = require('path');
const dotenv = require('dotenv');
const { performance } = require('perf_hooks');
const { logger } = require('../utils/logger');
const axios = require('axios');

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Importer les services
const apiServices = require('../services/apiServices');
const EnhancedApiKeyManager = require('../utils/enhanced-api-key-manager');

// Configuration pour les tests
const TEST_CONFIG = {
  concurrentRequests: 100,  // Nombre de requêtes concurrentes
  requestDelay: 10,         // Délai entre les requêtes en ms
  testDuration: 30000,      // Durée du test en ms (30 secondes)
  networkFailureRate: 0.1,  // Taux d'échec réseau simulé (10%)
  services: [
    'openRouteService',
    'strava',
    'weatherService',
    'mapbox',
    'openai'
  ],
  modules: [
    'weather-module',
    'map-module',
    'activity-module',
    'admin'
  ]
};

/**
 * Simuler une requête d'accès à une clé API
 * @param {EnhancedApiKeyManager} apiKeyManager - Gestionnaire de clés API
 * @param {string} service - Nom du service
 * @param {string} module - Nom du module
 * @param {boolean} simulateNetworkFailure - Simuler une panne réseau
 * @returns {Promise<Object>} - Résultat de la requête
 */
async function simulateApiKeyRequest(apiKeyManager, service, module, simulateNetworkFailure = false) {
  const startTime = performance.now();
  let result = {
    service,
    module,
    success: false,
    error: null,
    duration: 0
  };
  
  try {
    // Simuler une panne réseau aléatoire
    if (simulateNetworkFailure && Math.random() < TEST_CONFIG.networkFailureRate) {
      throw new Error('Erreur réseau simulée');
    }
    
    // Récupérer la clé API
    const apiKey = await apiKeyManager.getApiKey(service, module);
    result.success = true;
    
    // Simuler une utilisation de la clé (sans faire de vraie requête API)
    if (apiKey) {
      result.keyLength = apiKey.length;
    }
  } catch (error) {
    result.error = error.message;
  } finally {
    result.duration = performance.now() - startTime;
    return result;
  }
}

/**
 * Exécuter un test de charge
 * @param {EnhancedApiKeyManager} apiKeyManager - Gestionnaire de clés API
 * @returns {Promise<Object>} - Résultats du test
 */
async function runLoadTest(apiKeyManager) {
  logger.info('Démarrage du test de charge...');
  
  const results = {
    startTime: new Date().toISOString(),
    endTime: null,
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageDuration: 0,
    maxDuration: 0,
    minDuration: Infinity,
    serviceStats: {},
    moduleStats: {},
    errors: []
  };
  
  // Initialiser les statistiques par service et par module
  TEST_CONFIG.services.forEach(service => {
    results.serviceStats[service] = {
      requests: 0,
      successful: 0,
      failed: 0,
      averageDuration: 0
    };
  });
  
  TEST_CONFIG.modules.forEach(module => {
    results.moduleStats[module] = {
      requests: 0,
      successful: 0,
      failed: 0,
      averageDuration: 0
    };
  });
  
  // Fonction pour exécuter une requête et mettre à jour les statistiques
  const executeRequest = async () => {
    // Sélectionner un service et un module aléatoire
    const service = TEST_CONFIG.services[Math.floor(Math.random() * TEST_CONFIG.services.length)];
    const module = TEST_CONFIG.modules[Math.floor(Math.random() * TEST_CONFIG.modules.length)];
    
    // Simuler une requête
    const simulateFailure = Math.random() < TEST_CONFIG.networkFailureRate;
    const result = await simulateApiKeyRequest(apiKeyManager, service, module, simulateFailure);
    
    // Mettre à jour les statistiques globales
    results.totalRequests++;
    if (result.success) {
      results.successfulRequests++;
    } else {
      results.failedRequests++;
      results.errors.push({
        service,
        module,
        error: result.error
      });
    }
    
    // Mettre à jour les statistiques de durée
    results.averageDuration = ((results.averageDuration * (results.totalRequests - 1)) + result.duration) / results.totalRequests;
    results.maxDuration = Math.max(results.maxDuration, result.duration);
    results.minDuration = Math.min(results.minDuration, result.duration);
    
    // Mettre à jour les statistiques par service
    results.serviceStats[service].requests++;
    if (result.success) {
      results.serviceStats[service].successful++;
    } else {
      results.serviceStats[service].failed++;
    }
    results.serviceStats[service].averageDuration = 
      ((results.serviceStats[service].averageDuration * (results.serviceStats[service].requests - 1)) + result.duration) / 
      results.serviceStats[service].requests;
    
    // Mettre à jour les statistiques par module
    results.moduleStats[module].requests++;
    if (result.success) {
      results.moduleStats[module].successful++;
    } else {
      results.moduleStats[module].failed++;
    }
    results.moduleStats[module].averageDuration = 
      ((results.moduleStats[module].averageDuration * (results.moduleStats[module].requests - 1)) + result.duration) / 
      results.moduleStats[module].requests;
    
    return result;
  };
  
  // Exécuter les requêtes concurrentes
  const startTime = performance.now();
  const endTime = startTime + TEST_CONFIG.testDuration;
  
  logger.info(`Exécution de ${TEST_CONFIG.concurrentRequests} requêtes concurrentes pendant ${TEST_CONFIG.testDuration / 1000} secondes...`);
  
  // Créer un pool de promesses pour les requêtes concurrentes
  const runConcurrentRequests = async () => {
    const promises = [];
    for (let i = 0; i < TEST_CONFIG.concurrentRequests; i++) {
      promises.push(executeRequest());
      // Petit délai entre les requêtes pour éviter de surcharger le système
      await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.requestDelay));
    }
    return Promise.all(promises);
  };
  
  // Exécuter les requêtes jusqu'à la fin du temps imparti
  while (performance.now() < endTime) {
    await runConcurrentRequests();
    logger.info(`Requêtes exécutées: ${results.totalRequests}, Succès: ${results.successfulRequests}, Échecs: ${results.failedRequests}`);
  }
  
  // Finaliser les résultats
  results.endTime = new Date().toISOString();
  
  // Limiter le nombre d'erreurs affichées
  if (results.errors.length > 10) {
    const errorCount = results.errors.length;
    results.errors = results.errors.slice(0, 10);
    results.errors.push({ message: `... et ${errorCount - 10} autres erreurs` });
  }
  
  return results;
}

/**
 * Tester la résilience face aux pannes
 * @param {EnhancedApiKeyManager} apiKeyManager - Gestionnaire de clés API
 * @returns {Promise<Object>} - Résultats du test
 */
async function testResilience(apiKeyManager) {
  logger.info('Démarrage du test de résilience...');
  
  const results = {
    networkFailureTests: {
      total: 0,
      recovered: 0,
      failed: 0
    },
    serviceUnavailabilityTests: {
      total: 0,
      recovered: 0,
      failed: 0
    },
    cacheTests: {
      cacheHits: 0,
      cacheMisses: 0
    }
  };
  
  // Test 1: Résilience face aux pannes réseau
  logger.info('Test de résilience face aux pannes réseau...');
  
  // Simuler des pannes réseau temporaires
  for (let i = 0; i < 10; i++) {
    results.networkFailureTests.total++;
    
    try {
      // Première requête avec panne réseau simulée
      try {
        await simulateApiKeyRequest(apiKeyManager, 'openRouteService', 'map-module', true);
      } catch (error) {
        // Ignorer l'erreur, c'est attendu
      }
      
      // Deuxième requête sans panne
      const result = await simulateApiKeyRequest(apiKeyManager, 'openRouteService', 'map-module', false);
      if (result.success) {
        results.networkFailureTests.recovered++;
      } else {
        results.networkFailureTests.failed++;
      }
    } catch (error) {
      results.networkFailureTests.failed++;
      logger.error('Erreur lors du test de résilience face aux pannes réseau', {
        error: error.message
      });
    }
  }
  
  // Test 2: Résilience face à l'indisponibilité des services
  logger.info('Test de résilience face à l\'indisponibilité des services...');
  
  // Simuler l'indisponibilité d'un service
  const originalAxiosGet = axios.get;
  axios.get = async (url) => {
    if (url.includes('openrouteservice')) {
      throw new Error('Service indisponible (simulé)');
    }
    return originalAxiosGet(url);
  };
  
  for (let i = 0; i < 5; i++) {
    results.serviceUnavailabilityTests.total++;
    
    try {
      // Tenter d'accéder à la clé malgré l'indisponibilité du service
      const result = await simulateApiKeyRequest(apiKeyManager, 'openRouteService', 'map-module', false);
      if (result.success) {
        results.serviceUnavailabilityTests.recovered++;
      } else {
        results.serviceUnavailabilityTests.failed++;
      }
    } catch (error) {
      results.serviceUnavailabilityTests.failed++;
      logger.error('Erreur lors du test de résilience face à l\'indisponibilité des services', {
        error: error.message
      });
    }
  }
  
  // Restaurer axios.get
  axios.get = originalAxiosGet;
  
  // Test 3: Performance du cache mémoire
  logger.info('Test de performance du cache mémoire...');
  
  // Vider le cache
  apiKeyManager.memoryStorage.clear();
  
  // Première requête (miss de cache)
  await simulateApiKeyRequest(apiKeyManager, 'weatherService', 'weather-module', false);
  results.cacheTests.cacheMisses++;
  
  // Requêtes suivantes (hits de cache)
  for (let i = 0; i < 20; i++) {
    const startTime = performance.now();
    await simulateApiKeyRequest(apiKeyManager, 'weatherService', 'weather-module', false);
    const duration = performance.now() - startTime;
    
    // Si la requête est très rapide, c'est probablement un hit de cache
    if (duration < 5) {
      results.cacheTests.cacheHits++;
    } else {
      results.cacheTests.cacheMisses++;
    }
  }
  
  return results;
}

/**
 * Fonction principale de test
 */
async function runTests() {
  logger.info('Démarrage des tests de charge et de résilience');
  
  try {
    // Créer une instance dédiée du gestionnaire de clés API pour les tests
    const apiKeyManager = new EnhancedApiKeyManager({
      keysDirectory: path.join(__dirname, '..', '.keys'),
      rotationInterval: 30 * 24 * 60 * 60 * 1000,
      gracePeriod: 24 * 60 * 60 * 1000,
      memoryTTL: 5 * 60 * 1000, // 5 minutes pour les tests
      logger: logger
    });
    
    // Initialiser le gestionnaire
    await apiKeyManager.initialize();
    logger.info('Gestionnaire de clés API initialisé pour les tests');
    
    // Exécuter le test de charge
    const loadTestResults = await runLoadTest(apiKeyManager);
    
    // Exécuter le test de résilience
    const resilienceTestResults = await testResilience(apiKeyManager);
    
    // Combiner les résultats
    const results = {
      timestamp: new Date().toISOString(),
      loadTest: loadTestResults,
      resilienceTest: resilienceTestResults
    };
    
    // Afficher les résultats
    logger.info('Tests de charge et de résilience terminés');
    console.log('\n==== RÉSULTATS DES TESTS DE CHARGE ET DE RÉSILIENCE ====');
    console.log(`Date: ${results.timestamp}`);
    
    console.log('\n=== Test de charge ===');
    console.log(`Requêtes totales: ${loadTestResults.totalRequests}`);
    console.log(`Requêtes réussies: ${loadTestResults.successfulRequests} (${(loadTestResults.successfulRequests / loadTestResults.totalRequests * 100).toFixed(2)}%)`);
    console.log(`Requêtes échouées: ${loadTestResults.failedRequests} (${(loadTestResults.failedRequests / loadTestResults.totalRequests * 100).toFixed(2)}%)`);
    console.log(`Durée moyenne: ${loadTestResults.averageDuration.toFixed(2)} ms`);
    console.log(`Durée max: ${loadTestResults.maxDuration.toFixed(2)} ms`);
    console.log(`Durée min: ${loadTestResults.minDuration.toFixed(2)} ms`);
    
    console.log('\nStatistiques par service:');
    for (const [service, stats] of Object.entries(loadTestResults.serviceStats)) {
      console.log(`  ${service}: ${stats.requests} requêtes, ${stats.successful} réussies (${(stats.successful / stats.requests * 100).toFixed(2)}%), durée moyenne: ${stats.averageDuration.toFixed(2)} ms`);
    }
    
    console.log('\n=== Test de résilience ===');
    console.log('Résilience face aux pannes réseau:');
    console.log(`  Tests: ${resilienceTestResults.networkFailureTests.total}`);
    console.log(`  Récupérations: ${resilienceTestResults.networkFailureTests.recovered} (${(resilienceTestResults.networkFailureTests.recovered / resilienceTestResults.networkFailureTests.total * 100).toFixed(2)}%)`);
    console.log(`  Échecs: ${resilienceTestResults.networkFailureTests.failed} (${(resilienceTestResults.networkFailureTests.failed / resilienceTestResults.networkFailureTests.total * 100).toFixed(2)}%)`);
    
    console.log('\nRésilience face à l\'indisponibilité des services:');
    console.log(`  Tests: ${resilienceTestResults.serviceUnavailabilityTests.total}`);
    console.log(`  Récupérations: ${resilienceTestResults.serviceUnavailabilityTests.recovered} (${(resilienceTestResults.serviceUnavailabilityTests.recovered / resilienceTestResults.serviceUnavailabilityTests.total * 100).toFixed(2)}%)`);
    console.log(`  Échecs: ${resilienceTestResults.serviceUnavailabilityTests.failed} (${(resilienceTestResults.serviceUnavailabilityTests.failed / resilienceTestResults.serviceUnavailabilityTests.total * 100).toFixed(2)}%)`);
    
    console.log('\nPerformance du cache mémoire:');
    console.log(`  Hits de cache: ${resilienceTestResults.cacheTests.cacheHits} (${(resilienceTestResults.cacheTests.cacheHits / (resilienceTestResults.cacheTests.cacheHits + resilienceTestResults.cacheTests.cacheMisses) * 100).toFixed(2)}%)`);
    console.log(`  Misses de cache: ${resilienceTestResults.cacheTests.cacheMisses} (${(resilienceTestResults.cacheTests.cacheMisses / (resilienceTestResults.cacheTests.cacheHits + resilienceTestResults.cacheTests.cacheMisses) * 100).toFixed(2)}%)`);
    
    console.log('\n=====================================================');
    
    // Arrêter le gestionnaire
    apiKeyManager.stop();
    logger.info('Gestionnaire de clés API arrêté');
    
    return results;
  } catch (error) {
    logger.error('Erreur lors des tests de charge et de résilience', {
      error: error.message,
      stack: error.stack
    });
    
    throw error;
  }
}

// Exécuter les tests
if (require.main === module) {
  runTests().then(() => {
    process.exit(0);
  }).catch(error => {
    logger.error('Erreur non gérée', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  });
}

module.exports = {
  runTests,
  runLoadTest,
  testResilience
};
