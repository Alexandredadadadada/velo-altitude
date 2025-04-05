/**
 * Service de tests A/B pour Dashboard-Velo
 * Permet de mettre en place des tests utilisateurs sur différentes interfaces
 * et d'analyser les métriques de conversion
 */

import { getAnalyticsService } from './analyticsService';

class ABTestingService {
  constructor(options = {}) {
    this.tests = options.tests || [];
    this.userId = options.userId || this._generateUserId();
    this.storage = options.storage || window.localStorage;
    this.analyticsService = options.analyticsService || getAnalyticsService();
    this.variations = this._loadVariations();
    this.debug = options.debug || false;
  }

  /**
   * Initialiser les tests A/B
   * Assigne des variations aux utilisateurs et effectue le tracking
   * @returns {void}
   */
  initialize() {
    // Assigner des variations si elles n'existent pas déjà
    this.tests.forEach(test => {
      if (!this.variations[test.id]) {
        this.variations[test.id] = this._assignVariation(test);
        this._saveVariations();
      }
    });

    // Envoyer les données d'exposition aux tests
    this._trackExposure();
    
    if (this.debug) {
      console.log('A/B Testing initialized:', this.variations);
    }
  }

  /**
   * Obtenir la variation active pour un test spécifique
   * @param {string} testId - ID du test
   * @returns {string|null} - ID de la variation ou null
   */
  getVariation(testId) {
    return this.variations[testId] || null;
  }

  /**
   * Vérifier si l'utilisateur est dans une variation spécifique
   * @param {string} testId - ID du test
   * @param {string} variationId - ID de la variation à vérifier
   * @returns {boolean} - True si l'utilisateur est dans cette variation
   */
  isInVariation(testId, variationId) {
    return this.getVariation(testId) === variationId;
  }

  /**
   * Suivre une conversion pour un test
   * @param {string} testId - ID du test
   * @param {string} goalId - ID de l'objectif ou action
   * @param {any} value - Valeur optionnelle associée à la conversion
   * @returns {void}
   */
  trackConversion(testId, goalId, value = null) {
    if (!this.variations[testId]) return;

    if (this.analyticsService) {
      this.analyticsService.trackEvent('ab_test_conversion', {
        test_id: testId,
        variation_id: this.variations[testId],
        goal_id: goalId,
        value: value
      });
    }
    
    if (this.debug) {
      console.log('A/B Test conversion:', { 
        test_id: testId, 
        variation_id: this.variations[testId], 
        goal_id: goalId 
      });
    }
  }

  /**
   * Activer ou désactiver le mode debug
   * @param {boolean} enabled - État du mode debug
   * @returns {void}
   */
  setDebug(enabled) {
    this.debug = enabled;
  }

