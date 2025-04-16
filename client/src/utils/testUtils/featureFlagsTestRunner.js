/**
 * Utilitaire pour tester le système de feature flags
 * Permet de vérifier le fonctionnement de la segmentation utilisateur et des overrides
 */

// Configuration des tests
const TEST_CONFIG = {
  testCases: [
    {
      name: 'Test des flags de base',
      flags: ['progressiveLoading', 'apiCaching', 'optimized3DViz', 'timeoutRetryStrategy']
    },
    {
      name: 'Test de segmentation utilisateur',
      roles: ['anonymous', 'user', 'premium', 'admin'],
      flags: ['premiumFeatures', 'adminDashboard', 'betaFeatures']
    },
    {
      name: 'Test des variantes',
      variants: ['qualityLevel', 'uiDensity', 'colorScheme']
    },
    {
      name: 'Test des contraintes temporelles',
      flags: ['seasonalFeature', 'specialEvent', 'limitedTimeOffer']
    },
    {
      name: 'Test spécifique pour SevenMajorsChallenge',
      flags: ['sevenMajorsChallenge', 'advancedFiltering', '3DColVisualization', 'challengeRecommendations']
    }
  ],
  
  // Les utilisateurs de test pour vérifier la segmentation
  testUsers: {
    anonymous: { id: null, role: 'anonymous', preferences: {} },
    basicUser: { id: 'user123', role: 'user', preferences: { theme: 'light', notifications: true } },
    premiumUser: { id: 'premium456', role: 'premium', preferences: { theme: 'dark', notifications: true } },
    adminUser: { id: 'admin789', role: 'admin', preferences: { theme: 'system', notifications: false } }
  }
};

// Résultats des tests
let testResults = {
  flagsBasic: {},
  segmentation: {},
  variants: {},
  temporalConstraints: {},
  overrides: {},
  persistence: {},
  specificFeatures: {},
  timestamp: new Date().toISOString()
};

/**
 * Exécute les tests de base sur les feature flags
 * @returns {Object} Résultats des tests
 */
export function runBasicFlagsTests() {
  console.log('🔍 Exécution des tests de base sur les feature flags...');
  
  const results = {};
  
  // Vérifier l'accès au service
  if (!window.featureFlagsService) {
    console.error('❌ Service de feature flags non disponible');
    return { error: 'Service non disponible' };
  }
  
  // Récupérer tous les flags
  const allFlags = window.featureFlagsService.getAll();
  console.log('📋 Liste de tous les flags:', allFlags);
  results.allFlags = allFlags;
  
  // Tester chaque flag de base
  for (const flag of TEST_CONFIG.testCases[0].flags) {
    try {
      const isEnabled = window.featureFlagsService.isEnabled(flag);
      console.log(`🚩 ${flag}: ${isEnabled ? '✅ Activé' : '❌ Désactivé'}`);
      results[flag] = { enabled: isEnabled, success: true };
    } catch (error) {
      console.error(`❌ Erreur lors du test du flag ${flag}:`, error);
      results[flag] = { error: error.message, success: false };
    }
  }
  
  testResults.flagsBasic = results;
  console.log('✅ Tests de base terminés');
  
  return results;
}

/**
 * Exécute les tests de segmentation utilisateur
 * @returns {Object} Résultats des tests
 */
export function runSegmentationTests() {
  console.log('🔍 Exécution des tests de segmentation utilisateur...');
  
  const results = {
    byRole: {}
  };
  
  // Tester chaque rôle utilisateur
  for (const role of TEST_CONFIG.testCases[1].roles) {
    results.byRole[role] = {};
    
    // Simuler l'utilisateur actuel
    const testUser = TEST_CONFIG.testUsers[role === 'anonymous' ? 'anonymous' : 
                                          role === 'admin' ? 'adminUser' : 
                                          role === 'premium' ? 'premiumUser' : 'basicUser'];
    
    // Appliquer temporairement l'utilisateur de test
    const originalUser = window.featureFlagsService.getCurrentUser();
    window.featureFlagsService.setCurrentUser(testUser);
    
    // Tester chaque flag avec cet utilisateur
    for (const flag of TEST_CONFIG.testCases[1].flags) {
      try {
        const isEnabled = window.featureFlagsService.isEnabled(flag);
        console.log(`👤 Utilisateur ${role} - Flag ${flag}: ${isEnabled ? '✅ Activé' : '❌ Désactivé'}`);
        results.byRole[role][flag] = { enabled: isEnabled, success: true };
      } catch (error) {
        console.error(`❌ Erreur lors du test du flag ${flag} pour ${role}:`, error);
        results.byRole[role][flag] = { error: error.message, success: false };
      }
    }
    
    // Récupérer les flags éligibles pour ce rôle
    try {
      const eligibleFlags = window.featureFlagsService.getEligibleFlags();
      results.byRole[role].eligibleFlags = eligibleFlags;
    } catch (error) {
      console.error(`❌ Erreur lors de la récupération des flags éligibles pour ${role}:`, error);
      results.byRole[role].eligibleFlags = { error: error.message };
    }
    
    // Restaurer l'utilisateur original
    window.featureFlagsService.setCurrentUser(originalUser);
  }
  
  testResults.segmentation = results;
  console.log('✅ Tests de segmentation terminés');
  
  return results;
}

