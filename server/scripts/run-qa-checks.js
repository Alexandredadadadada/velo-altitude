const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config();

/**
 * Script principal d'assurance qualité pour le Dashboard Cycliste Européen
 * Ce script exécute:
 * 1. L'audit des clés API
 * 2. Les tests d'intégration
 * 3. Une vérification de la validité des données JSON
 */

console.log('🚀 Démarrage des vérifications d\'assurance qualité...\n');

// Fonction pour exécuter une commande et afficher le résultat
function runCommand(command, label) {
  console.log(`\n📋 Exécution de: ${label}...`);
  try {
    const output = execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${label} terminé avec succès`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de l'exécution de ${label}:`);
    console.error(error.message);
    return false;
  }
}

// Fonction pour vérifier la validité des fichiers JSON
function validateJsonFiles() {
  console.log('\n📋 Vérification des fichiers JSON...');
  
  const dataDir = path.join(__dirname, '../data');
  const jsonFiles = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));
  
  let allValid = true;
  const results = {
    valid: [],
    invalid: []
  };
  
  for (const file of jsonFiles) {
    const filePath = path.join(dataDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      JSON.parse(content); // Tente de parser le JSON
      console.log(`✅ ${file} est valide`);
      results.valid.push(file);
    } catch (error) {
      console.error(`❌ ${file} est invalide: ${error.message}`);
      results.invalid.push({
        file,
        error: error.message
      });
      allValid = false;
    }
  }
  
  // Générer un rapport
  const reportPath = path.join(__dirname, '../json-validation-report.md');
  let reportContent = `# Rapport de validation JSON - ${new Date().toLocaleString()}\n\n`;
  
  reportContent += `## Fichiers JSON valides (${results.valid.length})\n\n`;
  if (results.valid.length > 0) {
    reportContent += `- ${results.valid.join('\n- ')}\n`;
  } else {
    reportContent += `Aucun fichier JSON valide trouvé.\n`;
  }
  
  reportContent += `\n## Fichiers JSON invalides (${results.invalid.length})\n\n`;
  if (results.invalid.length > 0) {
    reportContent += `| Fichier | Erreur |\n|--------|-------|\n`;
    results.invalid.forEach(item => {
      reportContent += `| ${item.file} | ${item.error} |\n`;
    });
  } else {
    reportContent += `Aucun fichier JSON invalide trouvé.\n`;
  }
  
  fs.writeFileSync(reportPath, reportContent);
  console.log(`📄 Rapport de validation JSON généré: ${reportPath}`);
  
  return allValid;
}

// Fonction principale
async function runQAChecks() {
  let success = true;
  
  // 1. Exécuter l'audit des clés API
  success = runCommand('node ./scripts/api-keys-audit.js', 'Audit des clés API') && success;
  
  // 2. Vérifier la validité des fichiers JSON
  success = validateJsonFiles() && success;
  
  // 3. Exécuter les tests d'intégration
  success = runCommand('npm test -- --testPathPattern=tests/integration', 'Tests d\'intégration') && success;
  
  // Rapport final
  console.log('\n===== RAPPORT FINAL =====');
  if (success) {
    console.log('✅ Toutes les vérifications ont été complétées avec succès!');
  } else {
    console.log('⚠️ Certaines vérifications ont échoué. Consultez les rapports détaillés.');
  }
  
  return success;
}

// Exécuter le script
runQAChecks().catch(error => {
  console.error('Erreur lors de l\'exécution des vérifications d\'assurance qualité:', error);
  process.exit(1);
});
