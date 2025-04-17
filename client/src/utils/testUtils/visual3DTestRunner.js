/**
 * Utilitaire pour tester les optimisations de visualisation 3D
 * Permet de vérifier les performances et la qualité des visualisations 3D, notamment pour ColVisualization3D
 */

// Configuration des tests
const TEST_CONFIG = {
  qualityLevels: ['ultraLow', 'low', 'medium', 'high', 'ultra'],
  deviceProfiles: [
    { name: 'mobile-low', memory: 512, cores: 2, gpu: 'basic' },
    { name: 'mobile-mid', memory: 1024, cores: 4, gpu: 'medium' },
    { name: 'mobile-high', memory: 2048, cores: 6, gpu: 'high' },
    { name: 'desktop-low', memory: 2048, cores: 4, gpu: 'medium' },
    { name: 'desktop-high', memory: 4096, cores: 8, gpu: 'high' }
  ],
  testDuration: 5000, // ms
  fpsThresholds: {
    acceptable: 30,
    good: 45,
    excellent: 60
  },
  loadTimeThresholds: {
    acceptable: 2000, // ms
    good: 1000,
    excellent: 500
  },
  componentsToTest: ['ColVisualization3D']
};

// Résultats des tests
let testResults = {
  qualityAdaptation: {},
  performanceByQuality: {},
  adaptiveLoading: {},
  frustumCulling: {},
  memoryUsage: {},
  deviceDetection: {},
  sevenMajorsChallenge: {}, // Tests spécifiques pour le composant SevenMajorsChallenge
  timestamp: new Date().toISOString()
};

/**
 * Exécute les tests d'adaptation de qualité
 * @returns {Promise<Object>} Résultats des tests
 */
export async function runQualityAdaptationTests() {
  console.log('🔍 Exécution des tests d\'adaptation de qualité...');
  
  const results = {
    qualityLevels: {},
    deviceProfiles: {}
  };
  
  // Vérifier l'accès au service
  if (!window.progressive3DLoader) {
    console.error('❌ Service Progressive3DLoader non disponible');
    return { error: 'Service non disponible' };
  }
  
  // Tester chaque niveau de qualité
  for (const quality of TEST_CONFIG.qualityLevels) {
    results.qualityLevels[quality] = {};
    
    try {
      console.log(`🔄 Test du niveau de qualité ${quality}...`);
      
      // Définir le niveau de qualité
      await window.progressive3DLoader.setQualityLevel(quality);
      
      // Récupérer la configuration appliquée
      const config = await window.progressive3DLoader.getCurrentConfig();
      results.qualityLevels[quality].config = config;
      
      // Vérifier que le niveau est correctement appliqué
      const actualQuality = await window.progressive3DLoader.getQualityLevel();
      const qualityMatches = actualQuality === quality;
      
      results.qualityLevels[quality].applied = qualityMatches;
      results.qualityLevels[quality].actualQuality = actualQuality;
      
      console.log(`🔄 Niveau ${quality}: ${qualityMatches ? '✅ Correctement appliqué' : '❌ Non appliqué correctement'}`);
      
      if (config) {
        // Vérifier des paramètres clés pour différents niveaux
        // Les valeurs attendues dépendent du niveau de qualité
        const expectedValues = getExpectedValuesForQuality(quality);
        const checks = {};
        
        for (const [param, expected] of Object.entries(expectedValues)) {
          if (param in config) {
            const matches = compareValues(config[param], expected);
            checks[param] = {
              expected,
              actual: config[param],
              matches
            };
          }
        }
        
        results.qualityLevels[quality].parameterChecks = checks;
        
        // Calculer le taux de correspondance
        const totalChecks = Object.keys(checks).length;
        const matchingChecks = Object.values(checks).filter(c => c.matches).length;
        const matchRate = totalChecks > 0 ? matchingChecks / totalChecks : 0;
        
        results.qualityLevels[quality].matchRate = matchRate;
        console.log(`📊 Taux de correspondance des paramètres: ${(matchRate * 100).toFixed(1)}%`);
      }
      
    } catch (error) {
      console.error(`❌ Erreur lors du test du niveau de qualité ${quality}:`, error);
      results.qualityLevels[quality].error = error.message;
    }
  }
  
  // Tester l'adaptation aux différents profils d'appareils
  for (const profile of TEST_CONFIG.deviceProfiles) {
    results.deviceProfiles[profile.name] = {};
    
    try {
      console.log(`📱 Test du profil d'appareil ${profile.name}...`);
      
      // Simuler ce profil d'appareil
      await window.progressive3DLoader.simulateDevice(profile);
      
      // Laisser le système déterminer le niveau de qualité approprié
      await window.progressive3DLoader.autoDetectQuality();
      
      // Récupérer le niveau de qualité détecté
      const detectedQuality = await window.progressive3DLoader.getQualityLevel();
      results.deviceProfiles[profile.name].detectedQuality = detectedQuality;
      
      // Vérifier si le niveau détecté est approprié pour ce profil
      const isAppropriate = isQualityAppropriateForProfile(detectedQuality, profile);
      results.deviceProfiles[profile.name].appropriateQuality = isAppropriate;
      
      console.log(`📱 Profil ${profile.name} → Qualité ${detectedQuality}: ${isAppropriate ? '✅ Approprié' : '⚠️ Potentiellement inapproprié'}`);
      
    } catch (error) {
      console.error(`❌ Erreur lors du test du profil ${profile.name}:`, error);
      results.deviceProfiles[profile.name].error = error.message;
    }
  }
  
  // Restaurer les paramètres par défaut
  try {
    await window.progressive3DLoader.autoDetectQuality();
  } catch (error) {
    console.warn('⚠️ Impossible de restaurer les paramètres par défaut:', error);
  }
  
  testResults.qualityAdaptation = results;
  console.log('✅ Tests d\'adaptation de qualité terminés');
  
  return results;
}