/**
 * Exécute les tests de variantes de feature flags
 * @returns {Object} Résultats des tests
 */
export function runVariantTests() {
  console.log('🔍 Exécution des tests de variantes...');
  
  const results = {};
  
  // Tester chaque variante
  for (const variant of TEST_CONFIG.testCases[2].variants) {
    try {
      const value = window.featureFlagsService.getVariant(variant);
      console.log(`🔄 Variante ${variant}: ${value}`);
      results[variant] = { value, success: true };
      
      // Tester l'override de variante
      const testValue = Array.isArray(value) ? 
        (value.length > 1 ? value[1] : 'test-value') : 
        (typeof value === 'string' ? value + '-test' : 'test-value');
      
      window.featureFlagsService.overrideVariant(variant, testValue);
      const overriddenValue = window.featureFlagsService.getVariant(variant);
      
      results[variant].override = {
        appliedValue: testValue,
        actualValue: overriddenValue,
        success: overriddenValue === testValue
      };
      
      // Réinitialiser la variante
      window.featureFlagsService.resetVariantOverride(variant);
      
    } catch (error) {
      console.error(`❌ Erreur lors du test de la variante ${variant}:`, error);
      results[variant] = { error: error.message, success: false };
    }
  }
  
  testResults.variants = results;
  console.log('✅ Tests de variantes terminés');
  
  return results;
}

/**
 * Exécute les tests d'override et persistance
 * @returns {Object} Résultats des tests
 */
export function runOverrideTests() {
  console.log('🔍 Exécution des tests d\'override...');
  
  const results = {
    override: {},
    persistence: {}
  };
  
  // Sélectionner quelques flags pour les tests
  const testFlags = TEST_CONFIG.testCases[0].flags.slice(0, 2);
  
  // Enregistrer l'état initial
  const initialStates = {};
  for (const flag of testFlags) {
    initialStates[flag] = window.featureFlagsService.isEnabled(flag);
  }
  
  // Tester les overrides
  for (const flag of testFlags) {
    const newState = !initialStates[flag];
    
    try {
      window.featureFlagsService.override(flag, newState);
      const overriddenState = window.featureFlagsService.isEnabled(flag);
      
      console.log(`🔄 Override ${flag} à ${newState}: ${overriddenState === newState ? '✅ Réussi' : '❌ Échoué'}`);
      results.override[flag] = { 
        initialState: initialStates[flag],
        overrideValue: newState,
        actualValue: overriddenState,
        success: overriddenState === newState
      };
    } catch (error) {
      console.error(`❌ Erreur lors de l'override du flag ${flag}:`, error);
      results.override[flag] = { error: error.message, success: false };
    }
  }
  
  // Tester la persistance (après un rechargement simulé)
  console.log('🔄 Simulation de rechargement pour tester la persistance...');
  
  // Au lieu de recharger, on peut vérifier le localStorage
  try {
    const overridesInStorage = localStorage.getItem('feature_flags_overrides');
    const overrides = overridesInStorage ? JSON.parse(overridesInStorage) : {};
    
    results.persistence.storagePresent = !!overridesInStorage;
    results.persistence.overridesInStorage = overrides;
    
    // Vérifier que les overrides sont correctement stockés
    for (const flag of testFlags) {
      const expectedValue = results.override[flag]?.overrideValue;
      const storedValue = overrides[flag];
      
      results.persistence[flag] = {
        expectedValue,
        storedValue,
        success: storedValue === expectedValue
      };
    }
    
    console.log('💾 Persistance des overrides:', 
      Object.values(results.persistence).filter(v => v.success).length === testFlags.length ? 
      '✅ Réussie' : '⚠️ Partielle');
      
  } catch (error) {
    console.error('❌ Erreur lors de la vérification de la persistance:', error);
    results.persistence.error = error.message;
  }
  
  // Réinitialiser les overrides
  window.featureFlagsService.resetOverrides();
  
  testResults.overrides = results.override;
  testResults.persistence = results.persistence;
  console.log('✅ Tests d\'override terminés');
  
  return results;
}

/**
 * Exécute les tests spécifiques pour la fonctionnalité "Seven Majors Challenge"
 * @returns {Object} Résultats des tests
 */
