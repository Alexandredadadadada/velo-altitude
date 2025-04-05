/**
 * Script pour exécuter le gestionnaire de clés API
 * Ce script vérifie toutes les clés API et génère un rapport détaillé
 */

const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const ApiKeysManager = require('../server/utils/api-keys-manager');

// Chemin vers le fichier .env.production
const envPath = path.resolve(__dirname, '../.env.production');

// Fonction principale
async function main() {
  console.log(chalk.blue.bold('=== Vérification du gestionnaire de clés API ===\n'));
  
  try {
    // Vérifier que le fichier .env.production existe
    if (!fs.existsSync(envPath)) {
      console.error(chalk.red(`Le fichier .env.production n'existe pas: ${envPath}`));
      process.exit(1);
    }
    
    // Initialiser le gestionnaire de clés API
    const apiKeysManager = new ApiKeysManager(envPath);
    
    // Valider toutes les clés API
    console.log(chalk.blue('Validation des clés API...'));
    const validationResults = await apiKeysManager.validateKeys();
    
    // Afficher les résultats
    let allValid = true;
    
    Object.entries(validationResults).forEach(([service, result]) => {
      if (result.valid) {
        console.log(chalk.green(`✓ ${service}: ${result.message}`));
      } else {
        allValid = false;
        console.log(chalk.red(`✗ ${service}: ${result.message}`));
      }
    });
    
    // Générer un rapport complet
    console.log(chalk.blue('\nGénération du rapport complet...'));
    const report = await apiKeysManager.generateApiKeysReport();
    
    // Enregistrer le rapport dans un fichier JSON
    const reportPath = path.resolve(__dirname, '../api-keys-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(chalk.green(`Rapport JSON enregistré: ${reportPath}`));
    
    // Afficher le résumé
    console.log(chalk.blue('\nRésumé:'));
    console.log(`Total des services: ${report.summary.totalServices}`);
    console.log(`Services valides: ${report.summary.validServices}`);
    console.log(`Services invalides: ${report.summary.invalidServices}`);
    
    // Sortir avec le code approprié
    if (allValid) {
      console.log(chalk.green.bold('\n✓ Toutes les clés API sont valides.'));
      process.exit(0);
    } else {
      console.log(chalk.yellow.bold('\n⚠️ Certaines clés API sont invalides ou manquantes.'));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red(`Erreur lors de l'exécution du gestionnaire de clés API: ${error.message}`));
    process.exit(1);
  }
}

// Exécuter la fonction principale
main();
