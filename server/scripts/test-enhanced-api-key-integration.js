/**
 * Test d'intégration du système de gestion sécurisée des clés API
 * avec le service OpenRouteService
 * 
 * Ce script teste l'intégration du nouveau système de gestion sécurisée
 * des clés API avec le service OpenRouteService existant.
 * 
 * Dashboard-Velo.com
 */

const path = require('path');
const dotenv = require('dotenv');
const { logger } = require('../utils/logger');

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Importer les services
const apiServices = require('../services/apiServices');
const OpenRouteService = require('../services/openroute.service');

/**
 * Fonction principale de test
 */
async function runTest() {
  logger.info('Démarrage du test d\'intégration du système de gestion sécurisée des clés API avec OpenRouteService');
  
  try {
    // Initialiser le gestionnaire de clés API
    logger.info('Initialisation du gestionnaire de clés API...');
    
    // Vérifier que le gestionnaire est bien initialisé
    if (!apiServices.manager) {
      throw new Error('Le gestionnaire de clés API n\'est pas initialisé');
    }
    
    // Générer un rapport sur l'état des clés API
    logger.info('Génération d\'un rapport sur l\'état des clés API...');
    const report = await apiServices.manager.generateReport();
    console.log('Rapport sur l\'état des clés API:');
    console.log(JSON.stringify(report, null, 2));
    
    // Tester l'accès à la clé API OpenRouteService
    logger.info('Test d\'accès à la clé API OpenRouteService...');
    const openRouteKey = await apiServices.openRouteService.getKey();
    logger.info(`Clé API OpenRouteService récupérée: ${openRouteKey.substring(0, 8)}...`);
    
    // Tester la rotation des clés
    logger.info('Test de rotation des clés OpenRouteService...');
    await apiServices.openRouteService.rotateKeys();
    logger.info('Rotation effectuée');
    
    // Récupérer la nouvelle clé
    const newOpenRouteKey = await apiServices.openRouteService.getKey();
    logger.info(`Nouvelle clé API OpenRouteService après rotation: ${newOpenRouteKey.substring(0, 8)}...`);
    
    // Vérifier que l'ancienne clé est toujours valide (période de grâce)
    const isOldKeyValid = await apiServices.openRouteService.isValidKey(openRouteKey);
    logger.info(`L'ancienne clé est ${isOldKeyValid ? 'toujours valide (période de grâce)' : 'invalide'}`);
    
    // Tester l'intégration avec le service OpenRouteService
    logger.info('Test d\'intégration avec le service OpenRouteService...');
    const openRouteService = new OpenRouteService();
    
    // Tester une requête simple
    logger.info('Test d\'une requête simple à OpenRouteService...');
    try {
      // Coordonnées de test (Strasbourg)
      const startPoint = [7.7521, 48.5734];
      const endPoint = [7.7421, 48.5834];
      
      // Obtenir un itinéraire
      const route = await openRouteService.getRoute(startPoint, endPoint);
      logger.info('Requête réussie!', {
        distance: route.distance,
        duration: route.duration
      });
    } catch (error) {
      // Si la requête échoue, vérifier si c'est à cause d'une clé API invalide
      logger.error('Erreur lors de la requête à OpenRouteService', {
        error: error.message
      });
      
      // Vérifier si l'erreur est liée à la clé API
      if (error.message.includes('API key') || error.message.includes('Unauthorized')) {
        logger.warn('Erreur liée à la clé API, vérification des clés disponibles...');
        const allKeys = await apiServices.openRouteService.getAllKeys();
        logger.info(`Nombre de clés disponibles: ${allKeys.length}`);
      }
    }
    
    // Tester les permissions
    logger.info('Test des permissions d\'accès aux clés API...');
    const permissionsReport = apiServices.manager.permissionManager.generatePermissionsReport();
    console.log('Rapport sur les permissions:');
    console.log(JSON.stringify(permissionsReport, null, 2));
    
    // Arrêter le gestionnaire de clés API
    logger.info('Arrêt du gestionnaire de clés API...');
    apiServices.stopAll();
    
    logger.info('Test d\'intégration terminé avec succès');
    return true;
  } catch (error) {
    logger.error('Erreur lors du test d\'intégration', {
      error: error.message,
      stack: error.stack
    });
    return false;
  }
}

// Exécuter le test
if (require.main === module) {
  runTest().then(success => {
    if (success) {
      logger.info('Test d\'intégration réussi');
      process.exit(0);
    } else {
      logger.error('Test d\'intégration échoué');
      process.exit(1);
    }
  }).catch(error => {
    logger.error('Erreur non gérée', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  });
}

module.exports = {
  runTest
};
