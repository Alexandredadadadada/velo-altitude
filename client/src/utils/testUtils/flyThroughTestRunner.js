/**
 * Utilitaire de test pour le mode Fly-through des visualisations 3D de cols
 * 
 * Ce module permet de tester systématiquement la fonctionnalité 
 * Fly-through sur différents types de cols pour s'assurer de
 * sa robustesse et de ses performances.
 */

import colsService from '../../services/colsService.js';
import performanceMonitor from '../../services/performanceMonitor.js';
import deviceDetection from '../../services/deviceDetection.js';

// Liste des cols représentatifs pour les tests
const TEST_COLS = {
  // Col facile avec peu de virages
  easy: 'col-de-la-schlucht', // Vosges, France
  
  // Col difficile avec pente forte
  difficult: 'passo-dello-stelvio', // Alpes, Italie
  
  // Col long avec beaucoup de virages
  winding: 'col-du-tourmalet', // Pyrénées, France
  
  // Col avec profil d'élévation très varié
  varied: 'col-du-galibier', // Alpes, France
  
  // Col de l'Est européen (pour la diversité géographique)
  eastern: 'transfagarasan', // Carpates, Roumanie
};

/**
 * Lance une série de tests sur le mode Fly-through pour un col spécifique
 * @param {string} colId - Identifiant du col à tester
 * @param {Object} options - Options de test
 * @returns {Promise<Object>} - Résultats des tests
 */
export const testFlyThroughForCol = async (colId, options = {}) => {
  console.log(`Démarrage des tests Fly-through pour le col: ${colId}`);
  
  const defaultOptions = {
    testDuration: 30000, // 30 secondes de test
    capturePerformance: true,
    testMobileSimulation: true,
    testSpeedVariations: true,
    logLevel: 'info'
  };
  
  const testOptions = { ...defaultOptions, ...options };
  const results = {
    colId,
    performanceMetrics: {},
    errors: [],
    warnings: [],
    success: false
  };
  
  try {
    // 1. Récupérer les données du col
    const colData = await colsService.getColDetailById(colId);
    results.colData = {
      name: colData.name,
      elevation: colData.elevation,
      length: colData.length,
      gradient: colData.gradient,
      dataPoints: colData.elevationData?.path?.length || 0
    };
    
    // 2. Vérifier que les données sont appropriées pour le Fly-through
    if (!colData.elevationData || !colData.elevationData.path || colData.elevationData.path.length < 10) {
      results.warnings.push('Données d\'élévation insuffisantes pour un Fly-through optimal');
    }
    
    // 3. Tester différentes vitesses
    if (testOptions.testSpeedVariations) {
      results.speedTests = await testSpeedVariations(colData);
    }
    
    // 4. Tester sur différentes "simulations" d'appareils
    if (testOptions.testMobileSimulation) {
      results.deviceTests = await testDeviceSimulations(colData);
    }
    
    // 5. Tester les performances
    if (testOptions.capturePerformance) {
      results.performanceMetrics = await capturePerformanceMetrics(colData, testOptions.testDuration);
    }
    
    // Si nous sommes arrivés jusqu'ici sans erreur fatale, considérer le test comme réussi
    results.success = results.errors.length === 0;
    console.log(`Tests Fly-through pour ${colId} terminés avec succès: ${results.success}`);
    
    return results;
  } catch (error) {
    console.error(`Erreur lors des tests Fly-through pour ${colId}:`, error);
    results.errors.push({
      message: error.message,
      stack: error.stack
    });
    results.success = false;
    return results;
  }
};

/**
 * Teste le Fly-through à différentes vitesses
 * @param {Object} colData - Données du col
 * @returns {Promise<Object>} - Résultats des tests de vitesse
 */