export function runSevenMajorsChallengeTests() {
  console.log('🔍 Exécution des tests spécifiques pour Seven Majors Challenge...');
  
  const results = {};
  
  // Tester chaque flag spécifique
  for (const flag of TEST_CONFIG.testCases[4].flags) {
    try {
      const isEnabled = window.featureFlagsService.isEnabled(flag);
      console.log(`🚩 ${flag}: ${isEnabled ? '✅ Activé' : '❌ Désactivé'}`);
      results[flag] = { enabled: isEnabled, success: true };
      
      // Tester l'impact de la désactivation pour les fonctionnalités critiques
      if (flag === 'sevenMajorsChallenge' || flag === '3DColVisualization') {
        const originalState = isEnabled;
        
        // Désactiver temporairement
        window.featureFlagsService.override(flag, false);
        console.log(`🔄 Test de désactivation de ${flag}...`);
        
        // Vérifier l'impact (idéalement, il faudrait charger le composant et vérifier l'UI)
        // On simule ici cette vérification
        results[flag].disabledImpact = {
          message: `La fonctionnalité ${flag} a été temporairement désactivée pour test`,
          expectedBehavior: flag === 'sevenMajorsChallenge' ? 
            'Le composant SevenMajorsChallenge ne devrait pas être rendu' : 
            'La visualisation 3D devrait être remplacée par une alternative 2D'
        };
        
        // Restaurer l'état original
        window.featureFlagsService.override(flag, originalState);
      }
    } catch (error) {
      console.error(`❌ Erreur lors du test du flag ${flag}:`, error);
      results[flag] = { error: error.message, success: false };
    }
  }
  
  testResults.specificFeatures = results;
  console.log('✅ Tests spécifiques pour Seven Majors Challenge terminés');
  
  return results;
}

/**
 * Génère un rapport des tests de feature flags
 * @returns {Object} Rapport de tests
 */
export function generateFeatureFlagsReport() {
  console.log('📊 Génération du rapport de tests de feature flags...');
  
  const report = {
    summary: {
      basicFlags: {
        total: Object.keys(testResults.flagsBasic).length - 1, // -1 pour allFlags
        enabled: Object.values(testResults.flagsBasic)
          .filter(f => f.enabled && f.success).length,
        success: Object.values(testResults.flagsBasic)
          .filter(f => f.success).length
      },
      segmentation: {
        roles: Object.keys(testResults.segmentation.byRole).length,
        flagsPerRole: {}
      },
      variants: {
        total: Object.keys(testResults.variants).length,
        overrideSuccess: Object.values(testResults.variants)
          .filter(v => v.override && v.override.success).length
      },
      overrides: {
        total: Object.keys(testResults.overrides).length,
        success: Object.values(testResults.overrides)
          .filter(o => o.success).length
      },
      persistence: {
        success: testResults.persistence.storagePresent
      },
      specificFeatures: {
        total: Object.keys(testResults.specificFeatures).length,
        enabled: Object.values(testResults.specificFeatures)
          .filter(f => f.enabled && f.success).length
      }
    },
    details: testResults,
    timestamp: testResults.timestamp
  };
  
  // Compléter les détails de segmentation
  if (testResults.segmentation.byRole) {
    for (const [role, data] of Object.entries(testResults.segmentation.byRole)) {
      const flagsData = Object.entries(data)
        .filter(([key]) => key !== 'eligibleFlags')
        .map(([key, value]) => value);
      
      report.summary.segmentation.flagsPerRole[role] = {
        total: flagsData.length,
        enabled: flagsData.filter(f => f.enabled).length
      };
    }
  }
  
  console.log('✅ Rapport de tests de feature flags généré');
  console.table(report.summary.basicFlags);
  console.table(report.summary.segmentation.flagsPerRole);
  console.table(report.summary.variants);
  
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
  a.download = `feature-flags-test-results-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  console.log('💾 Résultats des tests exportés');
}

/**
 * Exécute tous les tests de feature flags
 */
export function runAllFeatureFlagsTests() {
  console.log('🚀 Démarrage de la suite de tests de feature flags...');
  
  runBasicFlagsTests();
  runSegmentationTests();
  runVariantTests();
  runOverrideTests();
  runSevenMajorsChallengeTests();
  
  const report = generateFeatureFlagsReport();
  
  console.log('🏁 Suite de tests terminée');
  
  return report;
}

// Assign object to a variable before exporting as module default
const featureFlagsTestRunner = {
  runBasicFlagsTests,
  runSegmentationTests,
  runVariantTests,
  runOverrideTests,
  runSevenMajorsChallengeTests,
  generateFeatureFlagsReport,
  exportTestResults,
  runAllFeatureFlagsTests
};

export default featureFlagsTestRunner;
