/**
 * Utilitaire pour exécuter des tests de performance automatisés
 * Cet outil permet de mesurer l'impact des optimisations sur les performances
 */

import { performanceTest } from '../performanceTest';

// Configuration des tests
const TEST_CONFIG = {
  iterations: 5, // Nombre d'itérations pour chaque test
  testDelay: 1000, // Délai entre les tests (ms)
  endpoints: [
    '/api/cols/featured',
    '/api/cols/all',
    '/api/routes/featured',
    '/api/weather/current'
  ],
  components3D: ['ColVisualization3D'],
  qualityLevels: ['ultraLow', 'low', 'medium', 'high', 'ultra']
};

// Résultats des tests
let testResults = {
  apiPerformance: {},
  renderPerformance: {},
  memoryUsage: {},
  timestamp: new Date().toISOString()
};

/**
 * Exécute une série de tests de performance API
 * @returns {Promise<Object>} Résultats des tests
 */
export async function runApiPerformanceTests() {
  console.log('🔍 Exécution des tests de performance API...');
  
  const results = {};
  
  // Tester chaque endpoint
  for (const endpoint of TEST_CONFIG.endpoints) {
    results[endpoint] = {
      networkOnly: [],
      cacheFirst: [],
      staleWhileRevalidate: []
    };
    
    // Test avec stratégie network-only (ligne de base)
    console.log(`⏱️ Test ${endpoint} avec stratégie network-only...`);
    for (let i = 0; i < TEST_CONFIG.iterations; i++) {
      const start = performance.now();
      await performanceTest.measureApiPerformance(endpoint, { strategy: 'network-only' });
      const elapsed = performance.now() - start;
      results[endpoint].networkOnly.push(elapsed);
      await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.testDelay));
    }
    
    // Test avec stratégie cache-first
    console.log(`⏱️ Test ${endpoint} avec stratégie cache-first...`);
    for (let i = 0; i < TEST_CONFIG.iterations; i++) {
      const start = performance.now();
      await performanceTest.measureApiPerformance(endpoint, { strategy: 'cache-first' });
      const elapsed = performance.now() - start;
      results[endpoint].cacheFirst.push(elapsed);
      await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.testDelay));
    }
    
    // Test avec stratégie stale-while-revalidate
    console.log(`⏱️ Test ${endpoint} avec stratégie stale-while-revalidate...`);
    for (let i = 0; i < TEST_CONFIG.iterations; i++) {
      const start = performance.now();
      await performanceTest.measureApiPerformance(endpoint, { strategy: 'stale-while-revalidate' });
      const elapsed = performance.now() - start;
      results[endpoint].staleWhileRevalidate.push(elapsed);
      await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.testDelay));
    }
    
    // Calcul des moyennes et améliorations
    const avgNetworkOnly = results[endpoint].networkOnly.reduce((a, b) => a + b, 0) / TEST_CONFIG.iterations;
    const avgCacheFirst = results[endpoint].cacheFirst.reduce((a, b) => a + b, 0) / TEST_CONFIG.iterations;
    const avgStaleWhileRevalidate = results[endpoint].staleWhileRevalidate.reduce((a, b) => a + b, 0) / TEST_CONFIG.iterations;
    
    results[endpoint].averages = {
      networkOnly: avgNetworkOnly,
      cacheFirst: avgCacheFirst,
      staleWhileRevalidate: avgStaleWhileRevalidate
    };
    
    results[endpoint].improvements = {
      cacheFirst: ((avgNetworkOnly - avgCacheFirst) / avgNetworkOnly) * 100,
      staleWhileRevalidate: ((avgNetworkOnly - avgStaleWhileRevalidate) / avgNetworkOnly) * 100
    };
  }
  
  testResults.apiPerformance = results;
  console.log('✅ Tests de performance API terminés');
  
  return results;
}

/**
 * Exécute des tests de performance de rendu 3D
 * @returns {Promise<Object>} Résultats des tests
 */
