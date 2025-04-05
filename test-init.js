/**
 * Script de test pour vérifier l'initialisation des services
 */

const { logger } = require('./server/utils/logger');
const initServices = require('./server/services/initServices');

async function testInitialization() {
  try {
    logger.info('=== TEST D\'INITIALISATION DES SERVICES ===');
    
    // Initialiser tous les services
    await initServices.initializeAllServices();
    
    // Vérifier l'état de santé des services
    const health = await initServices.checkServicesHealth();
    
    logger.info('État de santé des services:', health);
    
    // Obtenir la liste des services initialisés
    const services = initServices.getAllServices();
    logger.info('Services initialisés:', Object.keys(services));
    
    logger.info('=== TEST TERMINÉ AVEC SUCCÈS ===');
    process.exit(0);
  } catch (error) {
    logger.error('Erreur lors du test d\'initialisation:', error);
    process.exit(1);
  }
}

// Exécuter le test
testInitialization();
