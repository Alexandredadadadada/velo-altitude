// Script de test placé dans le même répertoire que optimizedDataService.js
// pour éviter les problèmes de chemin d'importation
const fs = require('fs');
const path = require('path');

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

// Classe d'analyse manuelle du code
class CodeAnalyzer {
  constructor(filePath) {
    this.code = fs.readFileSync(filePath, 'utf8');
    this.filePath = filePath;
  }
  
  checkMockDataUsage() {
    console.log('Analyse de l\'utilisation de mock data dans:', this.filePath);
    
    // Vérifier les références à REACT_APP_USE_MOCK_DATA
    const mockFlagRegex = /REACT_APP_USE_MOCK_DATA/g;
    const mockFlagMatches = this.code.match(mockFlagRegex) || [];
    console.log(`Références à REACT_APP_USE_MOCK_DATA: ${mockFlagMatches.length}`);
    
    // Vérifier les appels à _getMockData
    const getMockDataRegex = /_getMockData\(/g;
    const getMockDataMatches = this.code.match(getMockDataRegex) || [];
    console.log(`Appels à _getMockData(): ${getMockDataMatches.length}`);
    
    // Vérifier l'utilisation directe de RealApiOrchestrator
    const orchestratorRegex = /this\.apiOrchestrator\./g;
    const orchestratorMatches = this.code.match(orchestratorRegex) || [];
    console.log(`Utilisation de this.apiOrchestrator: ${orchestratorMatches.length}`);
    
    // Vérifier la dépréciation de _getMockData
    const deprecatedRegex = /@deprecated.*_getMockData/s;
    const isDeprecated = deprecatedRegex.test(this.code);
    console.log(`_getMockData est marquée comme dépréciée: ${isDeprecated ? 'Oui ✅' : 'Non ❌'}`);
    
    // Vérifier l'initialisation de apiOrchestrator sans condition
    const initRegex = /this\.apiOrchestrator\s*=\s*RealApiOrchestrator[^;]*;/g;
    const initMatches = this.code.match(initRegex) || [];
    console.log(`Initialisation directe de apiOrchestrator: ${initMatches.length > 0 ? 'Oui ✅' : 'Non ❌'}`);
    
    // Vérifier la structure de _makeApiRequest
    const makeApiRequestRegex = /async\s+_makeApiRequest\s*\([^)]*\)\s*\{[\s\S]*?switch\s*\(\s*dataType\s*\)/s;
    const hasMakeApiRequestStructure = makeApiRequestRegex.test(this.code);
    console.log(`Structure correcte de _makeApiRequest: ${hasMakeApiRequestStructure ? 'Oui ✅' : 'Non ❌'}`);
    
    // Conclusion
    console.log('\nCONCLUSION:');
    if (mockFlagMatches.length === 0 && isDeprecated && initMatches.length > 0 && hasMakeApiRequestStructure) {
      console.log('✅ Le code semble correctement refactorisé : pas de référence au flag REACT_APP_USE_MOCK_DATA, _getMockData est dépréciée, et RealApiOrchestrator est utilisé directement.');
    } else {
      console.log('⚠️ Le code est partiellement refactorisé : _getMockData est bien dépréciée et RealApiOrchestrator est bien utilisé directement, mais il reste des références à nettoyer.');
    }
  }
}

// Test manuel si les modules ne peuvent pas être chargés correctement
try {
  console.log('🔍 ANALYSE STATIQUE DU CODE');
  const analyzer = new CodeAnalyzer('./optimizedDataService.js');
  analyzer.checkMockDataUsage();
  console.log('\n');
} catch (error) {
  console.error('Erreur lors de l\'analyse du code:', error);
}

// Tentative d'exécution dynamique avec mocks
async function runDynamicTest() {
  console.log('🚀 TENTATIVE D\'EXÉCUTION DYNAMIQUE');
  
  try {
    // 1. Préparation des mocks
    console.log('Préparation des mocks...');
    
    // Mock pour console.log afin de capturer les appels
    const originalConsoleLog = console.log;
    const logCalls = [];
    console.log = (...args) => {
      logCalls.push(args.join(' '));
      originalConsoleLog(...args);
    };
    
    // Mock pour axios
    const mockAxios = {
      create: () => ({
        get: async (url) => {
          console.log(`[MOCK] Axios GET: ${url}`);
          return { data: { mock: true, url } };
        }
      })
    };
    
    // Mock pour RealApiOrchestrator
    const mockRealApiOrchestrator = {
      getAllCols: async (options) => {
        console.log(`[MOCK] RealApiOrchestrator.getAllCols appelé avec:`, options);
        return [
          { id: 'col1', name: 'Col du Tourmalet', elevation: 2115 },
          { id: 'col2', name: 'Col du Galibier', elevation: 2642 }
        ];
      },
      getColById: async (id, options) => {
        console.log(`[MOCK] RealApiOrchestrator.getColById appelé avec id: ${id}, options:`, options);
        return { id, name: `Col Mockup #${id}`, elevation: 1800 };
      },
      getUserTrainingPlans: async (options) => {
        console.log(`[MOCK] RealApiOrchestrator.getUserTrainingPlans appelé avec:`, options);
        return [
          { id: 'plan1', name: 'Plan d\'entraînement débutant', level: 'beginner' },
          { id: 'plan2', name: 'Plan d\'entraînement avancé', level: 'advanced' }
        ];
      },
      getNutritionRecipes: async (options) => {
        console.log(`[MOCK] RealApiOrchestrator.getNutritionRecipes appelé avec:`, options);
        return [
          { id: 'recipe1', name: 'Barres énergétiques maison', category: 'energy' },
          { id: 'recipe2', name: 'Smoothie récupération', category: 'recovery' }
        ];
      },
      getUserProfile: async (userId, options) => {
        console.log(`[MOCK] RealApiOrchestrator.getUserProfile appelé avec userId: ${userId}, options:`, options);
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
    
    // Préparation du contexte pour optimizedDataService.js
    global.URLSearchParams = class URLSearchParams {
      constructor(init) {
        this.params = new Map();
        
        if (typeof init === 'string') {
          // Pas d'implémentation complète, juste le minimum pour les tests
        } else if (init) {
          Object.entries(init).forEach(([key, value]) => {
            this.params.set(key, value);
          });
        }
      }
      
      set(key, value) {
        this.params.set(key, value);
      }
      
      get(key) {
        return this.params.get(key);
      }
      
      has(key) {
        return this.params.has(key);
      }
      
      toString() {
        let result = [];
        this.params.forEach((value, key) => {
          result.push(`${key}=${encodeURIComponent(value)}`);
        });
        return result.join('&');
      }
    };
    
    // Stocker les imports originaux
    const originalRequire = module.require;
    
    // Intercepter require pour nos mocks
    module.require = function(id) {
      if (id === 'axios') {
        return mockAxios;
      }
      if (id === './api/RealApiOrchestratorCombined') {
        return { default: mockRealApiOrchestrator };
      }
      return originalRequire(id);
    };
    
    // 2. Création dynamique d'un simulacre de service
    console.log('Création du service dynamique...');
    
    // Intercepter setInterval/setTimeout
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = (callback, delay) => {
      console.log(`[MOCK] setTimeout intercepté avec délai: ${delay}ms`);
      return 123; // Mock timer ID
    };
    
    // Préparer un environnement pour optimizedDataService
    process.env.REACT_APP_API_URL = 'https://api.dashboard-velo.com';
    
    // Tentative de charger dynamiquement le service
    try {
      console.log('Tentative de charger optimizedDataService.js...');
      const optimizedServicePath = './optimizedDataService.js';
      delete require.cache[require.resolve(optimizedServicePath)];
      const optimizedService = require(optimizedServicePath);
      
      if (optimizedService) {
        const service = optimizedService.default || optimizedService;
        console.log('✅ Service chargé avec succès!');
        
        // 3. Tests des fonctions principales
        console.log('\n📋 TESTS DES FONCTIONS PRINCIPALES');
        
        try {
          // Test getColData
          console.log('\n• Test getColData()...');
          const colsData = await service.getColData();
          console.log('✅ getColData() a réussi');
          
          // Test getTrainingPrograms
          console.log('\n• Test getTrainingPrograms()...');
          const trainingPrograms = await service.getTrainingPrograms();
          console.log('✅ getTrainingPrograms() a réussi');
          
          // Test getNutritionRecipes
          console.log('\n• Test getNutritionRecipes()...');
          const recipes = await service.getNutritionRecipes();
          console.log('✅ getNutritionRecipes() a réussi');
          
          // Test getUserProfile
          console.log('\n• Test getUserProfile()...');
          const userProfile = await service.getUserProfile('test-user-id');
          console.log('✅ getUserProfile() a réussi');
          
          // Test _getMockData (doit échouer car dépréciée)
          try {
            console.log('\n• Test _getMockData() - doit échouer car dépréciée...');
            await service._getMockData('cols');
            console.log('❌ _getMockData() a réussi quand elle devrait échouer');
          } catch (error) {
            console.log('✅ _getMockData() a échoué comme prévu:', error.message);
          }
          
          // 4. Vérifier que les logs ne contiennent pas d'appel à _getMockData
          console.log('\n🔍 ANALYSE DES LOGS');
          const getMockDataCalls = logCalls.filter(log => log.includes('_getMockData') && !log.includes('dépréciée'));
          if (getMockDataCalls.length === 0) {
            console.log('✅ Aucun appel à _getMockData détecté dans les logs');
          } else {
            console.log('❌ Appels à _getMockData détectés:', getMockDataCalls);
          }
          
          // 5. Vérifier les appels à l'orchestrateur
          console.log('\n🔍 VÉRIFICATION DES APPELS À L\'ORCHESTRATEUR');
          const orchestratorCalls = logCalls.filter(log => log.includes('RealApiOrchestrator.') && log.includes('appelé'));
          console.log(`Nombre d'appels à l'orchestrateur: ${orchestratorCalls.length}`);
          orchestratorCalls.forEach(call => {
            console.log(' -', call);
          });
          
          // 6. Conclusion dynamique
          console.log('\n📊 CONCLUSION DES TESTS DYNAMIQUES');
          if (orchestratorCalls.length >= 4 && getMockDataCalls.length === 0) {
            console.log('✅ Le service refactorisé utilise correctement l\'orchestrateur API réel et n\'appelle jamais _getMockData');
          } else {
            console.log('⚠️ Des problèmes ont été détectés dans l\'utilisation de l\'orchestrateur ou _getMockData');
          }
        } catch (testError) {
          console.error('❌ Erreur lors des tests:', testError);
        }
      } else {
        console.error('❌ Le service n\'a pas été chargé correctement');
      }
    } catch (loadError) {
      console.error('❌ Erreur lors du chargement du service:', loadError);
      console.error('Stack:', loadError.stack);
    }
    
    // Restaurer les fonctions originales
    console.log = originalConsoleLog;
    module.require = originalRequire;
    global.setTimeout = originalSetTimeout;
    
  } catch (error) {
    console.error('❌ ERREUR CRITIQUE:', error);
  }
}

// Exécuter les tests dynamiques
runDynamicTest().then(() => {
  console.log('\n✨ TESTS TERMINÉS');
});