export async function run3DRenderTests() {
  console.log('🔍 Exécution des tests de performance de rendu 3D...');
  
  const results = {};
  
  // Détecter si nous sommes sur la bonne page
  if (!document.querySelector('.visualization-3d-container')) {
    console.warn('⚠️ Ces tests doivent être exécutés sur une page avec visualisation 3D');
    return { error: 'Aucune visualisation 3D trouvée sur cette page' };
  }
  
  // Tester chaque niveau de qualité
  for (const qualityLevel of TEST_CONFIG.qualityLevels) {
    results[qualityLevel] = {
      fps: [],
      loadTime: [],
      memoryUsage: []
    };
    
    console.log(`⏱️ Test du niveau de qualité ${qualityLevel}...`);
    
    // Définir le niveau de qualité
    if (window.progressive3DLoader) {
      await window.progressive3DLoader.setQualityLevel(qualityLevel);
    }
    
    // Mesurer le temps de chargement
    const loadStart = performance.now();
    await performanceTest.measure3DPerformance();
    const loadTime = performance.now() - loadStart;
    results[qualityLevel].loadTime.push(loadTime);
    
    // Mesurer le FPS pendant 5 secondes
    const fpsResults = await measureFPS(5000);
    results[qualityLevel].fps = fpsResults;
    
    // Mesurer l'utilisation mémoire
    if (performance.memory) {
      results[qualityLevel].memoryUsage.push(performance.memory.usedJSHeapSize / (1024 * 1024));
    }
    
    // Pause entre les tests
    await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.testDelay * 2));
  }
  
  testResults.renderPerformance = results;
  console.log('✅ Tests de performance de rendu 3D terminés');
  
  return results;
}

/**
 * Mesure le FPS pendant une durée spécifiée
 * @param {number} duration - Durée en ms
 * @returns {Promise<Array>} Tableau des mesures de FPS
 */
async function measureFPS(duration) {
  return new Promise(resolve => {
    const fpsResults = [];
    let frames = 0;
    let lastTime = performance.now();
    
    const measureFrame = () => {
      const now = performance.now();
      frames++;
      
      if (now - lastTime >= 1000) {
        const fps = Math.round(frames * 1000 / (now - lastTime));
        fpsResults.push(fps);
        frames = 0;
        lastTime = now;
      }
      
      if (performance.now() - lastTime < duration) {
        requestAnimationFrame(measureFrame);
      } else {
        resolve(fpsResults);
      }
    };
    
    requestAnimationFrame(measureFrame);
  });
}

/**
 * Génère un rapport des tests de performance
 * @returns {Object} Rapport de performance
 */
export function generatePerformanceReport() {
  console.log('📊 Génération du rapport de performance...');
  
  const report = {
    summary: {
      apiPerformance: {},
      renderPerformance: {},
      timestamp: testResults.timestamp
    },
    details: testResults
  };
  
  // Résumer les performances API
  if (testResults.apiPerformance) {
    for (const [endpoint, data] of Object.entries(testResults.apiPerformance)) {
      if (data.improvements) {
        report.summary.apiPerformance[endpoint] = {
          cacheImprovement: data.improvements.cacheFirst.toFixed(2) + '%',
          staleImprovement: data.improvements.staleWhileRevalidate.toFixed(2) + '%'
        };
      }
    }
  }
  
  // Résumer les performances de rendu
  if (testResults.renderPerformance) {
    for (const [level, data] of Object.entries(testResults.renderPerformance)) {
      if (data.fps && data.fps.length > 0) {
        const avgFPS = data.fps.reduce((a, b) => a + b, 0) / data.fps.length;
        report.summary.renderPerformance[level] = {
          avgFPS: avgFPS.toFixed(1),
          loadTime: data.loadTime[0].toFixed(0) + 'ms'
        };
        
        if (data.memoryUsage && data.memoryUsage.length > 0) {
          report.summary.renderPerformance[level].memoryUsage = 
            data.memoryUsage[0].toFixed(1) + 'MB';
        }
      }
    }
  }
  
  console.log('✅ Rapport de performance généré');
  console.table(report.summary.apiPerformance);
  console.table(report.summary.renderPerformance);
  
  return report;
}

/**
 * Exporte les résultats des tests au format JSON
 */
export function exportTestResults() {
  const jsonStr = JSON.stringify(testResults, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `performance-test-results-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  console.log('💾 Résultats des tests exportés');
}

/**
 * Exécute tous les tests de performance
 */
export async function runAllPerformanceTests() {
  console.log('🚀 Démarrage de la suite de tests de performance...');
  
  await runApiPerformanceTests();
  await run3DRenderTests();
  
  const report = generatePerformanceReport();
  
  console.log('🏁 Suite de tests terminée');
  
  return report;
}

// Assign object to a variable before exporting as module default
const performanceTestRunner = {
  runApiPerformanceTests,
  run3DRenderTests,
  generatePerformanceReport,
  exportTestResults,
  runAllPerformanceTests
};

export default performanceTestRunner;
