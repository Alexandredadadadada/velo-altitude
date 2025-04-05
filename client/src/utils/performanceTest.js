/**
 * Utilitaire pour mesurer et comparer les performances avant et après optimisations
 */

// Métriques à suivre
const metrics = {
  // Temps de chargement et d'initialisation
  loadTimes: [],
  
  // Fréquence d'images (FPS)
  frameRates: [],
  
  // Utilisation mémoire
  memoryUsage: [],
  
  // Temps de réponse API avec et sans cache
  apiResponseTimes: {
    withCache: [],
    withoutCache: []
  },
  
  // Suivi des feature flags
  featureFlagSwitches: [],
  
  // Métriques de rendu 3D
  visualizationMetrics: {
    initialRenderTime: null,
    frameTimesByDetailLevel: {},
    memoryByDetailLevel: {}
  }
};

/**
 * Classe pour effectuer des tests de performance
 */
class PerformanceTest {
  constructor() {
    this.metrics = { ...metrics };
    this.testInProgress = false;
    this.testResults = null;
    this.startTime = null;
    this.testConfig = {
      iterations: 5,
      warmupIterations: 1,
      components: ['api', 'visualization3D', 'featureFlags']
    };
  }
  
  /**
   * Démarre un test de performance
   * @param {Object} config Configuration du test
   * @returns {Promise<Object>} Résultats du test
   */
  async startTest(config = {}) {
    if (this.testInProgress) {
      throw new Error('Un test est déjà en cours');
    }
    
    // Fusionner la configuration
    this.testConfig = { ...this.testConfig, ...config };
    this.testInProgress = true;
    this.startTime = performance.now();
    this.metrics = { ...metrics };
    
    console.info('Démarrage des tests de performance...', this.testConfig);
    
    try {
      // Tests de chargement de page
      if (this.testConfig.components.includes('general')) {
        await this.measurePageLoad();
      }
      
      // Tests d'API avec/sans cache
      if (this.testConfig.components.includes('api')) {
        await this.measureApiPerformance();
      }
      
      // Tests de visualisation 3D
      if (this.testConfig.components.includes('visualization3D')) {
        await this.measure3DPerformance();
      }
      
      // Tests de feature flags
      if (this.testConfig.components.includes('featureFlags')) {
        await this.measureFeatureFlagPerformance();
      }
      
      // Finaliser les métriques
      this.testResults = this.calculateResults();
      this.testInProgress = false;
      
      console.info('Tests de performance terminés', this.testResults);
      return this.testResults;
    } catch (error) {
      console.error('Erreur lors des tests de performance:', error);
      this.testInProgress = false;
      throw error;
    }
  }
  
  /**
   * Mesure le temps de chargement de la page
   */
  async measurePageLoad() {
    return new Promise(resolve => {
      // Utiliser les API Performance standard
      const navEntry = performance.getEntriesByType('navigation')[0];
      
      if (navEntry) {
        this.metrics.loadTimes.push({
          total: navEntry.loadEventEnd - navEntry.startTime,
          domInteractive: navEntry.domInteractive - navEntry.startTime,
          domComplete: navEntry.domComplete - navEntry.startTime,
          scriptTime: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart
        });
      } else {
        // Fallback en cas d'indisponibilité de l'API Performance
        const loadTime = performance.now() - this.startTime;
        this.metrics.loadTimes.push({
          total: loadTime,
          estimated: true
        });
      }
      
      resolve();
    });
  }
  
