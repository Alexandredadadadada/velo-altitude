// Script de test CommonJS pour optimizedDataService.js 
// Utilise require() au lieu de import

// Polyfill pour URLSearchParams (utilisé par optimizedDataService)
global.URLSearchParams = require('url').URLSearchParams;

// Définir les variables d'environnement nécessaires
process.env.REACT_APP_API_URL = process.env.REACT_APP_API_URL || 'https://api.dashboard-velo.com';

// Simuler l'environnement React pour éviter les erreurs d'import
global.React = {
  createElement: () => {},
  Component: class {}
};

// Mock pour axios
const mockAxios = {
  create: () => ({
    get: async () => ({ data: { message: 'Mocked axios response' } }),
    post: async () => ({ data: { message: 'Mocked axios response' } })
  })
};

// Mock pour RealApiOrchestrator
const mockRealApiOrchestrator = {
  getAllCols: async () => {
    console.log('[MOCK] RealApiOrchestrator.getAllCols called');
    return [
      { id: 'col1', name: 'Col du Tourmalet', elevation: 2115 },
      { id: 'col2', name: 'Col du Galibier', elevation: 2642 }
    ];
  },
  getColById: async (id) => {
    console.log(`[MOCK] RealApiOrchestrator.getColById called with id: ${id}`);
    return { id, name: `Col Mockup #${id}`, elevation: 1800 };
  },
  getUserTrainingPlans: async (options) => {
    console.log(`[MOCK] RealApiOrchestrator.getUserTrainingPlans called with options:`, options);
    return [
      { id: 'plan1', name: 'Plan d\'entraînement débutant', level: 'beginner' },
      { id: 'plan2', name: 'Plan d\'entraînement avancé', level: 'advanced' }
    ];
  },
  getNutritionRecipes: async (options) => {
    console.log(`[MOCK] RealApiOrchestrator.getNutritionRecipes called with options:`, options);
    return [
      { id: 'recipe1', name: 'Barres énergétiques maison', category: 'energy' },
      { id: 'recipe2', name: 'Smoothie récupération', category: 'recovery' }
    ];
  },
  getUserProfile: async (userId) => {
    console.log(`[MOCK] RealApiOrchestrator.getUserProfile called with userId: ${userId}`);
    return { 
      id: userId, 
      name: 'Utilisateur Test', 
      preferences: {
        language: 'fr',
        units: 'metric'
      }
    };
  }
};

// Mocks requis avant de charger le module
jest = {
  mock: (path) => path,
  fn: () => jest.fn,
  spyOn: () => {}
};

// Modules mockés
const axiosModule = mockAxios;
const realApiOrchestratorModule = { default: mockRealApiOrchestrator };

// Fonction pour afficher les résultats d'appel d'API
function displayResults(title, data, error = null) {
  console.log('\n' + '='.repeat(80));
  console.log(`TEST: ${title}`);
  console.log('='.repeat(80));
  
  if (error) {
    console.error('❌ ERREUR:', error.message);
    console.error('Stack:', error.stack);
    return;
  }
  
  if (data) {
    console.log('✅ SUCCÈS: Données reçues');
    console.log('Type de données:', Array.isArray(data) ? 'Array' : typeof data);
    
    if (Array.isArray(data)) {
      console.log(`Nombre d'éléments: ${data.length}`);
      if (data.length > 0) {
        console.log('Premier élément:', JSON.stringify(data[0], null, 2).substring(0, 500) + (JSON.stringify(data[0], null, 2).length > 500 ? '...' : ''));
      }
    } else if (typeof data === 'object') {
      console.log('Structure des données:', Object.keys(data));
      console.log('Aperçu:', JSON.stringify(data, null, 2).substring(0, 500) + (JSON.stringify(data, null, 2).length > 500 ? '...' : ''));
    } else {
      console.log('Données:', data);
    }
  } else {
    console.log('⚠️ ATTENTION: Aucune donnée reçue (null ou undefined)');
  }
}

// Charger le module avec des mocks injectés
function loadOptimizedDataService() {
  // Cache le module original
  const originalRequire = require;

  // Remplacer require par une version mockée
  require = function(modulePath) {
    if (modulePath === 'axios') {
      return axiosModule;
    } 
    if (modulePath === './api/RealApiOrchestratorCombined') {
      return realApiOrchestratorModule;
    }
    // Pour tous les autres modules, utiliser le require original
    return originalRequire(modulePath);
  };

  // Essayer de charger le module
  try {
    // Charger le module (avec des mocks injectés)
    const actualPath = '../services/optimizedDataService.js';
    console.log(`Tentative de chargement du module: ${actualPath}`);
    const optimizedDataService = require(actualPath);
    console.log("Module chargé avec succès ✅");
    return optimizedDataService;
  } catch (error) {
    console.error("❌ Erreur lors du chargement du module:", error);
    throw error;
  } finally {
    // Restaurer le require original
    require = originalRequire;
  }
}

// Exécuter les tests en série avec async/await
async function runTests() {
  console.log('🚀 DÉMARRAGE DES TESTS DU SERVICE OPTIMISÉ');
  
  try {
    // Charger le module
    const optimizedDataService = loadOptimizedDataService();
    
    // Si l'export est par défaut, le prendre
    const service = optimizedDataService.default || optimizedDataService;
    
    console.log("Service optimisé chargé:", service ? "OK" : "NON");
    console.log("Type du service:", typeof service);
    
    try {
      // Test 1: getColData
      try {
        const cols = await service.getColData();
        displayResults('getColData()', cols);
      } catch (error) {
        displayResults('getColData()', null, error);
      }
      
      // Test 2: getTrainingPrograms
      try {
        const programs = await service.getTrainingPrograms();
        displayResults('getTrainingPrograms()', programs);
      } catch (error) {
        displayResults('getTrainingPrograms()', null, error);
      }
      
      // Test 3: getNutritionRecipes
      try {
        const recipes = await service.getNutritionRecipes();
        displayResults('getNutritionRecipes()', recipes);
      } catch (error) {
        displayResults('getNutritionRecipes()', null, error);
      }
      
      // Test 4: getUserProfile
      try {
        // Utiliser un ID de test
        const userProfile = await service.getUserProfile('test-user-id');
        displayResults('getUserProfile("test-user-id")', userProfile);
      } catch (error) {
        displayResults('getUserProfile("test-user-id")', null, error);
      }
      
      // Test 5: _getMockData (devrait être dépréciée)
      try {
        const mockData = await service._getMockData('cols');
        displayResults('_getMockData("cols") - ATTENTION, devrait être dépréciée', mockData);
      } catch (error) {
        displayResults('_getMockData("cols") - OK si cette méthode est bien dépréciée', null, error);
      }
      
    } catch (error) {
      console.error('❌ ERREUR lors des tests:', error.message);
      console.error('Stack:', error.stack);
    }
    
  } catch (serviceError) {
    console.error('❌ ERREUR lors du chargement du service:', serviceError.message);
    console.error('Stack:', serviceError.stack);
  }
  
  console.log('\n✨ TESTS TERMINÉS');
  console.log('Vérifiez les résultats ci-dessus pour confirmer que le service fonctionne correctement sans mock data.');
}

// Exécuter les tests
runTests();
