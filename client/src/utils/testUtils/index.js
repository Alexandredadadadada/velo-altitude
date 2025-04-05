/**
 * Point d'entrée principal pour les tests d'optimisation
 * Ce module permet d'exécuter les différentes suites de tests et de générer des rapports complets
 */

import performanceTestRunner from './performanceTestRunner';
import featureFlagsTestRunner from './featureFlagsTestRunner';
import apiCacheTestRunner from './apiCacheTestRunner';
import visual3DTestRunner from './visual3DTestRunner';

// Statut global des tests
const testStatus = {
  completed: false,
  startTime: null,
  endTime: null,
  reports: {},
  summary: {}
};

/**
 * Initialise l'environnement de test
 */
function initTestEnvironment() {
  // Réinitialiser le statut des tests
  testStatus.completed = false;
  testStatus.startTime = new Date();
  testStatus.endTime = null;
  testStatus.reports = {};
  testStatus.summary = {};
  
  console.log('🚀 Initialisation de l\'environnement de test...');
  
  // Créer un élément dans le DOM pour afficher les résultats si nécessaire
  if (!document.getElementById('test-results-container')) {
    const container = document.createElement('div');
    container.id = 'test-results-container';
    container.style.position = 'fixed';
    container.style.bottom = '10px';
    container.style.right = '10px';
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    container.style.color = 'white';
    container.style.padding = '10px';
    container.style.borderRadius = '5px';
    container.style.zIndex = '9999';
    container.style.maxWidth = '400px';
    container.style.maxHeight = '300px';
    container.style.overflow = 'auto';
    container.style.fontSize = '12px';
    container.style.fontFamily = 'monospace';
    container.innerHTML = '<h3>Tests en cours...</h3>';
    document.body.appendChild(container);
  }
  
  console.log('✅ Environnement de test initialisé');
}

/**
 * Exécute tous les tests disponibles
 * @returns {Promise<Object>} Rapport complet des tests
 */
export async function runAllTests() {
  console.log('🚀 Démarrage de tous les tests d\'optimisation...');
  initTestEnvironment();
  
  updateTestStatus('Tests en cours d\'exécution...');
  
  try {
    // Test des feature flags
    updateTestStatus('Tests des feature flags en cours...');
    const featureFlagsReport = await featureFlagsTestRunner.runAllFeatureFlagsTests();
    testStatus.reports.featureFlags = featureFlagsReport;
    
    // Test du cache API
    updateTestStatus('Tests du cache API en cours...');
    const apiCacheReport = await apiCacheTestRunner.runAllApiCacheTests();
    testStatus.reports.apiCache = apiCacheReport;
    
    // Tests de performance
    updateTestStatus('Tests de performance en cours...');
    const performanceReport = await performanceTestRunner.runAllPerformanceTests();
    testStatus.reports.performance = performanceReport;
    
    // Tests des visualisations 3D
    updateTestStatus('Tests des visualisations 3D en cours...');
    const visual3DReport = await visual3DTestRunner.runAllVisual3DTests();
    testStatus.reports.visual3D = visual3DReport;
    
    // Générer un rapport global
    testStatus.summary = generateGlobalSummary();
    testStatus.completed = true;
    testStatus.endTime = new Date();
    
    updateTestStatus('Tests terminés !', true);
    
    return {
      reports: testStatus.reports,
      summary: testStatus.summary,
      executionTime: testStatus.endTime - testStatus.startTime
    };
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution des tests:', error);
    updateTestStatus(`Erreur: ${error.message}`, true);
    
    return { error: error.message };
  }
}

/**
 * Exécute les tests du système de feature flags
 * @returns {Promise<Object>} Rapport des tests
 */
export async function runFeatureFlagsTests() {
  console.log('🚀 Démarrage des tests de feature flags...');
  initTestEnvironment();
  
  updateTestStatus('Tests des feature flags en cours...');
  
  try {
    const featureFlagsReport = await featureFlagsTestRunner.runAllFeatureFlagsTests();
    testStatus.reports.featureFlags = featureFlagsReport;
    testStatus.completed = true;
    testStatus.endTime = new Date();
    
    updateTestStatus('Tests de feature flags terminés !', true);
    
    return featureFlagsReport;
  } catch (error) {
    console.error('❌ Erreur lors des tests de feature flags:', error);
    updateTestStatus(`Erreur: ${error.message}`, true);
    
    return { error: error.message };
  }
}

