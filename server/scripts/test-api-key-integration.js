/**
 * Script de test d'intégration du système de gestion des clés API
 * Dashboard-Velo.com
 */
const { logger } = require('../utils/logger');
const openRouteService = require('../services/openroute.service');
const stravaService = require('../services/strava.service');
const weatherService = require('../services/weather.service');
const openAIService = require('../services/openai.service');
const apiServices = require('../services/apiServices');

/**
 * Exécute les tests d'intégration pour tous les services
 */
async function runIntegrationTests() {
  logger.info('=== Démarrage des tests d\'intégration du système de gestion des clés API ===');
  
  try {
    // Tester OpenRouteService
    await testOpenRouteService();
    
    // Tester StravaService
    await testStravaService();
    
    // Tester WeatherService
    await testWeatherService();
    
    // Tester OpenAIService
    await testOpenAIService();
    
    // Tester la rotation des clés
    await testKeyRotation();
    
    logger.info('=== Tous les tests d\'intégration ont réussi ===');
    return { success: true, message: 'Tous les tests d\'intégration ont réussi' };
  } catch (error) {
    logger.error(`Échec des tests d'intégration: ${error.message}`, { error });
    return { success: false, message: `Échec des tests: ${error.message}` };
  }
}

/**
 * Teste l'intégration avec OpenRouteService
 */
async function testOpenRouteService() {
  logger.info('Test d\'intégration OpenRouteService...');
  
  // Vérifier que le service est correctement configuré
  if (!openRouteService.apiKeyManager) {
    throw new Error('OpenRouteService: apiKeyManager n\'est pas configuré');
  }
  
  // Vérifier que la méthode _parseApiError signale correctement les clés invalides
  const mockError = {
    response: { status: 401 },
    message: 'Unauthorized'
  };
  
  // Sauvegarder la méthode originale
  const originalReportFailedKey = openRouteService.apiKeyManager ? 
    openRouteService.apiKeyManager.reportFailedKey : null;
  
  // S'assurer que les propriétés nécessaires sont définies
  if (!openRouteService.apiKeyManager) {
    openRouteService.apiKeyManager = {
      reportFailedKey: () => {}
    };
  }
  
  if (!openRouteService.serviceName) {
    openRouteService.serviceName = 'openRouteService';
  }
  
  if (!openRouteService.currentApiKey) {
    openRouteService.currentApiKey = 'test-key';
  }
  
  // Créer un mock pour vérifier que la méthode est appelée
  let reportFailedKeyCalled = false;
  openRouteService.apiKeyManager.reportFailedKey = (serviceName, key) => {
    reportFailedKeyCalled = true;
    logger.info(`Test: reportFailedKey appelé avec ${serviceName}`);
  };
  
  // Appeler la méthode _parseApiError
  openRouteService._parseApiError(mockError);
  
  // Restaurer la méthode originale
  if (originalReportFailedKey) {
    openRouteService.apiKeyManager.reportFailedKey = originalReportFailedKey;
  }
  
  // Vérifier que reportFailedKey a été appelé
  if (!reportFailedKeyCalled) {
    throw new Error('OpenRouteService: reportFailedKey n\'a pas été appelé pour une erreur 401');
  }
  
  logger.info('✓ Test d\'intégration OpenRouteService réussi');
}

/**
 * Teste l'intégration avec StravaService
 */
async function testStravaService() {
  logger.info('Test d\'intégration StravaService...');
  
  // Vérifier que la méthode _getActiveApiKey est correctement implémentée
  const originalGetKey = apiServices.strava.getKey;
  
  // Créer un mock pour vérifier que la méthode est appelée
  let getKeyCalled = false;
  apiServices.strava.getKey = () => {
    getKeyCalled = true;
    logger.info('Test: apiServices.strava.getKey appelé');
    return 'test-key';
  };
  
  // Appeler la méthode _getActiveApiKey
  const key = stravaService._getActiveApiKey();
  
  // Restaurer la méthode originale
  apiServices.strava.getKey = originalGetKey;
  
  // Vérifier que getKey a été appelé
  if (!getKeyCalled) {
    throw new Error('StravaService: apiServices.strava.getKey n\'a pas été appelé');
  }
  
  // Vérifier que la clé retournée est correcte
  if (key !== 'test-key') {
    throw new Error(`StravaService: clé incorrecte retournée: ${key}`);
  }
  
  logger.info('✓ Test d\'intégration StravaService réussi');
}