/**
 * Obtient les valeurs attendues pour un niveau de qualité donné
 * @param {string} quality - Niveau de qualité
 * @returns {Object} Valeurs attendues pour différents paramètres
 */
function getExpectedValuesForQuality(quality) {
  const values = {
    ultraLow: {
      textureQuality: 'low',
      shadowsEnabled: false,
      antialiasing: false,
      drawDistance: { min: 10, max: 100 },
      geometryDetail: 'low',
      maxObjectsRendered: { min: 10, max: 50 }
    },
    low: {
      textureQuality: 'low',
      shadowsEnabled: false,
      antialiasing: false,
      drawDistance: { min: 100, max: 500 },
      geometryDetail: 'low',
      maxObjectsRendered: { min: 50, max: 100 }
    },
    medium: {
      textureQuality: 'medium',
      shadowsEnabled: true,
      antialiasing: false,
      drawDistance: { min: 500, max: 1000 },
      geometryDetail: 'medium',
      maxObjectsRendered: { min: 100, max: 200 }
    },
    high: {
      textureQuality: 'high',
      shadowsEnabled: true,
      antialiasing: true,
      drawDistance: { min: 1000, max: 2000 },
      geometryDetail: 'high',
      maxObjectsRendered: { min: 200, max: 500 }
    },
    ultra: {
      textureQuality: 'ultra',
      shadowsEnabled: true,
      antialiasing: true,
      drawDistance: { min: 2000, max: 5000 },
      geometryDetail: 'ultra',
      maxObjectsRendered: { min: 500, max: 1000 }
    }
  };
  
  return values[quality] || {};
}

/**
 * Compare les valeurs réelles avec les valeurs attendues
 * @param {any} actual - Valeur réelle
 * @param {any} expected - Valeur attendue
 * @returns {boolean} True si les valeurs correspondent
 */
function compareValues(actual, expected) {
  // Si expected est un objet avec min/max, vérifier que actual est dans cet intervalle
  if (expected && typeof expected === 'object' && 'min' in expected && 'max' in expected) {
    return actual >= expected.min && actual <= expected.max;
  }
  
  // Autrement, comparaison directe
  return actual === expected;
}

/**
 * Vérifie si un niveau de qualité est approprié pour un profil d'appareil
 * @param {string} quality - Niveau de qualité
 * @param {Object} profile - Profil d'appareil
 * @returns {boolean} True si le niveau est approprié
 */
