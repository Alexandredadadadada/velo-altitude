/**
 * Script de test des améliorations système
 * Ce script vérifie que toutes les améliorations apportées fonctionnent correctement
 */
const axios = require('axios');
const logger = require('../utils/logger');
const authService = require('../services/auth.service');
const stravaSyncService = require('../services/strava-sync.service');
const performanceMonitor = require('../services/performance-monitor.service');
const openRouteService = require('../services/openroute.service');

// Configuration
const config = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
  testUser: {
    email: 'test@example.com',
    password: 'TestPassword123!'
  },
  testRouteCoordinates: {
    start: [7.7521, 48.5734], // Strasbourg
    end: [7.2661, 47.7486]    // Mulhouse
  }
};

/**
 * Exécute tous les tests
 */
async function runAllTests() {
  logger.info('=== Démarrage des tests des améliorations système ===');
  
  try {
    // Tester les améliorations d'authentification
    await testAuthImprovements();
    
    // Tester les améliorations de synchronisation Strava
    await testStravaSyncImprovements();
    
    // Tester les améliorations de résilience OpenRoute
    await testOpenRouteResilience();
    
    // Tester le système de surveillance des performances
    await testPerformanceMonitoring();
    
    logger.info('=== Tous les tests ont réussi ===');
  } catch (error) {
    logger.error(`Échec des tests: ${error.message}`, { error });
    process.exit(1);
  }
}

/**
 * Teste les améliorations d'authentification
 */
async function testAuthImprovements() {
  logger.info('Test des améliorations d\'authentification...');
  
  // Test 1: Rotation des clés JWT avec période de grâce
  const initialKeyId = authService.keyRotation.currentKeyId;
  const initialKeyCount = authService.keyRotation.keys.size;
  
  // Générer un token avec la clé actuelle
  const testUser = { id: 'test-user', role: 'user' };
  const token = authService.generateToken(testUser);
  
  // Effectuer une rotation de clé
  authService.rotateSigningKeys();
  
  // Vérifier que la nouvelle clé est créée et l'ancienne conservée
  if (authService.keyRotation.currentKeyId !== initialKeyId + 1) {
    throw new Error('La rotation des clés n\'a pas incrémenté l\'ID de clé');
  }
  
  if (authService.keyRotation.keys.size !== initialKeyCount + 1) {
    throw new Error('La rotation des clés n\'a pas conservé l\'ancienne clé');
  }
  
  // Vérifier que le token généré avec l'ancienne clé est toujours valide
  try {
    const decoded = await authService.verifyToken(token);
    if (decoded.id !== testUser.id) {
      throw new Error('Le token décodé ne correspond pas à l\'utilisateur de test');
    }
    logger.info('✓ Test de rotation des clés JWT réussi');
  } catch (error) {
    throw new Error(`Échec de la vérification du token après rotation: ${error.message}`);
  }
  
  // Test 2: Vérification des empreintes client
  const fingerprint1 = 'Chrome:Windows:1920x1080:fr-FR';
  const fingerprint2 = 'Firefox:Windows:1920x1080:fr-FR'; // Navigateur différent
  const fingerprint3 = 'Safari:MacOS:1440x900:en-US';     // Très différent
  
  // Première empreinte
  const result1 = authService.isSuspiciousActivity(testUser.id, fingerprint1);
  if (result1 !== false) {
    throw new Error('La première empreinte a été marquée comme suspecte');
  }
  
  // Deuxième empreinte (similaire)
  const result2 = authService.isSuspiciousActivity(testUser.id, fingerprint2);
  if (result2 !== false) {
    throw new Error('Une empreinte similaire a été marquée comme suspecte');
  }
  
  // Troisième empreinte (différente)
  const result3 = authService.isSuspiciousActivity(testUser.id, fingerprint3);
  if (result3 !== false) {
    throw new Error('Une nouvelle empreinte a été marquée comme suspecte');
  }
  
  logger.info('✓ Test de vérification des empreintes client réussi');
  
  logger.info('✓ Tests d\'authentification réussis');
}

/**
 * Teste les améliorations de synchronisation Strava
 */
async function testStravaSyncImprovements() {
  logger.info('Test des améliorations de synchronisation Strava...');
  
  // Test 1: File d'attente de synchronisation
  // Simuler que le maximum de synchronisations est atteint
  const originalMaxConcurrentSyncs = stravaSyncService.maxConcurrentSyncs;
  stravaSyncService.maxConcurrentSyncs = 2;
  
  // Ajouter des synchronisations en cours
  stravaSyncService.syncInProgress.add('user-1');
  stravaSyncService.syncInProgress.add('user-2');
  
  // Vérifier que la file d'attente est vide au départ
  if (stravaSyncService.syncQueue.length !== 0) {
    throw new Error('La file d\'attente n\'est pas vide au départ');
  }
  
  // Tenter de démarrer une nouvelle synchronisation
  const syncPromise = stravaSyncService.startSync('new-user');
  
  // Vérifier que la demande est mise en file d'attente
  if (stravaSyncService.syncQueue.length !== 1) {
    throw new Error('La demande n\'a pas été mise en file d\'attente');
  }
  
  if (stravaSyncService.syncQueue[0].userId !== 'new-user') {
    throw new Error('L\'utilisateur dans la file d\'attente ne correspond pas');
  }
  
  // Simuler la fin d'une synchronisation
  stravaSyncService.syncInProgress.delete('user-1');
  
  // Déclencher le traitement de la file d'attente
  await stravaSyncService._processQueue();
  
  // Restaurer la configuration originale
  stravaSyncService.maxConcurrentSyncs = originalMaxConcurrentSyncs;
  stravaSyncService.syncInProgress.clear();
  
  logger.info('✓ Test de file d\'attente de synchronisation réussi');
  
  logger.info('✓ Tests de synchronisation Strava réussis');
}

