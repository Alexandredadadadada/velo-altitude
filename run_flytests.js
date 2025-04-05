// Script pour exécuter les tests de la fonctionnalité Fly-through
const flyThroughTestRunner = require('./client/src/utils/testUtils/flyThroughTestRunner.js');

async function runTests() {
  console.log('Exécution des tests Fly-through...');
  try {
    const results = await flyThroughTestRunner.runFlyThroughTests();
    console.log('Résultats des tests:', JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Erreur lors de l\'exécution des tests:', error);
  }
}

runTests();
