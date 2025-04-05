/**
 * Script d'intégration du système de gestion sécurisée des clés API
 * 
 * Ce script démontre l'utilisation intégrée des différentes composantes du système de sécurité :
 * - SecureMemoryStorage
 * - SecretManager
 * - ApiKeyPermissionManager
 * - EnhancedApiKeyRotationManager
 * - EnhancedApiKeyManager
 * 
 * Dashboard-Velo.com
 */

const path = require('path');
const dotenv = require('dotenv');
const crypto = require('crypto');

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Importer les composants
const EnhancedApiKeyManager = require('../utils/enhanced-api-key-manager');
const { logger } = require('../utils/logger');

// Configuration pour la démonstration
const DEMO_MODULES = {
  WEATHER: 'weather-module',
  MAP: 'map-module',
  ACTIVITY: 'activity-module',
  ADMIN: 'admin'
};

const DEMO_SERVICES = {
  WEATHER: 'weatherService',
  OPENROUTE: 'openRouteService',
  STRAVA: 'strava',
  MAPBOX: 'mapbox'
};

/**
 * Fonction principale de démonstration
 */
async function runDemo() {
  logger.info('Démarrage de la démonstration du système de gestion sécurisée des clés API');
  
  try {
    // Générer une clé de chiffrement si non définie
    if (!process.env.API_KEYS_ENCRYPTION_KEY) {
      process.env.API_KEYS_ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
      logger.info('Clé de chiffrement générée pour la démonstration');
    }
    
    // Créer et initialiser le gestionnaire de clés API
    const apiKeyManager = new EnhancedApiKeyManager({
      keysDirectory: path.join(__dirname, '..', '.keys'),
      rotationInterval: 5 * 60 * 1000, // 5 minutes pour la démo
      gracePeriod: 2 * 60 * 1000, // 2 minutes pour la démo
      memoryTTL: 60 * 1000, // 1 minute pour la démo
      logger: logger
    });
    
    // Initialiser le gestionnaire
    await apiKeyManager.initialize();
    logger.info('Gestionnaire de clés API initialisé');
    
    // Démonstration 1: Accès aux clés API avec permissions
    await demonstrateApiKeyAccess(apiKeyManager);
    
    // Démonstration 2: Rotation des clés API
    await demonstrateApiKeyRotation(apiKeyManager);
    
    // Démonstration 3: Génération de rapport
    await demonstrateReportGeneration(apiKeyManager);
    
    // Arrêter le gestionnaire
    apiKeyManager.stop();
    logger.info('Démonstration terminée avec succès');
  } catch (error) {
    logger.error('Erreur lors de la démonstration', {
      error: error.message,
      stack: error.stack
    });
  }
}

/**
 * Démonstration de l'accès aux clés API avec permissions
 * @param {EnhancedApiKeyManager} apiKeyManager - Gestionnaire de clés API
 */
async function demonstrateApiKeyAccess(apiKeyManager) {
  logger.info('=== Démonstration de l\'accès aux clés API avec permissions ===');
  
  try {
    // Accès autorisé
    logger.info('Tentative d\'accès autorisé:');
    const weatherKey = await apiKeyManager.getApiKey(DEMO_SERVICES.WEATHER, DEMO_MODULES.WEATHER);
    logger.info(`Clé API récupérée avec succès pour ${DEMO_SERVICES.WEATHER} par ${DEMO_MODULES.WEATHER}`);
    
    const mapKey = await apiKeyManager.getApiKey(DEMO_SERVICES.OPENROUTE, DEMO_MODULES.MAP);
    logger.info(`Clé API récupérée avec succès pour ${DEMO_SERVICES.OPENROUTE} par ${DEMO_MODULES.MAP}`);
    
    // Accès non autorisé
    logger.info('Tentative d\'accès non autorisé:');
    try {
      await apiKeyManager.getApiKey(DEMO_SERVICES.STRAVA, DEMO_MODULES.WEATHER);
      logger.error('ERREUR: Accès non autorisé réussi!');
    } catch (error) {
      logger.info(`Accès correctement refusé: ${error.message}`);
    }
    
    // Accès administrateur
    logger.info('Tentative d\'accès administrateur:');
    const adminKey = await apiKeyManager.getApiKey(DEMO_SERVICES.STRAVA, DEMO_MODULES.ADMIN);
    logger.info(`Clé API récupérée avec succès pour ${DEMO_SERVICES.STRAVA} par ${DEMO_MODULES.ADMIN}`);
    
    // Vérification du cache mémoire
    logger.info('Vérification du cache mémoire:');
    const cachedKey = await apiKeyManager.getApiKey(DEMO_SERVICES.WEATHER, DEMO_MODULES.WEATHER);
    logger.info(`Clé API récupérée depuis le cache pour ${DEMO_SERVICES.WEATHER}`);
    
    // Vérification de validité des clés
    logger.info('Vérification de validité des clés:');
    const isValid = await apiKeyManager.isValidKey(DEMO_SERVICES.WEATHER, weatherKey);
    logger.info(`La clé pour ${DEMO_SERVICES.WEATHER} est ${isValid ? 'valide' : 'invalide'}`);
  } catch (error) {
    logger.error('Erreur lors de la démonstration d\'accès', {
      error: error.message
    });
  }
}