/**
 * Exécute les tests du système de cache API
 * @returns {Promise<Object>} Rapport des tests
 */
export async function runApiCacheTests() {
  console.log('🚀 Démarrage des tests de cache API...');
  initTestEnvironment();
  
  updateTestStatus('Tests du cache API en cours...');
  
  try {
    const apiCacheReport = await apiCacheTestRunner.runAllApiCacheTests();
    testStatus.reports.apiCache = apiCacheReport;
    testStatus.completed = true;
    testStatus.endTime = new Date();
    
    updateTestStatus('Tests de cache API terminés !', true);
    
    return apiCacheReport;
  } catch (error) {
    console.error('❌ Erreur lors des tests de cache API:', error);
    updateTestStatus(`Erreur: ${error.message}`, true);
    
    return { error: error.message };
  }
}

/**
 * Exécute les tests de performance
 * @returns {Promise<Object>} Rapport des tests
 */
export async function runPerformanceTests() {
  console.log('🚀 Démarrage des tests de performance...');
  initTestEnvironment();
  
  updateTestStatus('Tests de performance en cours...');
  
  try {
    const performanceReport = await performanceTestRunner.runAllPerformanceTests();
    testStatus.reports.performance = performanceReport;
    testStatus.completed = true;
    testStatus.endTime = new Date();
    
    updateTestStatus('Tests de performance terminés !', true);
    
    return performanceReport;
  } catch (error) {
    console.error('❌ Erreur lors des tests de performance:', error);
    updateTestStatus(`Erreur: ${error.message}`, true);
    
    return { error: error.message };
  }
}

/**
 * Exécute les tests des visualisations 3D
 * @returns {Promise<Object>} Rapport des tests
 */
export async function runVisual3DTests() {
  console.log('🚀 Démarrage des tests de visualisations 3D...');
  initTestEnvironment();
  
  updateTestStatus('Tests des visualisations 3D en cours...');
  
  try {
    const visual3DReport = await visual3DTestRunner.runAllVisual3DTests();
    testStatus.reports.visual3D = visual3DReport;
    testStatus.completed = true;
    testStatus.endTime = new Date();
    
    updateTestStatus('Tests de visualisations 3D terminés !', true);
    
    return visual3DReport;
  } catch (error) {
    console.error('❌ Erreur lors des tests de visualisations 3D:', error);
    updateTestStatus(`Erreur: ${error.message}`, true);
    
    return { error: error.message };
  }
}

/**
 * Exécute les tests spécifiques pour le composant SevenMajorsChallenge
 * @returns {Promise<Object>} Rapport des tests
 */
export async function runSevenMajorsChallengeTests() {
  console.log('🚀 Démarrage des tests spécifiques pour SevenMajorsChallenge...');
  initTestEnvironment();
  
  updateTestStatus('Tests de SevenMajorsChallenge en cours...');
  
  try {
    // Tester les features flags spécifiques
    const featureFlagsForSMC = await featureFlagsTestRunner.runSevenMajorsChallengeTests();
    
    // Tester les visualisations 3D
    const visual3DForSMC = await visual3DTestRunner.runSevenMajorsChallengeTests();
    
    // Combiner les résultats
    const report = {
      featureFlags: featureFlagsForSMC,
      visual3D: visual3DForSMC,
      timestamp: new Date().toISOString()
    };
    
    testStatus.reports.sevenMajorsChallenge = report;
    testStatus.completed = true;
    testStatus.endTime = new Date();
    
    updateTestStatus('Tests de SevenMajorsChallenge terminés !', true);
    
    return report;
  } catch (error) {
    console.error('❌ Erreur lors des tests de SevenMajorsChallenge:', error);
    updateTestStatus(`Erreur: ${error.message}`, true);
    
    return { error: error.message };
  }
}

/**
 * Génère un résumé global des tests
 * @returns {Object} Résumé global
 */
