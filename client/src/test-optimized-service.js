// Script de test pour optimizedDataService.js
import optimizedDataService from './services/optimizedDataService';

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

// Exécuter les tests en série avec async/await
async function runTests() {
  try {
    console.log('🚀 DÉMARRAGE DES TESTS DU SERVICE OPTIMISÉ');
    
    // Test 1: getColData
    try {
      const cols = await optimizedDataService.getColData();
      displayResults('getColData()', cols);
    } catch (error) {
      displayResults('getColData()', null, error);
    }
    
    // Test 2: getTrainingPrograms
    try {
      const programs = await optimizedDataService.getTrainingPrograms();
      displayResults('getTrainingPrograms()', programs);
    } catch (error) {
      displayResults('getTrainingPrograms()', null, error);
    }
    
    // Test 3: getNutritionRecipes
    try {
      const recipes = await optimizedDataService.getNutritionRecipes();
      displayResults('getNutritionRecipes()', recipes);
    } catch (error) {
      displayResults('getNutritionRecipes()', null, error);
    }
    
    // Test 4: getUserProfile
    try {
      // Utiliser un ID de test
      const userProfile = await optimizedDataService.getUserProfile('test-user-id');
      displayResults('getUserProfile("test-user-id")', userProfile);
    } catch (error) {
      displayResults('getUserProfile("test-user-id")', null, error);
    }
    
    console.log('\n✨ TESTS TERMINÉS');
    console.log('Vérifiez les résultats ci-dessus pour confirmer que le service fonctionne correctement sans mock data.');
    
  } catch (error) {
    console.error('❌ ERREUR GLOBALE:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Exécuter les tests
runTests();