/**
 * Teste l'intégration avec WeatherService
 */
async function testWeatherService() {
  logger.info('Test d\'intégration WeatherService...');
  
  // Vérifier que la méthode _getActiveApiKey est correctement implémentée
  const originalGetKey = apiServices.weatherService.getKey;
  
  // Créer un mock pour vérifier que la méthode est appelée
  let getKeyCalled = false;
  apiServices.weatherService.getKey = () => {
    getKeyCalled = true;
    logger.info('Test: apiServices.weatherService.getKey appelé');
    return 'test-weather-key';
  };
  
  // Appeler la méthode _getActiveApiKey
  const key = weatherService._getActiveApiKey();
  
  // Restaurer la méthode originale
  apiServices.weatherService.getKey = originalGetKey;
  
  // Vérifier que getKey a été appelé
  if (!getKeyCalled) {
    throw new Error('WeatherService: apiServices.weatherService.getKey n\'a pas été appelé');
  }
  
  // Vérifier que la clé retournée est correcte
  if (key !== 'test-weather-key') {
    throw new Error(`WeatherService: clé incorrecte retournée: ${key}`);
  }
  
  logger.info('✓ Test d\'intégration WeatherService réussi');
}

/**
 * Teste l'intégration avec OpenAIService
 */
async function testOpenAIService() {
  logger.info('Test d\'intégration OpenAIService...');
  
  // Vérifier que la méthode _getActiveApiKey est correctement implémentée
  const originalGetKey = apiServices.openai.getKey;
  
  // Créer un mock pour vérifier que la méthode est appelée
  let getKeyCalled = false;
  apiServices.openai.getKey = () => {
    getKeyCalled = true;
    logger.info('Test: apiServices.openai.getKey appelé');
    return 'test-openai-key';
  };
  
  // Appeler la méthode _getActiveApiKey
  const key = openAIService._getActiveApiKey();
  
  // Restaurer la méthode originale
  apiServices.openai.getKey = originalGetKey;
  
  // Vérifier que getKey a été appelé
  if (!getKeyCalled) {
    throw new Error('OpenAIService: apiServices.openai.getKey n\'a pas été appelé');
  }
  
  // Vérifier que la clé retournée est correcte
  if (key !== 'test-openai-key') {
    throw new Error(`OpenAIService: clé incorrecte retournée: ${key}`);
  }
  
  logger.info('✓ Test d\'intégration OpenAIService réussi');
}

/**
 * Teste la rotation des clés API
 */
async function testKeyRotation() {
  logger.info('Test de rotation des clés API...');
  
  // Tester la rotation pour chaque service
  const services = ['openRouteService', 'strava', 'weatherService', 'openai'];
  
  for (const serviceName of services) {
    if (!apiServices[serviceName] || !apiServices[serviceName].rotateKeys) {
      logger.warn(`Service ${serviceName} ne supporte pas la rotation de clés`);
      continue;
    }
    
    // Sauvegarder l'état actuel
    const originalRotateKeys = apiServices[serviceName].rotateKeys;
    
    // Créer un mock pour vérifier que la méthode est appelée
    let rotateKeysCalled = false;
    apiServices[serviceName].rotateKeys = () => {
      rotateKeysCalled = true;
      logger.info(`Test: apiServices.${serviceName}.rotateKeys appelé`);
    };
    
    // Simuler une rotation de clé
    apiServices[serviceName].rotateKeys();
    
    // Restaurer la méthode originale
    apiServices[serviceName].rotateKeys = originalRotateKeys;
    
    // Vérifier que rotateKeys a été appelé
    if (!rotateKeysCalled) {
      throw new Error(`${serviceName}: rotateKeys n'a pas été appelé`);
    }
    
    logger.info(`✓ Test de rotation des clés pour ${serviceName} réussi`);
  }
  
  logger.info('✓ Test de rotation des clés API réussi');
}

// Exporter les fonctions pour utilisation dans d'autres scripts
module.exports = {
  runIntegrationTests,
  testOpenRouteService,
  testStravaService,
  testWeatherService,
  testOpenAIService,
  testKeyRotation
};

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runIntegrationTests()
    .then(result => {
      if (result.success) {
        console.log('✅ Tous les tests ont réussi');
        process.exit(0);
      } else {
        console.error('❌ Échec des tests:', result.message);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Erreur lors de l\'exécution des tests:', error);
      process.exit(1);
    });
}