function generateGlobalSummary() {
  console.log('📊 Génération du résumé global...');
  
  const summary = {
    timestamp: new Date().toISOString(),
    executionTime: testStatus.endTime - testStatus.startTime,
    featureFlags: {
      success: false,
      details: {}
    },
    apiCache: {
      success: false,
      details: {}
    },
    performance: {
      success: false,
      details: {}
    },
    visual3D: {
      success: false,
      details: {}
    },
    overallSuccess: false
  };
  
  // Évaluer les résultats des feature flags
  if (testStatus.reports.featureFlags) {
    const ff = testStatus.reports.featureFlags.summary;
    summary.featureFlags.success = 
      ff.basicFlags.success === ff.basicFlags.total &&
      ff.variants.overrideSuccess === ff.variants.total &&
      ff.overrides.success === ff.overrides.total;
    
    summary.featureFlags.details = {
      flagsEnabled: `${ff.basicFlags.enabled}/${ff.basicFlags.total}`,
      segmentationSuccess: ff.segmentation ? 'Oui' : 'Non',
      overrideSuccess: `${ff.overrides.success}/${ff.overrides.total}`,
      persistenceSuccess: ff.persistence.success ? 'Oui' : 'Non'
    };
  }
  
  // Évaluer les résultats du cache API
  if (testStatus.reports.apiCache) {
    const ac = testStatus.reports.apiCache.summary;
    
    // Évaluer le succès du cache
    let cacheSuccess = false;
    if (ac.strategies && ac.strategies['cache-first']) {
      const cacheHitRate = parseFloat(ac.strategies['cache-first'].cachingRate) || 0;
      cacheSuccess = cacheHitRate > 80; // Succès si taux de cache > 80%
    }
    
    summary.apiCache.success = cacheSuccess;
    
    summary.apiCache.details = {
      cacheHitRate: ac.strategies && ac.strategies['cache-first'] ? 
        ac.strategies['cache-first'].cachingRate : 'N/A',
      invalidationSuccess: ac.invalidation ? 
        `${ac.invalidation.manual.successful}/${ac.invalidation.manual.tested}` : 'N/A',
      persistenceSuccess: ac.persistence && ac.persistence.entriesStored > 0 ? 'Oui' : 'Non',
      performanceImprovement: ac.performance && ac.performance.averageImprovement ? 
        `${ac.performance.averageImprovement.toFixed(1)}%` : 'N/A'
    };
  }
  
  // Évaluer les résultats de performance
  if (testStatus.reports.performance) {
    const perf = testStatus.reports.performance.summary;
    
    // Calculer le succès global des performances
    let perfSuccess = false;
    if (perf.apiPerformance) {
      const improvements = Object.values(perf.apiPerformance)
        .map(i => parseFloat(i.cacheImprovement));
      
      const avgImprovement = improvements.length > 0 ? 
        improvements.reduce((a, b) => a + b, 0) / improvements.length : 0;
      
      perfSuccess = avgImprovement > 50; // Succès si amélioration moyenne > 50%
    }
    
    summary.performance.success = perfSuccess;
    
    summary.performance.details = {
      apiImprovementAvg: calculateAverageImprovement(perf.apiPerformance) + '%',
      bestRenderingQuality: findBestRenderingQuality(perf.renderPerformance)
    };
  }
  
  // Évaluer les résultats des visualisations 3D
  if (testStatus.reports.visual3D) {
    const v3d = testStatus.reports.visual3D.summary;
    
    const adaptationSuccess = v3d.qualityAdaptation &&
      v3d.qualityAdaptation.deviceAdaptation &&
      parseFloat(v3d.qualityAdaptation.deviceAdaptation.successRate) > 70;
    
    const performanceSuccess = v3d.performance &&
      v3d.performance.bestQualityWithGoodPerformance !== null;
    
    const loadingSuccess = v3d.adaptiveLoading && 
      v3d.adaptiveLoading.progressiveLoading;
    
    summary.visual3D.success = adaptationSuccess && performanceSuccess && loadingSuccess;
    
    summary.visual3D.details = {
      adaptationSuccess: adaptationSuccess ? 'Oui' : 'Non',
      bestQuality: v3d.performance ? v3d.performance.bestQualityWithGoodPerformance : 'N/A',
      progressiveLoading: v3d.adaptiveLoading && v3d.adaptiveLoading.progressiveLoading ? 'Oui' : 'Non',
      frustumCulling: v3d.frustumCulling && v3d.frustumCulling.effective ? 'Efficace' : 'Inefficace',
      sevenMajorsIntegration: v3d.sevenMajorsChallenge && 
        v3d.sevenMajorsChallenge.visualization3DIntegration ? 'Oui' : 'Non'
    };
  }
  
  // Évaluer le succès global
  summary.overallSuccess = 
    summary.featureFlags.success && 
    summary.apiCache.success && 
    summary.performance.success && 
    summary.visual3D.success;
  
  console.log('✅ Résumé global généré');
  console.table({
    'Feature Flags': summary.featureFlags.success ? '✅' : '❌',
    'Cache API': summary.apiCache.success ? '✅' : '❌',
    'Performance': summary.performance.success ? '✅' : '❌',
    'Visual 3D': summary.visual3D.success ? '✅' : '❌',
    'Global': summary.overallSuccess ? '✅' : '❌'
  });
  
  return summary;
}