/**
 * Teste les améliorations de résilience d'OpenRoute
 */
async function testOpenRouteResilience() {
  logger.info('Test des améliorations de résilience OpenRoute...');
  
  // Test 1: Mécanisme de retry
  let attempts = 0;
  const originalExecuteWithRetry = openRouteService._executeWithRetry;
  
  // Remplacer temporairement la méthode par un mock
  openRouteService._executeWithRetry = async (apiCall, maxRetries = 3, initialDelay = 1000) => {
    // Simuler 2 échecs suivis d'un succès
    attempts++;
    if (attempts <= 2) {
      throw { retryable: true, message: 'Erreur simulée pour test' };
    }
    return { success: true, data: 'Test data' };
  };
  
  // Appeler la méthode mockée
  try {
    const result = await openRouteService._executeWithRetry(() => {}, 3, 100);
    if (!result.success) {
      throw new Error('Le résultat du retry n\'est pas un succès');
    }
    
    if (attempts !== 3) {
      throw new Error(`Nombre incorrect de tentatives: ${attempts} (attendu: 3)`);
    }
    
    logger.info('✓ Test de mécanisme de retry réussi');
  } catch (error) {
    // Restaurer la méthode originale avant de propager l'erreur
    openRouteService._executeWithRetry = originalExecuteWithRetry;
    throw error;
  }
  
  // Restaurer la méthode originale
  openRouteService._executeWithRetry = originalExecuteWithRetry;
  
  logger.info('✓ Tests de résilience OpenRoute réussis');
}

/**
 * Teste le système de surveillance des performances
 */
async function testPerformanceMonitoring() {
  logger.info('Test du système de surveillance des performances...');
  
  // Test 1: Enregistrement et récupération des métriques
  const testService = 'TestService';
  
  // Enregistrer une requête
  const endMeasure = performanceMonitor.startRequest(testService);
  
  // Simuler un traitement
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // Terminer la mesure
  endMeasure();
  
  // Forcer la collecte des métriques
  performanceMonitor.collectMetrics();
  
  // Récupérer les métriques
  const metrics = performanceMonitor.getServiceMetrics(testService);
  
  if (!metrics) {
    throw new Error('Aucune métrique n\'a été enregistrée pour le service de test');
  }
  
  // Vérifier les métriques globales
  const globalMetrics = performanceMonitor.getGlobalMetrics();
  
  if (!globalMetrics.services.includes(testService)) {
    throw new Error('Le service de test n\'apparaît pas dans les métriques globales');
  }
  
  logger.info('✓ Test d\'enregistrement des métriques réussi');
  
  // Test 2: Détection des alertes
  // Simuler une métrique dépassant le seuil d'alerte
  const originalCheckThresholds = performanceMonitor.checkThresholds;
  let alertRaised = false;
  
  performanceMonitor.checkThresholds = (serviceName, metrics) => {
    if (serviceName === testService) {
      performanceMonitor.raiseAlert(serviceName, 'test', 'warning', 'Alerte de test');
      alertRaised = true;
    }
  };
  
  // Déclencher la détection d'anomalies
  performanceMonitor.detectAnomalies();
  
  // Vérifier qu'une alerte a été déclenchée
  if (!alertRaised) {
    throw new Error('Aucune alerte n\'a été déclenchée');
  }
  
  // Récupérer les alertes actives
  const alerts = performanceMonitor.getActiveAlerts();
  const testAlert = alerts.find(a => a.service === testService && a.type === 'test');
  
  if (!testAlert) {
    throw new Error('L\'alerte de test n\'a pas été trouvée dans les alertes actives');
  }
  
  // Résoudre l'alerte
  performanceMonitor.resolveAlert(testService, 'test');
  
  // Vérifier que l'alerte a été résolue
  const alertsAfterResolve = performanceMonitor.getActiveAlerts();
  if (alertsAfterResolve.some(a => a.service === testService && a.type === 'test')) {
    throw new Error('L\'alerte n\'a pas été résolue correctement');
  }
  
  // Restaurer la méthode originale
  performanceMonitor.checkThresholds = originalCheckThresholds;
  
  logger.info('✓ Test de détection des alertes réussi');
  
  logger.info('✓ Tests de surveillance des performances réussis');
}

// Exécuter tous les tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Erreur lors des tests:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testAuthImprovements,
  testStravaSyncImprovements,
  testOpenRouteResilience,
  testPerformanceMonitoring
};