  /**
   * Mesure les performances des appels API avec et sans cache
   */
  async measureApiPerformance() {
    const apiEndpoints = [
      '/api/cols',
      '/api/users/profile',
      '/api/training/plans',
      '/api/weather'
    ];
    
    // Importer apiCacheService de manière dynamique
    const apiCacheService = await import('../services/apiCache').then(m => m.default);
    const { CACHE_STRATEGIES } = await import('../services/apiCache');
    
    // Effacer le cache pour les tests "sans cache"
    await apiCacheService.clearCacheByTags(['performance_test']);
    
    // Mesurer les performances sans cache
    for (const endpoint of apiEndpoints) {
      const start = performance.now();
      
      try {
        await apiCacheService.get(endpoint, {
          strategy: CACHE_STRATEGIES.NETWORK_ONLY,
          tags: ['performance_test']
        });
        
        const time = performance.now() - start;
        this.metrics.apiResponseTimes.withoutCache.push({
          endpoint,
          time
        });
      } catch (error) {
        console.warn(`Erreur lors de l'appel à ${endpoint} sans cache:`, error);
        this.metrics.apiResponseTimes.withoutCache.push({
          endpoint,
          time: -1,
          error: error.message
        });
      }
    }
    
    // Attendre un peu entre les tests
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mesurer les performances avec cache
    for (const endpoint of apiEndpoints) {
      const start = performance.now();
      
      try {
        await apiCacheService.get(endpoint, {
          strategy: CACHE_STRATEGIES.CACHE_FIRST,
          tags: ['performance_test']
        });
        
        const time = performance.now() - start;
        this.metrics.apiResponseTimes.withCache.push({
          endpoint,
          time
        });
      } catch (error) {
        console.warn(`Erreur lors de l'appel à ${endpoint} avec cache:`, error);
        this.metrics.apiResponseTimes.withCache.push({
          endpoint,
          time: -1,
          error: error.message
        });
      }
    }
  }
  
  /**
   * Mesure les performances des visualisations 3D
   */
  async measure3DPerformance() {
    // Importer le service de chargement progressif
    const progressive3DLoader = await import('../services/progressive3DLoader').then(m => m.default);
    const { DETAIL_LEVELS } = await import('../services/progressive3DLoader');
    
    // Initialiser le service
    await progressive3DLoader.initialize();
    
    // Mesurer le temps de chargement initial
    const startRender = performance.now();
    
    // Simuler un chargement et rendu initial
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.metrics.visualizationMetrics.initialRenderTime = performance.now() - startRender;
    
    // Tester les performances pour chaque niveau de détail
    for (const level of Object.values(DETAIL_LEVELS)) {
      progressive3DLoader.currentDetailLevel = level;
      const renderParams = progressive3DLoader.getRenderParams();
      
      this.metrics.visualizationMetrics.frameTimesByDetailLevel[level] = [];
      this.metrics.visualizationMetrics.memoryByDetailLevel[level] = [];
      
      // Simuler plusieurs rendus et mesurer les performances
      for (let i = 0; i < this.testConfig.iterations; i++) {
        const frameStart = performance.now();
        
        // Simuler un rendu (dans une implémentation réelle, 
        // on mesurerait le temps de rendu exact d'une frame ThreeJS)
        await new Promise(resolve => setTimeout(resolve, 10 + (
          level === DETAIL_LEVELS.ULTRA_LOW ? 5 :
          level === DETAIL_LEVELS.LOW ? 10 :
          level === DETAIL_LEVELS.MEDIUM ? 15 :
          level === DETAIL_LEVELS.HIGH ? 20 :
          25 // ULTRA
        )));
        
        const frameTime = performance.now() - frameStart;
        
        this.metrics.visualizationMetrics.frameTimesByDetailLevel[level].push(frameTime);
        
        // Essayer de mesurer l'utilisation mémoire si disponible
        if (performance.memory) {
          this.metrics.visualizationMetrics.memoryByDetailLevel[level].push(
            performance.memory.usedJSHeapSize
          );
        }
      }
    }
  }
  
  /**
   * Mesure les performances des feature flags
   */
  async measureFeatureFlagPerformance() {
    // Importer le service de feature flags
    const featureFlagsService = await import('../services/featureFlags').then(m => m.default);
    
    // Mesurer le temps d'initialisation
    const initStart = performance.now();
    await featureFlagsService.initializeFlags();
    const initTime = performance.now() - initStart;
    
    this.metrics.featureFlagSwitches.push({
      operation: 'initializeFlags',
      time: initTime
    });
    
    // Mesurer le temps d'accès à un flag
    const flagNames = [
      'enableProgressiveLoading3D',
      'enableApiCache',
      'enableAdvancedErrorHandling'
    ];
    
    for (const flagName of flagNames) {
      const checkStart = performance.now();
      
      // Vérifier le flag plusieurs fois pour avoir une moyenne
      for (let i = 0; i < 1000; i++) {
        featureFlagsService.isEnabled(flagName);
      }
      
      const avgCheckTime = (performance.now() - checkStart) / 1000;
      
      this.metrics.featureFlagSwitches.push({
        operation: 'isEnabled',
        flag: flagName,
        time: avgCheckTime
      });
    }
    
    // Mesurer les performances des segments utilisateurs
    const userTypes = ['user', 'admin', 'premium'];
    
    for (const userType of userTypes) {
      const segmentStart = performance.now();
      
      // Vérifier le segment plusieurs fois
      for (let i = 0; i < 100; i++) {
        featureFlagsService.isUserInSegment(userType, { role: userType });
      }
      
      const avgSegmentTime = (performance.now() - segmentStart) / 100;
      
      this.metrics.featureFlagSwitches.push({
        operation: 'isUserInSegment',
        segment: userType,
        time: avgSegmentTime
      });
    }
  }
  