/**
 * Calcule l'amélioration moyenne pour les performances API
 * @param {Object} apiPerformance - Données de performance API
 * @returns {string} Amélioration moyenne en pourcentage
 */
function calculateAverageImprovement(apiPerformance) {
  if (!apiPerformance) return '0';
  
  const improvements = Object.values(apiPerformance)
    .map(i => parseFloat(i.cacheImprovement || '0'));
  
  if (improvements.length === 0) return '0';
  
  const avgImprovement = improvements.reduce((a, b) => a + b, 0) / improvements.length;
  return avgImprovement.toFixed(1);
}

/**
 * Trouve la meilleure qualité de rendu basée sur les performances
 * @param {Object} renderPerformance - Données de performance de rendu
 * @returns {string} Meilleure qualité de rendu
 */
function findBestRenderingQuality(renderPerformance) {
  if (!renderPerformance) return 'N/A';
  
  const qualities = Object.keys(renderPerformance);
  if (qualities.length === 0) return 'N/A';
  
  // Trier par FPS (plus élevé est meilleur)
  qualities.sort((a, b) => {
    const fpsA = parseFloat(renderPerformance[a].avgFPS || '0');
    const fpsB = parseFloat(renderPerformance[b].avgFPS || '0');
    return fpsB - fpsA;
  });
  
  return qualities[0];
}

/**
 * Met à jour l'affichage du statut des tests
 * @param {string} message - Message à afficher
 * @param {boolean} [final=false] - Si true, c'est le message final
 */
function updateTestStatus(message, final = false) {
  const container = document.getElementById('test-results-container');
  if (!container) return;
  
  if (final) {
    const executionTime = testStatus.endTime ? 
      ((testStatus.endTime - testStatus.startTime) / 1000).toFixed(1) : 'N/A';
    
    container.innerHTML = `
      <h3>Tests terminés (${executionTime}s)</h3>
      <p>${message}</p>
      <button id="export-test-results" style="padding: 5px; margin-top: 10px;">
        Exporter les résultats
      </button>
      <button id="close-test-results" style="padding: 5px; margin-top: 10px; margin-left: 10px;">
        Fermer
      </button>
    `;
    
    // Ajouter les gestionnaires d'événements
    document.getElementById('export-test-results').addEventListener('click', exportAllTestResults);
    document.getElementById('close-test-results').addEventListener('click', () => {
      container.style.display = 'none';
    });
  } else {
    container.innerHTML = `
      <h3>Tests en cours...</h3>
      <p>${message}</p>
      <div style="width: 100%; height: 5px; background-color: #333; margin-top: 10px;">
        <div style="width: 20%; height: 100%; background-color: #4CAF50; animation: progress 1s linear infinite;"></div>
      </div>
    `;
  }
}

/**
 * Exporte tous les résultats des tests au format JSON
 */
function exportAllTestResults() {
  console.log('💾 Exportation des résultats...');
  
  const results = {
    summary: testStatus.summary,
    reports: testStatus.reports,
    executionTime: testStatus.endTime - testStatus.startTime,
    timestamp: new Date().toISOString()
  };
  
  const jsonStr = JSON.stringify(results, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `optimisation-tests-results-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  console.log('✅ Résultats exportés');
}

// Style pour l'animation de la barre de progression
const style = document.createElement('style');
style.textContent = `
  @keyframes progress {
    0% { margin-left: 0; }
    50% { margin-left: 80%; }
    100% { margin-left: 0; }
  }
`;
document.head.appendChild(style);

// Export par défaut
export default {
  runAllTests,
  runFeatureFlagsTests,
  runApiCacheTests,
  runPerformanceTests,
  runVisual3DTests,
  runSevenMajorsChallengeTests,
  exportAllTestResults
};