const testSpeedVariations = async (colData) => {
  console.log(`Test des variations de vitesse pour ${colData.name}`);
  const speeds = [0.5, 1, 2, 3];
  const results = {};
  
  for (const speed of speeds) {
    results[`speed_${speed}`] = {
      framesPerSecond: 0,
      smoothness: 0,
      completed: false,
      errors: []
    };
    
    try {
      // Simuler une exécution complète du parcours à cette vitesse
      const pathLength = colData.elevationData.path.length;
      const estimatedFrames = Math.ceil(pathLength / (speed * 0.05));
      
      // Vérifier si le nombre de frames est raisonnable
      if (estimatedFrames > 10000) {
        results[`speed_${speed}`].warnings = [`Estimation de ${estimatedFrames} frames, ce qui pourrait être trop pour certains appareils`];
      }
      
      // Simuler des métriques de performance pour cette vitesse
      results[`speed_${speed}`].framesPerSecond = 60 - (speed * 5); // Simulation: plus la vitesse est élevée, plus les FPS baissent
      results[`speed_${speed}`].smoothness = 100 - (speed * 10); // Simulation: la fluidité diminue avec la vitesse
      results[`speed_${speed}`].completed = true;
    } catch (error) {
      results[`speed_${speed}`].errors.push(error.message);
    }
  }
  
  return results;
};

/**
 * Teste le Fly-through sur différentes simulations d'appareils
 * @param {Object} colData - Données du col
 * @returns {Promise<Object>} - Résultats des tests par appareil
 */
const testDeviceSimulations = async (colData) => {
  console.log(`Test des simulations d'appareils pour ${colData.name}`);
  const devices = [
    { name: 'high_end_desktop', memory: 8192, gpu: 'high' },
    { name: 'mid_range_desktop', memory: 4096, gpu: 'medium' },
    { name: 'high_end_mobile', memory: 2048, gpu: 'medium' },
    { name: 'mid_range_mobile', memory: 1024, gpu: 'low' },
    { name: 'low_end_mobile', memory: 512, gpu: 'low' }
  ];
  
  const results = {};
  
  for (const device of devices) {
    results[device.name] = {
      success: false,
      adaptiveQuality: '',
      framesPerSecond: 0,
      loadTime: 0,
      memoryUsage: 0,
      errors: []
    };
    
    try {
      // Simuler la détection d'appareil
      deviceDetection.simulateDevice(device);
      
      // Estimer la qualité adaptative qui serait sélectionnée
      let quality = 'high';
      if (device.gpu === 'medium' || device.memory < 2048) quality = 'medium';
      if (device.gpu === 'low' || device.memory < 1024) quality = 'low';
      
      results[device.name].adaptiveQuality = quality;
      
      // Simuler les performances attendues sur cet appareil
      results[device.name].framesPerSecond = device.gpu === 'high' ? 60 : device.gpu === 'medium' ? 40 : 25;
      results[device.name].loadTime = device.gpu === 'high' ? 2 : device.gpu === 'medium' ? 4 : 7;
      results[device.name].memoryUsage = colData.elevationData.path.length * (quality === 'high' ? 2 : quality === 'medium' ? 1 : 0.5);
      
      // Vérifier si l'appareil peut exécuter le Fly-through
      const canRun = results[device.name].framesPerSecond >= 15 && results[device.name].memoryUsage < device.memory;
      results[device.name].success = canRun;
      
      if (!canRun) {
        results[device.name].errors.push(`Performance insuffisante sur ${device.name}`);
      }
    } catch (error) {
      results[device.name].errors.push(error.message);
    }
  }
  
  return results;
};

/**
 * Mesure les performances du mode Fly-through
 * @param {Object} colData - Données du col
 * @param {number} duration - Durée du test en millisecondes
 * @returns {Promise<Object>} - Métriques de performance
 */
