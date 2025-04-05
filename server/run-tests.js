/**
 * Script pour exécuter les tests du système de revues et de recommandations
 * 
 * Ce script permet d'exécuter spécifiquement les tests pour les fonctionnalités
 * de revues, modération et recommandations.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const TEST_FILES = [
  'route-review.controller.test.js',
  'review-moderation.test.js',
  'route-recommendation.test.js'
];

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Exécute un test spécifique
 * @param {string} testFile - Nom du fichier de test
 * @returns {Object} Résultat du test
 */
function runTest(testFile) {
  console.log(`${colors.bright}${colors.blue}Exécution du test: ${colors.cyan}${testFile}${colors.reset}`);
  
  const testPath = path.join(__dirname, 'tests', testFile);
  
  // Vérifier que le fichier existe
  if (!fs.existsSync(testPath)) {
    console.error(`${colors.red}Erreur: Le fichier de test ${testFile} n'existe pas${colors.reset}`);
    return { success: false, error: 'Fichier non trouvé' };
  }
  
  try {
    // Exécuter le test avec Jest
    const output = execSync(`npx jest ${testPath} --verbose`, { encoding: 'utf8' });
    return { success: true, output };
  } catch (error) {
    return { 
      success: false, 
      output: error.stdout,
      error: error.stderr || error.message
    };
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log(`${colors.bright}${colors.green}=== Tests du système de revues et de recommandations ===${colors.reset}\n`);
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const testFile of TEST_FILES) {
    const result = runTest(testFile);
    
    if (result.success) {
      console.log(`${colors.green}✓ Test réussi: ${testFile}${colors.reset}`);
      successCount++;
    } else {
      console.log(`${colors.red}✗ Test échoué: ${testFile}${colors.reset}`);
      console.error(`${colors.red}${result.error}${colors.reset}`);
      failureCount++;
    }
    
    console.log(result.output);
    console.log('\n' + '-'.repeat(80) + '\n');
  }
  
  // Afficher le résumé
  console.log(`${colors.bright}=== Résumé des tests ===${colors.reset}`);
  console.log(`${colors.green}Tests réussis: ${successCount}${colors.reset}`);
  console.log(`${colors.red}Tests échoués: ${failureCount}${colors.reset}`);
  
  if (failureCount === 0) {
    console.log(`\n${colors.bright}${colors.green}Tous les tests ont réussi! Le système est prêt pour l'intégration avec l'interface utilisateur.${colors.reset}`);
  } else {
    console.log(`\n${colors.bright}${colors.yellow}Certains tests ont échoué. Veuillez corriger les erreurs avant de continuer.${colors.reset}`);
  }
}

// Exécuter le script
main().catch(error => {
  console.error(`${colors.red}Erreur lors de l'exécution des tests: ${error.message}${colors.reset}`);
  process.exit(1);
});