function isQualityAppropriateForProfile(quality, profile) {
  // Règles de correspondance entre profils et niveaux de qualité appropriés
  const appropriateQuality = {
    'mobile-low': ['ultraLow', 'low'],
    'mobile-mid': ['low', 'medium'],
    'mobile-high': ['medium', 'high'],
    'desktop-low': ['medium', 'high'],
    'desktop-high': ['high', 'ultra']
  };
  
  return appropriateQuality[profile.name]?.includes(quality) || false;
}

/**
 * Exécute des tests de performance par niveau de qualité
 * @returns {Promise<Object>} Résultats des tests
 */
export async function runPerformanceByQualityTests() {
  console.log('🔍 Exécution des tests de performance par niveau de qualité...');
  
  const results = {};
  
  // Vérifier que nous sommes sur une page avec visualisation 3D
  const hasVisualization = document.querySelector('.visualization-3d-container') || 
                         document.querySelector('.col-visualization-3d');
  
  if (!hasVisualization) {
    console.warn('⚠️ Ces tests doivent être exécutés sur une page avec visualisation 3D');
    return { error: 'Aucune visualisation 3D trouvée sur cette page' };
  }
  
  // Tester chaque niveau de qualité
  for (const quality of TEST_CONFIG.qualityLevels) {
    results[quality] = {
      fps: [],
      loadTime: null,
      memoryUsage: null
    };
    
    try {
      console.log(`⏱️ Test de performance pour le niveau ${quality}...`);
      
      // Définir le niveau de qualité
      if (window.progressive3DLoader) {
        await window.progressive3DLoader.setQualityLevel(quality);
        // Attendre un peu pour s'assurer que les changements sont appliqués
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.warn('⚠️ Impossible de définir le niveau de qualité, utilisation des paramètres actuels');
      }
      
      // Mesurer le temps de chargement en rechargeant la scène
      const loadStart = performance.now();
      try {
        if (window.colVisualization && typeof window.colVisualization.reload === 'function') {
          await window.colVisualization.reload();
        } else if (document.querySelector('.col-visualization-3d')) {
          // Simuler un rechargement via un changement de propriété React si possible
          const visualizationElement = document.querySelector('.col-visualization-3d');
          visualizationElement.dispatchEvent(new Event('reload'));
        }
      } catch (reloadError) {
        console.warn('⚠️ Impossible de recharger la visualisation:', reloadError);
      }
      const loadTime = performance.now() - loadStart;
      results[quality].loadTime = loadTime;
      
      // Mesurer le FPS pendant la durée de test
      results[quality].fps = await measureFPS(TEST_CONFIG.testDuration);
      
      // Calculer des statistiques sur le FPS
      if (results[quality].fps.length > 0) {
        const fpsValues = results[quality].fps;
        const avgFPS = fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length;
        const minFPS = Math.min(...fpsValues);
        const maxFPS = Math.max(...fpsValues);
        
        results[quality].fpsStats = {
          avg: avgFPS,
          min: minFPS,
          max: maxFPS,
          stable: maxFPS - minFPS < 15, // Considéré stable si la variation est < 15 FPS
          acceptableFramerate: avgFPS >= TEST_CONFIG.fpsThresholds.acceptable
        };
        
        // Déterminer la qualité du framerate
        if (avgFPS >= TEST_CONFIG.fpsThresholds.excellent) {
          results[quality].fpsQuality = 'excellent';
        } else if (avgFPS >= TEST_CONFIG.fpsThresholds.good) {
          results[quality].fpsQuality = 'good';
        } else if (avgFPS >= TEST_CONFIG.fpsThresholds.acceptable) {
          results[quality].fpsQuality = 'acceptable';
        } else {
          results[quality].fpsQuality = 'poor';
        }
        
        console.log(`📊 ${quality}: FPS moyen = ${avgFPS.toFixed(1)}, min = ${minFPS}, max = ${maxFPS} (Qualité: ${results[quality].fpsQuality})`);
      }
      
      // Déterminer la qualité du temps de chargement
      if (loadTime <= TEST_CONFIG.loadTimeThresholds.excellent) {
        results[quality].loadTimeQuality = 'excellent';
      } else if (loadTime <= TEST_CONFIG.loadTimeThresholds.good) {
        results[quality].loadTimeQuality = 'good';
      } else if (loadTime <= TEST_CONFIG.loadTimeThresholds.acceptable) {
        results[quality].loadTimeQuality = 'acceptable';
      } else {
        results[quality].loadTimeQuality = 'poor';
      }
      
      console.log(`⏱️ ${quality}: Temps de chargement = ${loadTime.toFixed(0)}ms (Qualité: ${results[quality].loadTimeQuality})`);
      
      // Mesurer l'utilisation mémoire si disponible
      if (performance.memory) {
        const memoryUsage = performance.memory.usedJSHeapSize / (1024 * 1024);
        results[quality].memoryUsage = memoryUsage;
        console.log(`💾 ${quality}: Utilisation mémoire = ${memoryUsage.toFixed(1)}MB`);
      }
      
      // Pause entre les tests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Erreur lors du test de performance pour ${quality}:`, error);
      results[quality].error = error.message;
    }
  }
  
  testResults.performanceByQuality = results;
  console.log('✅ Tests de performance par niveau de qualité terminés');
  
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
 * Exécute des tests d'adaptation de chargement
 * @returns {Promise<Object>} Résultats des tests
 */
export async function runAdaptiveLoadingTests() {
  console.log('🔍 Exécution des tests d\'adaptation de chargement...');
  
  const results = {
    progressiveLoading: {},
    loadingOrder: {},
    textureCompression: {}
  };
  
  // Vérifier que nous sommes sur une page avec visualisation 3D
  const hasVisualization = document.querySelector('.visualization-3d-container') || 
                         document.querySelector('.col-visualization-3d');
  
  if (!hasVisualization) {
    console.warn('⚠️ Ces tests doivent être exécutés sur une page avec visualisation 3D');
    return { error: 'Aucune visualisation 3D trouvée sur cette page' };
  }
  
  try {
    console.log('⏱️ Test de chargement progressif...');
    
    // Tester le chargement progressif
    if (window.progressive3DLoader) {
      // Activer le monitoring du chargement progressif
      window.progressive3DLoader.enableLoadingMonitor();
      
      // Recharger la scène
      const loadStart = performance.now();
      if (window.colVisualization && typeof window.colVisualization.reload === 'function') {
        await window.colVisualization.reload();
      }
      
      // Collecter les étapes de chargement
      const loadingSteps = window.progressive3DLoader.getLoadingSteps();
      results.progressiveLoading.steps = loadingSteps;
      results.progressiveLoading.totalTime = performance.now() - loadStart;
      
      // Analyser les étapes de chargement
      if (loadingSteps && loadingSteps.length > 0) {
        const initialLoadStep = loadingSteps.find(step => step.name === 'initialDisplay');
        const geometryLoadStep = loadingSteps.find(step => step.name === 'geometryLoaded');
        const texturesLoadStep = loadingSteps.find(step => step.name === 'texturesLoaded');
        const detailsLoadStep = loadingSteps.find(step => step.name === 'detailsLoaded');
        
        // Vérifier si les étapes essentielles sont présentes
        results.progressiveLoading.hasAllSteps = 
          !!initialLoadStep && !!geometryLoadStep && !!texturesLoadStep;
        
        // Vérifier l'ordre des étapes
        if (results.progressiveLoading.hasAllSteps) {
          const correctOrder = 
            initialLoadStep.timestamp <= geometryLoadStep.timestamp &&
            geometryLoadStep.timestamp <= texturesLoadStep.timestamp &&
            (!detailsLoadStep || texturesLoadStep.timestamp <= detailsLoadStep.timestamp);
          
          results.progressiveLoading.correctOrder = correctOrder;
          
          // Calculer les délais entre les étapes
          results.loadingOrder.initialToGeometry = 
            geometryLoadStep.timestamp - initialLoadStep.timestamp;
          results.loadingOrder.geometryToTextures = 
            texturesLoadStep.timestamp - geometryLoadStep.timestamp;
          
          if (detailsLoadStep) {
            results.loadingOrder.texturesToDetails = 
              detailsLoadStep.timestamp - texturesLoadStep.timestamp;
          }
          
          console.log(`⏱️ Délais: Initial → Géométrie: ${results.loadingOrder.initialToGeometry.toFixed(0)}ms, ` +
                     `Géométrie → Textures: ${results.loadingOrder.geometryToTextures.toFixed(0)}ms`);
        }
      }
      
      // Vérifier la compression des textures
      const textureCompressionInfo = await window.progressive3DLoader.getTextureCompressionInfo();
      if (textureCompressionInfo) {
        results.textureCompression = textureCompressionInfo;
        
        // Calculer le taux de compression
        if (textureCompressionInfo.originalSize && textureCompressionInfo.compressedSize) {
          const compressionRatio = textureCompressionInfo.originalSize / textureCompressionInfo.compressedSize;
          results.textureCompression.compressionRatio = compressionRatio;
          
          console.log(`📊 Compression textures: Taux ${compressionRatio.toFixed(1)}x (${(textureCompressionInfo.originalSize/1024).toFixed(0)}KB → ${(textureCompressionInfo.compressedSize/1024).toFixed(0)}KB)`);
        }
      }
      
      // Désactiver le monitoring
      window.progressive3DLoader.disableLoadingMonitor();
    } else {
      console.warn('⚠️ Progressive3DLoader non disponible pour les tests de chargement progressif');
      results.progressiveLoading.error = 'Service non disponible';
    }
  } catch (error) {
    console.error('❌ Erreur lors des tests de chargement adaptatif:', error);
    results.error = error.message;
  }
  
  testResults.adaptiveLoading = results;
  console.log('✅ Tests de chargement adaptatif terminés');
  
  return results;
}

/**
 * Exécute des tests de frustum culling
 * @returns {Promise<Object>} Résultats des tests
 */
export async function runFrustumCullingTests() {
  console.log('🔍 Exécution des tests de frustum culling...');
  
  const results = {
    visibleObjects: {},
    performance: {}
  };
  
  // Vérifier que nous sommes sur une page avec visualisation 3D
  const hasVisualization = document.querySelector('.visualization-3d-container') || 
                         document.querySelector('.col-visualization-3d');
  
  if (!hasVisualization) {
    console.warn('⚠️ Ces tests doivent être exécutés sur une page avec visualisation 3D');
    return { error: 'Aucune visualisation 3D trouvée sur cette page' };
  }
  
  try {
    console.log('👁️ Test de frustum culling...');
    
    if (window.progressive3DLoader) {
      // Activer les statistiques de rendu
      window.progressive3DLoader.enableRenderStats();
      
      // Tester différentes positions de caméra
      const cameraPositions = [
        { name: 'default', x: 0, y: 0, z: 0 }, // Position par défaut
        { name: 'far', x: 1000, y: 500, z: 1000 }, // Vue éloignée
        { name: 'closeUp', x: 10, y: 5, z: 10 } // Vue rapprochée
      ];
      
      for (const position of cameraPositions) {
        console.log(`👁️ Test position caméra: ${position.name}...`);
        
        // Déplacer la caméra
        await window.progressive3DLoader.setCameraPosition(position);
        
        // Attendre quelques frames pour stabiliser
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Obtenir les statistiques
        const stats = await window.progressive3DLoader.getRenderStats();
        
        if (stats) {
          results.visibleObjects[position.name] = {
            totalObjects: stats.totalObjects,
            visibleObjects: stats.visibleObjects,
            cullingRatio: stats.totalObjects > 0 ? 
              (stats.totalObjects - stats.visibleObjects) / stats.totalObjects : 0
          };
          
          // Mesurer les FPS à cette position
          const fpsValues = await measureFPS(2000); // Mesure plus courte pour ce test
          const avgFPS = fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length;
          
          results.performance[position.name] = {
            fps: avgFPS,
            frameTime: stats.frameTime
          };
          
          console.log(`📊 Position ${position.name}: ` +
                     `${stats.visibleObjects}/${stats.totalObjects} objets visibles ` + 
                     `(${(results.visibleObjects[position.name].cullingRatio * 100).toFixed(1)}% culling), ` +
                     `FPS: ${avgFPS.toFixed(1)}`);
        }
      }
      
      // Restaurer la caméra par défaut
      await window.progressive3DLoader.resetCamera();
      
      // Désactiver les statistiques
      window.progressive3DLoader.disableRenderStats();
      
      // Analyser l'efficacité du culling
      if (Object.keys(results.visibleObjects).length >= 3) {
        const farCulling = results.visibleObjects.far?.cullingRatio || 0;
        const closeUpCulling = results.visibleObjects.closeUp?.cullingRatio || 0;
        
        // Le culling devrait être plus efficace en vue éloignée qu'en vue rapprochée
        const effectiveCulling = farCulling > closeUpCulling;
        
        results.cullingEffective = effectiveCulling;
        console.log(`👁️ Efficacité du culling: ${effectiveCulling ? '✅ Efficace' : '⚠️ Inefficace'}`);
      }
    } else {
      console.warn('⚠️ Progressive3DLoader non disponible pour les tests de frustum culling');
      results.error = 'Service non disponible';
    }
  } catch (error) {
    console.error('❌ Erreur lors des tests de frustum culling:', error);
    results.error = error.message;
  }
  
  testResults.frustumCulling = results;
  console.log('✅ Tests de frustum culling terminés');
  
  return results;
}

/**
 * Exécute des tests spécifiques pour le composant SevenMajorsChallenge
 * @returns {Promise<Object>} Résultats des tests
 */
export async function runSevenMajorsChallengeTests() {
  console.log('🔍 Exécution des tests spécifiques pour SevenMajorsChallenge...');
  
  const results = {
    components: {},
    interactivity: {},
    performance: {}
  };
  
  // Vérifier que nous sommes sur une page avec le composant
  const hasComponent = document.querySelector('.seven-majors-challenge') || 
                      document.querySelector('[data-testid="seven-majors-challenge"]');
  
  if (!hasComponent) {
    console.warn('⚠️ Ces tests doivent être exécutés sur une page avec le composant SevenMajorsChallenge');
    return { error: 'Composant SevenMajorsChallenge non trouvé sur cette page' };
  }
  
  try {
    console.log('🔄 Test d\'intégration des visualisations 3D dans SevenMajorsChallenge...');
    
    // Vérifier la présence des visualisations 3D dans le composant
    const visualizations = document.querySelectorAll('.col-visualization-3d');
    results.components.visualizationsCount = visualizations.length;
    results.components.hasVisualizations = visualizations.length > 0;
    
    console.log(`🔢 ${visualizations.length} visualisations 3D trouvées dans le composant`);
    
    if (visualizations.length > 0) {
      // Tester le chargement d'une visualisation au hasard
      const randomIndex = Math.floor(Math.random() * visualizations.length);
      const testVisualization = visualizations[randomIndex];
      
      console.log(`⏱️ Test de performance sur la visualisation #${randomIndex + 1}...`);
      
      // Faire défiler jusqu'à la visualisation pour s'assurer qu'elle est visible
      testVisualization.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre le scroll
      
      // Mesurer les FPS pendant l'interaction avec cette visualisation
      const initialFPS = await measureFPS(2000);
      const avgInitialFPS = initialFPS.reduce((a, b) => a + b, 0) / initialFPS.length;
      results.performance.initialFPS = avgInitialFPS;
      
      // Simuler une interaction (rotation ou zoom)
      console.log('🖱️ Simulation d\'interaction avec la visualisation...');
      
      try {
        if (window.colVisualization && typeof window.colVisualization.rotate === 'function') {
          // Si l'API est disponible, utiliser les méthodes de contrôle
          window.colVisualization.rotate(45, 0);
          await new Promise(resolve => setTimeout(resolve, 500));
          window.colVisualization.rotate(0, 30);
          await new Promise(resolve => setTimeout(resolve, 500));
          window.colVisualization.zoom(1.5);
        } else {
          // Sinon, simuler des événements souris
          const rect = testVisualization.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          
          // Simuler un mousedown
          testVisualization.dispatchEvent(new MouseEvent('mousedown', {
            bubbles: true,
            clientX: centerX,
            clientY: centerY
          }));
          
          // Simuler un mousemove
          await new Promise(resolve => setTimeout(resolve, 100));
          testVisualization.dispatchEvent(new MouseEvent('mousemove', {
            bubbles: true,
            clientX: centerX + 100,
            clientY: centerY + 50
          }));
          
          // Simuler un mouseup
          await new Promise(resolve => setTimeout(resolve, 300));
          testVisualization.dispatchEvent(new MouseEvent('mouseup', {
            bubbles: true,
            clientX: centerX + 100,
            clientY: centerY + 50
          }));
        }
        
        results.interactivity.interactionSimulated = true;
      } catch (interactionError) {
        console.warn('⚠️ Erreur lors de la simulation d\'interaction:', interactionError);
        results.interactivity.error = interactionError.message;
      }
      
      // Mesurer les FPS après l'interaction
      await new Promise(resolve => setTimeout(resolve, 500)); // Attendre que l'interaction se stabilise
      const interactionFPS = await measureFPS(2000);
      const avgInteractionFPS = interactionFPS.reduce((a, b) => a + b, 0) / interactionFPS.length;
      results.performance.interactionFPS = avgInteractionFPS;
      
      // Calculer l'impact de l'interaction sur les performances
      const fpsDrop = avgInitialFPS - avgInteractionFPS;
      const fpsDropPercent = (fpsDrop / avgInitialFPS) * 100;
      
      results.performance.fpsDrop = fpsDrop;
      results.performance.fpsDropPercent = fpsDropPercent;
      
      console.log(`📊 Impact interaction: FPS initial ${avgInitialFPS.toFixed(1)} → ${avgInteractionFPS.toFixed(1)} (baisse de ${fpsDropPercent.toFixed(1)}%)`);
      
      // Évaluer la fluidité de l'interaction
      if (fpsDropPercent <= 10) {
        results.performance.interactionQuality = 'excellent';
      } else if (fpsDropPercent <= 25) {
        results.performance.interactionQuality = 'good';
      } else if (fpsDropPercent <= 50) {
        results.performance.interactionQuality = 'acceptable';
      } else {
        results.performance.interactionQuality = 'poor';
      }
      
      console.log(`📊 Qualité interaction: ${results.performance.interactionQuality}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors des tests spécifiques pour SevenMajorsChallenge:', error);
    results.error = error.message;
  }
  
  testResults.sevenMajorsChallenge = results;
  console.log('✅ Tests pour SevenMajorsChallenge terminés');
  
  return results;
}

/**
 * Génère un rapport des tests de visualisation 3D
 * @returns {Object} Rapport de tests
 */
export function generateVisual3DReport() {
  console.log('📊 Génération du rapport de tests de visualisation 3D...');
  
  const report = {
    summary: {
      qualityAdaptation: {
        qualityLevels: {},
        deviceAdaptation: {}
      },
      performance: {
        byQuality: {},
        bestQualityWithGoodPerformance: null
      },
      adaptiveLoading: {
        progressiveLoading: false,
        textureCompression: false
      },
      frustumCulling: {
        effective: false
      },
      sevenMajorsChallenge: {
        visualization3DIntegration: false,
        interactivityQuality: 'N/A'
      }
    },
    details: testResults,
    timestamp: testResults.timestamp
  };
  
  // Résumer la qualité d'adaptation
  if (testResults.qualityAdaptation.qualityLevels) {
    for (const [quality, data] of Object.entries(testResults.qualityAdaptation.qualityLevels)) {
      if (!data.error) {
        report.summary.qualityAdaptation.qualityLevels[quality] = {
          applied: data.applied,
          matchRate: data.matchRate ? `${(data.matchRate * 100).toFixed(0)}%` : 'N/A'
        };
      }
    }
  }
  
  if (testResults.qualityAdaptation.deviceProfiles) {
    let appropriateCount = 0;
    let totalProfiles = 0;
    
    for (const [profile, data] of Object.entries(testResults.qualityAdaptation.deviceProfiles)) {
      if (!data.error) {
        totalProfiles++;
        if (data.appropriateQuality) {
          appropriateCount++;
        }
      }
    }
    
    report.summary.qualityAdaptation.deviceAdaptation = {
      profilesTested: totalProfiles,
      appropriateQuality: appropriateCount,
      successRate: totalProfiles > 0 ? 
        `${(appropriateCount / totalProfiles * 100).toFixed(0)}%` : 'N/A'
    };
  }
  
  // Résumer les performances par qualité
  if (testResults.performanceByQuality) {
    let bestQuality = null;
    let bestScore = -1;
    
    for (const [quality, data] of Object.entries(testResults.performanceByQuality)) {
      if (!data.error && data.fpsStats) {
        const fpsScore = data.fpsStats.avg;
        const loadTimeScore = data.loadTime ? 
          (3000 - Math.min(data.loadTime, 3000)) / 30 : 0; // Convertir en score 0-100
        
        // Score combiné (70% FPS, 30% temps de chargement)
        const combinedScore = (fpsScore * 0.7) + (loadTimeScore * 0.3);
        
        report.summary.performance.byQuality[quality] = {
          fps: data.fpsStats.avg.toFixed(1),
          loadTime: data.loadTime ? `${data.loadTime.toFixed(0)}ms` : 'N/A',
          fpsQuality: data.fpsQuality,
          loadQuality: data.loadTimeQuality
        };
        
        // Si ce niveau a de bonnes performances et est meilleur que ce qu'on a trouvé
        if (data.fpsQuality !== 'poor' && data.loadTimeQuality !== 'poor' && 
            combinedScore > bestScore) {
          bestScore = combinedScore;
          bestQuality = quality;
        }
      }
    }
    
    report.summary.performance.bestQualityWithGoodPerformance = bestQuality;
  }
  
  // Résumer le chargement adaptatif
  if (testResults.adaptiveLoading.progressiveLoading) {
    report.summary.adaptiveLoading.progressiveLoading = 
      testResults.adaptiveLoading.progressiveLoading.hasAllSteps &&
      testResults.adaptiveLoading.progressiveLoading.correctOrder;
  }
  
  if (testResults.adaptiveLoading.textureCompression) {
    report.summary.adaptiveLoading.textureCompression = 
      !!testResults.adaptiveLoading.textureCompression.compressionRatio &&
      testResults.adaptiveLoading.textureCompression.compressionRatio > 1;
    
    if (report.summary.adaptiveLoading.textureCompression) {
      report.summary.adaptiveLoading.compressionRatio = 
        testResults.adaptiveLoading.textureCompression.compressionRatio.toFixed(1) + 'x';
    }
  }
  
  // Résumer le frustum culling
  if ('cullingEffective' in testResults.frustumCulling) {
    report.summary.frustumCulling.effective = testResults.frustumCulling.cullingEffective;
  }
  
  // Résumer les tests de SevenMajorsChallenge
  if (testResults.sevenMajorsChallenge.components) {
    report.summary.sevenMajorsChallenge.visualization3DIntegration = 
      testResults.sevenMajorsChallenge.components.hasVisualizations;
    
    if (testResults.sevenMajorsChallenge.components.visualizationsCount) {
      report.summary.sevenMajorsChallenge.visualizationsCount = 
        testResults.sevenMajorsChallenge.components.visualizationsCount;
    }
  }
  
  if (testResults.sevenMajorsChallenge.performance) {
    report.summary.sevenMajorsChallenge.interactivityQuality = 
      testResults.sevenMajorsChallenge.performance.interactionQuality || 'N/A';
    
    if (testResults.sevenMajorsChallenge.performance.fpsDropPercent) {
      report.summary.sevenMajorsChallenge.interactionImpact = 
        `${testResults.sevenMajorsChallenge.performance.fpsDropPercent.toFixed(1)}%`;
    }
  }
  
  console.log('✅ Rapport de tests de visualisation 3D généré');
  console.table(report.summary.performance.byQuality);
  
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
  a.download = `visual3d-test-results-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  console.log('💾 Résultats des tests exportés');
}

/**
 * Exécute tous les tests de visualisation 3D
 */
export async function runAllVisual3DTests() {
  console.log('🚀 Démarrage de la suite de tests de visualisation 3D...');
  
  await runQualityAdaptationTests();
  await runPerformanceByQualityTests();
  await runAdaptiveLoadingTests();
  await runFrustumCullingTests();
  await runSevenMajorsChallengeTests();
  
  const report = generateVisual3DReport();
  
  console.log('🏁 Suite de tests terminée');
  
  return report;
}

// Assign object to a variable before exporting as module default
const visual3DTestRunner = {
  runQualityAdaptationTests,
  runPerformanceByQualityTests,
  runAdaptiveLoadingTests,
  runFrustumCullingTests,
  runSevenMajorsChallengeTests,
  generateVisual3DReport,
  exportTestResults,
  runAllVisual3DTests
};

export default visual3DTestRunner;