/**
 * Démonstration de la rotation des clés API
 * @param {EnhancedApiKeyManager} apiKeyManager - Gestionnaire de clés API
 */
async function demonstrateApiKeyRotation(apiKeyManager) {
  logger.info('=== Démonstration de la rotation des clés API ===');
  
  try {
    // Récupérer la clé actuelle
    const currentKey = await apiKeyManager.getApiKey(DEMO_SERVICES.MAPBOX, DEMO_MODULES.MAP);
    logger.info(`Clé actuelle pour ${DEMO_SERVICES.MAPBOX}: ${currentKey.substring(0, 8)}...`);
    
    // Forcer une rotation
    logger.info('Forçage d\'une rotation de clé...');
    await apiKeyManager.rotationManager.forceRotation(DEMO_SERVICES.MAPBOX);
    
    // Récupérer la nouvelle clé
    const newKey = await apiKeyManager.getApiKey(DEMO_SERVICES.MAPBOX, DEMO_MODULES.MAP);
    logger.info(`Nouvelle clé pour ${DEMO_SERVICES.MAPBOX}: ${newKey.substring(0, 8)}...`);
    
    // Vérifier que l'ancienne clé est toujours valide (période de grâce)
    const isOldKeyValid = await apiKeyManager.isValidKey(DEMO_SERVICES.MAPBOX, currentKey);
    logger.info(`L'ancienne clé est ${isOldKeyValid ? 'toujours valide (période de grâce)' : 'invalide'}`);
    
    // Attendre la fin de la période de grâce
    logger.info('Attente de la fin de la période de grâce (2 minutes)...');
    await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000 + 5000));
    
    // Vérifier que l'ancienne clé n'est plus valide
    const isOldKeyStillValid = await apiKeyManager.isValidKey(DEMO_SERVICES.MAPBOX, currentKey);
    logger.info(`Après la période de grâce, l'ancienne clé est ${isOldKeyStillValid ? 'encore valide' : 'maintenant invalide'}`);
  } catch (error) {
    logger.error('Erreur lors de la démonstration de rotation', {
      error: error.message
    });
  }
}

/**
 * Démonstration de la génération de rapport
 * @param {EnhancedApiKeyManager} apiKeyManager - Gestionnaire de clés API
 */
async function demonstrateReportGeneration(apiKeyManager) {
  logger.info('=== Démonstration de la génération de rapport ===');
  
  try {
    // Générer un rapport sur l'état des clés API
    const apiKeyReport = await apiKeyManager.generateReport();
    logger.info('Rapport sur l\'état des clés API:');
    console.log(JSON.stringify(apiKeyReport, null, 2));
    
    // Générer un rapport sur l'état des rotations
    const rotationReport = await apiKeyManager.rotationManager.generateRotationReport();
    logger.info('Rapport sur l\'état des rotations:');
    console.log(JSON.stringify(rotationReport, null, 2));
    
    // Générer un rapport sur les permissions
    const permissionsReport = apiKeyManager.permissionManager.generatePermissionsReport();
    logger.info('Rapport sur les permissions:');
    console.log(JSON.stringify(permissionsReport, null, 2));
  } catch (error) {
    logger.error('Erreur lors de la génération des rapports', {
      error: error.message
    });
  }
}

// Exécuter la démonstration
if (require.main === module) {
  runDemo().catch(error => {
    logger.error('Erreur non gérée', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  });
}

module.exports = {
  runDemo
};