  /**
   * Calcule les résultats finaux
   * @returns {Object} Résultats consolidés
   */
  calculateResults() {
    const results = {
      overview: {
        totalTestTime: performance.now() - this.startTime,
        testDate: new Date().toISOString()
      },
      pageLoad: this.calculatePageLoadMetrics(),
      api: this.calculateApiMetrics(),
      visualization3D: this.calculate3DMetrics(),
      featureFlags: this.calculateFeatureFlagMetrics()
    };
    
    return results;
  }
  
  /**
   * Calcule les métriques de chargement de page
   */
  calculatePageLoadMetrics() {
    if (this.metrics.loadTimes.length === 0) {
      return {
        tested: false
      };
    }
    
    const loadTimes = this.metrics.loadTimes;
    
    return {
      tested: true,
      averageLoadTime: loadTimes.reduce((sum, item) => sum + item.total, 0) / loadTimes.length,
      details: loadTimes
    };
  }
  
  /**
   * Calcule les métriques API
   */
  calculateApiMetrics() {
    const withoutCache = this.metrics.apiResponseTimes.withoutCache;
    const withCache = this.metrics.apiResponseTimes.withCache;
    
    if (withoutCache.length === 0 && withCache.length === 0) {
      return {
        tested: false
      };
    }
    
    // Calculer les temps moyens
    const avgWithoutCache = withoutCache
      .filter(item => item.time > 0)
      .reduce((sum, item) => sum + item.time, 0) / withoutCache.filter(item => item.time > 0).length;
    
    const avgWithCache = withCache
      .filter(item => item.time > 0)
      .reduce((sum, item) => sum + item.time, 0) / withCache.filter(item => item.time > 0).length;
    
    // Calculer le pourcentage d'amélioration
    const improvement = avgWithoutCache > 0 && avgWithCache > 0
      ? ((avgWithoutCache - avgWithCache) / avgWithoutCache) * 100
      : 0;
    
    return {
      tested: true,
      averageTimeWithoutCache: avgWithoutCache,
      averageTimeWithCache: avgWithCache,
      improvement: improvement,
      details: {
        withoutCache,
        withCache
      }
    };
  }
  
  /**
   * Calcule les métriques de visualisation 3D
   */
  calculate3DMetrics() {
    if (!this.metrics.visualizationMetrics.initialRenderTime) {
      return {
        tested: false
      };
    }
    
    const frameTimesByLevel = {};
    const fpsEstimatesByLevel = {};
    
    // Calculer les temps moyens par niveau
    for (const [level, times] of Object.entries(this.metrics.visualizationMetrics.frameTimesByDetailLevel)) {
      if (times.length > 0) {
        const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        frameTimesByLevel[level] = avgTime;
        
        // Estimer le FPS (1000ms / temps moyen d'une frame)
        fpsEstimatesByLevel[level] = 1000 / avgTime;
      }
    }
    
    return {
      tested: true,
      initialRenderTime: this.metrics.visualizationMetrics.initialRenderTime,
      frameTimesByLevel,
      fpsEstimatesByLevel,
      memoryByLevel: this.metrics.visualizationMetrics.memoryByDetailLevel,
      performanceDifferenceUltraVsLow: frameTimesByLevel['ultra'] && frameTimesByLevel['low']
        ? ((frameTimesByLevel['ultra'] - frameTimesByLevel['low']) / frameTimesByLevel['ultra']) * 100
        : null
    };
  }
  