  /**
   * Générer un rapport sur les tests actifs
   * @returns {Object} - Informations sur les tests actifs
   */
  getTestingReport() {
    return {
      userId: this.userId,
      variations: this.variations,
      activeTests: this.tests.filter(test => test.isActive),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Forcer une variation spécifique (pour les tests et démos)
   * @param {string} testId - ID du test
   * @param {string} variationId - ID de la variation
   * @returns {void}
   */
  forceVariation(testId, variationId) {
    const test = this.tests.find(t => t.id === testId);
    
    if (!test) {
      console.error(`Test ${testId} not found`);
      return;
    }
    
    const validVariation = test.variations.find(v => v.id === variationId);
    
    if (!validVariation) {
      console.error(`Variation ${variationId} not found in test ${testId}`);
      return;
    }
    
    this.variations[testId] = variationId;
    this._saveVariations();
    
    if (this.debug) {
      console.log(`Forced variation: ${testId} -> ${variationId}`);
    }
  }

  /**
   * Générer un ID utilisateur unique
   * @private
   * @returns {string} - ID utilisateur
   */
  _generateUserId() {
    return 'user_' + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Charger les variations depuis le stockage
   * @private
   * @returns {Object} - Variations sauvegardées
   */
  _loadVariations() {
    try {
      const storedVariations = this.storage.getItem('ab_test_variations');
      return storedVariations ? JSON.parse(storedVariations) : {};
    } catch (e) {
      console.error('Error loading A/B test variations:', e);
      return {};
    }
  }

  /**
   * Sauvegarder les variations dans le stockage
   * @private
   * @returns {void}
   */
  _saveVariations() {
    try {
      this.storage.setItem('ab_test_variations', JSON.stringify(this.variations));
    } catch (e) {
      console.error('Error saving A/B test variations:', e);
    }
  }

  /**
   * Assigner une variation à l'utilisateur
   * @private
   * @param {Object} test - Configuration du test
   * @returns {string|null} - ID de la variation ou null
   */
  _assignVariation(test) {
    // Vérifier si le test est actif
    if (!test.isActive) return null;

    // Vérifier si l'utilisateur est dans le trafic alloué
    const inTest = Math.random() < test.trafficAllocation;
    if (!inTest) return null;

    // Assigner une variation basée sur les poids
    const random = Math.random();
    let cumulativeWeight = 0;

    for (const variation of test.variations) {
      cumulativeWeight += variation.weight;
      if (random < cumulativeWeight) {
        return variation.id;
      }
    }

    // Fallback à la première variation
    return test.variations[0]?.id || null;
  }

  /**
   * Suivre l'exposition aux tests
   * @private
   * @returns {void}
   */
  _trackExposure() {
    if (!this.analyticsService) return;

    Object.entries(this.variations).forEach(([testId, variationId]) => {
      if (variationId) {
        this.analyticsService.trackEvent('ab_test_exposure', {
          test_id: testId,
          variation_id: variationId
        });
      }
    });
  }
}

// Configuration des tests A/B
const defaultTests = [
  {
    id: 'homepage_layout',
    name: 'Page d\'accueil - Layout',
    isActive: true,
    trafficAllocation: 1.0, // 100% du trafic
    variations: [
      { id: 'control', name: 'Layout actuel', weight: 0.5 },
      { id: 'variant_a', name: 'Layout avec focus sur les cols', weight: 0.25 },
      { id: 'variant_b', name: 'Layout avec focus sur l\'entraînement', weight: 0.25 }
    ]
  },
  {
    id: 'training_program_detail',
    name: 'Détail programme d\'entraînement',
    isActive: true,
    trafficAllocation: 0.8, // 80% du trafic
    variations: [
      { id: 'control', name: 'Layout actuel', weight: 0.5 },
      { id: 'variant_a', name: 'Layout avec visualisation améliorée', weight: 0.5 }
    ]
  },
  {
    id: 'nutritionpage_onboarding',
    name: 'Onboarding nutrition',
    isActive: true,
    trafficAllocation: 0.6, // 60% du trafic
    variations: [
      { id: 'control', name: 'Onboarding standard', weight: 0.33 },
      { id: 'variant_a', name: 'Onboarding simplifié', weight: 0.33 },
      { id: 'variant_b', name: 'Onboarding interactif', weight: 0.34 }
    ]
  }
];

// Créer l'instance du service
let instance = null;

/**
 * Obtenir l'instance singleton du service de tests A/B
 * @param {Object} options - Options de configuration
 * @returns {ABTestingService} Instance du service
 */
export const getABTestingService = (options = {}) => {
  if (!instance) {
    instance = new ABTestingService({
      tests: options.tests || defaultTests,
      userId: options.userId,
      analyticsService: options.analyticsService,
      storage: options.storage,
      debug: options.debug || process.env.NODE_ENV !== 'production'
    });
  }
  return instance;
};

/**
 * Hook React pour utiliser le service de tests A/B dans les composants
 * @param {string} testId - ID du test
 * @returns {Object} - Variation et fonctions utilitaires
 */
export const useABTest = (testId) => {
  const [mounted, setMounted] = React.useState(false);
  const abService = getABTestingService();
  
  React.useEffect(() => {
    if (!mounted) {
      abService.initialize();
      setMounted(true);
    }
  }, [mounted, abService]);
  
  const variation = abService.getVariation(testId);
  
  return {
    variation,
    isInVariation: (variationId) => abService.isInVariation(testId, variationId),
    trackConversion: (goalId, value) => abService.trackConversion(testId, goalId, value)
  };
};

export default getABTestingService;