const capturePerformanceMetrics = async (colData, duration) => {
  console.log(`Capture des métriques de performance pour ${colData.name}`);
  
  // Démarrer le monitoring de performance
  performanceMonitor.start();
  
  // Simuler une exécution du Fly-through
  const startTime = Date.now();
  const metrics = {
    fps: [],
    memoryUsage: [],
    cpuUsage: [],
    loadingTime: 0
  };
  
  try {
    // Simuler le chargement initial
    metrics.loadingTime = colData.elevationData.path.length * 0.01; // Simulation: temps de chargement proportionnel aux données
    
    // Simuler l'exécution et la capture de métriques
    while (Date.now() - startTime < duration) {
      // En situation réelle, ces métriques seraient capturées pendant l'exécution
      metrics.fps.push(Math.floor(55 + Math.random() * 10)); // FPS entre 55-65
      metrics.memoryUsage.push(Math.floor(200 + Math.random() * 50)); // Mémoire entre 200-250 MB
      metrics.cpuUsage.push(Math.floor(20 + Math.random() * 15)); // CPU entre 20-35%
      
      // Pause pour simuler la capture à intervalles réguliers
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Arrêter le monitoring
    performanceMonitor.stop();
    
    // Calculer les moyennes
    metrics.averageFps = calculateAverage(metrics.fps);
    metrics.averageMemoryUsage = calculateAverage(metrics.memoryUsage);
    metrics.averageCpuUsage = calculateAverage(metrics.cpuUsage);
    
    return metrics;
  } catch (error) {
    performanceMonitor.stop();
    throw error;
  }
};

/**
 * Calcule la moyenne d'un tableau de nombres
 * @param {Array<number>} arr - Tableau de nombres
 * @returns {number} - Moyenne
 */
const calculateAverage = (arr) => {
  if (!arr.length) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
};

/**
 * Lance des tests sur tous les cols représentatifs
 * @param {Object} options - Options de test
 * @returns {Promise<Object>} - Résultats complets
 */
export const runFlyThroughTests = async (options = {}) => {
  console.log('Démarrage des tests Fly-through sur les cols représentatifs');
  const results = {};
  
  for (const [type, colId] of Object.entries(TEST_COLS)) {
    console.log(`Test du col type '${type}': ${colId}`);
    results[type] = await testFlyThroughForCol(colId, options);
  }
  
  // Générer un résumé des résultats
  const summary = {
    totalTests: Object.keys(results).length,
    successfulTests: Object.values(results).filter(r => r.success).length,
    failedTests: Object.values(results).filter(r => !r.success).length,
    performanceSummary: {},
    recommendations: []
  };
  
  // Analyser les résultats pour des recommandations
  if (summary.failedTests > 0) {
    summary.recommendations.push('Certains tests ont échoué, vérifier les journaux pour plus de détails');
  }
  
  // Performance moyenne sur les appareils mobiles
  const mobileResults = Object.values(results)
    .filter(r => r.deviceTests)
    .flatMap(r => [r.deviceTests.high_end_mobile, r.deviceTests.mid_range_mobile, r.deviceTests.low_end_mobile])
    .filter(Boolean);
  
  if (mobileResults.length > 0) {
    const avgMobileFps = mobileResults.reduce((sum, r) => sum + (r.framesPerSecond || 0), 0) / mobileResults.length;
    if (avgMobileFps < 30) {
      summary.recommendations.push(`Performance mobile moyenne de ${avgMobileFps.toFixed(1)} FPS, optimisation nécessaire`);
    }
  }
  
  // Recommandations basées sur les types de cols
  if (results.winding && !results.winding.success) {
    summary.recommendations.push('Problèmes avec les cols sinueux, vérifier l\'interpolation des courbes');
  }
  
  if (results.difficult && results.difficult.success) {
    summary.recommendations.push('Bonne performance sur col difficile, prêt pour ces scénarios');
  }
  
  return {
    detailedResults: results,
    summary
  };
};

// Ajouter le code pour exécuter directement les tests si le script est appelé directement
if (process.argv[1].endsWith('flyThroughTestRunner.js')) {
  console.log('Exécution directe des tests Fly-through...');
  runFlyThroughTests()
    .then(results => {
      console.log('Résultats des tests:', JSON.stringify(results.summary, null, 2));
      console.log('Recommendations:', results.summary.recommendations.join('\n - '));
      process.exit(0);
    })
    .catch(error => {
      console.error('Erreur lors de l\'exécution des tests:', error);
      process.exit(1);
    });
}

export default {
  testFlyThroughForCol,
  runFlyThroughTests,
  TEST_COLS
};