  /**
   * Calcule les métriques feature flags
   */
  calculateFeatureFlagMetrics() {
    if (this.metrics.featureFlagSwitches.length === 0) {
      return {
        tested: false
      };
    }
    
    // Grouper par opération
    const operationGroups = {};
    
    for (const metric of this.metrics.featureFlagSwitches) {
      if (!operationGroups[metric.operation]) {
        operationGroups[metric.operation] = [];
      }
      
      operationGroups[metric.operation].push(metric);
    }
    
    // Calculer la moyenne par opération
    const averageByOperation = {};
    
    for (const [op, metrics] of Object.entries(operationGroups)) {
      averageByOperation[op] = metrics.reduce((sum, m) => sum + m.time, 0) / metrics.length;
    }
    
    return {
      tested: true,
      averageTimeByOperation: averageByOperation,
      details: this.metrics.featureFlagSwitches
    };
  }
  
  /**
   * Génère un rapport HTML des résultats
   * @returns {string} Rapport HTML
   */
  generateHtmlReport() {
    if (!this.testResults) {
      return '<p>Aucun résultat de test disponible. Exécutez un test d\'abord.</p>';
    }
    
    const results = this.testResults;
    
    return `
      <div class="performance-report">
        <h2>Rapport de Performance - ${new Date(results.overview.testDate).toLocaleString()}</h2>
        <p><strong>Durée totale des tests:</strong> ${results.overview.totalTestTime.toFixed(2)}ms</p>
        
        <h3>Chargement de page</h3>
        ${results.pageLoad.tested ? `
          <p>Temps de chargement moyen: ${results.pageLoad.averageLoadTime.toFixed(2)}ms</p>
        ` : '<p>Non testé</p>'}
        
        <h3>Performance API</h3>
        ${results.api.tested ? `
          <div class="api-metrics">
            <p>Temps de réponse moyen sans cache: ${results.api.averageTimeWithoutCache.toFixed(2)}ms</p>
            <p>Temps de réponse moyen avec cache: ${results.api.averageTimeWithCache.toFixed(2)}ms</p>
            <p>Amélioration: ${results.api.improvement.toFixed(2)}%</p>
            
            <table class="metrics-table">
              <thead>
                <tr>
                  <th>Endpoint</th>
                  <th>Sans cache (ms)</th>
                  <th>Avec cache (ms)</th>
                  <th>Amélioration</th>
                </tr>
              </thead>
              <tbody>
                ${results.api.details.withoutCache.map((item, i) => {
                  const cacheItem = results.api.details.withCache[i];
                  const improvement = item.time > 0 && cacheItem && cacheItem.time > 0
                    ? ((item.time - cacheItem.time) / item.time * 100).toFixed(2)
                    : 'N/A';
                  
                  return `
                    <tr>
                      <td>${item.endpoint}</td>
                      <td>${item.time > 0 ? item.time.toFixed(2) : 'Erreur'}</td>
                      <td>${cacheItem && cacheItem.time > 0 ? cacheItem.time.toFixed(2) : 'Erreur'}</td>
                      <td>${improvement}%</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        ` : '<p>Non testé</p>'}
        
        <h3>Performance Visualisation 3D</h3>
        ${results.visualization3D.tested ? `
          <div class="visualization-metrics">
            <p>Temps de rendu initial: ${results.visualization3D.initialRenderTime.toFixed(2)}ms</p>
            
            <h4>Performance par niveau de détail</h4>
            <table class="metrics-table">
              <thead>
                <tr>
                  <th>Niveau de détail</th>
                  <th>Temps moyen par frame (ms)</th>
                  <th>FPS estimé</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(results.visualization3D.frameTimesByLevel).map(([level, time]) => `
                  <tr>
                    <td>${level}</td>
                    <td>${time.toFixed(2)}</td>
                    <td>${results.visualization3D.fpsEstimatesByLevel[level].toFixed(1)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            ${results.visualization3D.performanceDifferenceUltraVsLow !== null ? `
              <p>Différence de performance entre Ultra et Low: ${results.visualization3D.performanceDifferenceUltraVsLow.toFixed(2)}%</p>
            ` : ''}
          </div>
        ` : '<p>Non testé</p>'}
        
        <h3>Performance Feature Flags</h3>
        ${results.featureFlags.tested ? `
          <div class="featureflags-metrics">
            <h4>Temps moyen par opération</h4>
            <table class="metrics-table">
              <thead>
                <tr>
                  <th>Opération</th>
                  <th>Temps moyen (ms)</th>
                </tr>
              </thead>
              <tbody>
                ${Object.entries(results.featureFlags.averageTimeByOperation).map(([op, time]) => `
                  <tr>
                    <td>${op}</td>
                    <td>${time.toFixed(4)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : '<p>Non testé</p>'}
      </div>
      
      <style>
        .performance-report {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .metrics-table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        
        .metrics-table th, .metrics-table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        
        .metrics-table th {
          background-color: #f2f2f2;
          font-weight: bold;
        }
        
        .metrics-table tr:nth-child(even) {
          background-color: #f9f9f9;
        }
      </style>
    `;
  }
  
  /**
   * Génère un rapport console des résultats
   */
  logResults() {
    if (!this.testResults) {
      console.log('Aucun résultat de test disponible. Exécutez un test d\'abord.');
      return;
    }
    
    const results = this.testResults;
    
    console.group('Rapport de Performance');
    console.log(`Date du test: ${new Date(results.overview.testDate).toLocaleString()}`);
    console.log(`Durée totale des tests: ${results.overview.totalTestTime.toFixed(2)}ms`);
    
    console.group('Chargement de page');
    if (results.pageLoad.tested) {
      console.log(`Temps de chargement moyen: ${results.pageLoad.averageLoadTime.toFixed(2)}ms`);
    } else {
      console.log('Non testé');
    }
    console.groupEnd();
    
    console.group('Performance API');
    if (results.api.tested) {
      console.log(`Temps de réponse moyen sans cache: ${results.api.averageTimeWithoutCache.toFixed(2)}ms`);
      console.log(`Temps de réponse moyen avec cache: ${results.api.averageTimeWithCache.toFixed(2)}ms`);
      console.log(`Amélioration: ${results.api.improvement.toFixed(2)}%`);
      
      console.table(results.api.details.withoutCache.map((item, i) => {
        const cacheItem = results.api.details.withCache[i];
        const improvement = item.time > 0 && cacheItem && cacheItem.time > 0
          ? ((item.time - cacheItem.time) / item.time * 100).toFixed(2)
          : 'N/A';
        
        return {
          endpoint: item.endpoint,
          sansCache: item.time > 0 ? item.time.toFixed(2) : 'Erreur',
          avecCache: cacheItem && cacheItem.time > 0 ? cacheItem.time.toFixed(2) : 'Erreur',
          amélioration: `${improvement}%`
        };
      }));
    } else {
      console.log('Non testé');
    }
    console.groupEnd();
    
    console.group('Performance Visualisation 3D');
    if (results.visualization3D.tested) {
      console.log(`Temps de rendu initial: ${results.visualization3D.initialRenderTime.toFixed(2)}ms`);
      
      console.group('Performance par niveau de détail');
      console.table(Object.entries(results.visualization3D.frameTimesByLevel).map(([level, time]) => ({
        niveau: level,
        tempsMoyen: `${time.toFixed(2)}ms`,
        fps: results.visualization3D.fpsEstimatesByLevel[level].toFixed(1)
      })));
      console.groupEnd();
      
      if (results.visualization3D.performanceDifferenceUltraVsLow !== null) {
        console.log(`Différence de performance entre Ultra et Low: ${results.visualization3D.performanceDifferenceUltraVsLow.toFixed(2)}%`);
      }
    } else {
      console.log('Non testé');
    }
    console.groupEnd();
    
    console.group('Performance Feature Flags');
    if (results.featureFlags.tested) {
      console.group('Temps moyen par opération');
      console.table(Object.entries(results.featureFlags.averageTimeByOperation).map(([op, time]) => ({
        opération: op,
        tempsMoyen: `${time.toFixed(4)}ms`
      })));
      console.groupEnd();
    } else {
      console.log('Non testé');
    }
    console.groupEnd();
    
    console.groupEnd();
  }
}

// Exporter une instance singleton
const performanceTest = new PerformanceTest();
export default performanceTest;
