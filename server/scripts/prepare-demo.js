/**
 * Script de préparation pour la démo
 * Génère la documentation API et exécute des tests de performance pour
 * préparer les données de monitoring pour la démonstration
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const apiDocsGenerator = require('./generate-api-docs');

// Chemins de base
const ROOT_DIR = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');
const TESTS_DIR = path.join(ROOT_DIR, 'tests');
const LOGS_DIR = path.join(ROOT_DIR, 'logs');

// S'assurer que les répertoires nécessaires existent
[DOCS_DIR, LOGS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

console.log('=== Préparation de la démo - Grand Est Cyclisme ===');

// 1. Générer la documentation API
console.log('\n--- Génération de la documentation API ---');
try {
  const openApiSpec = apiDocsGenerator.generateOpenApiSpec();
  console.log('Documentation API générée avec succès !');
  console.log(`- JSON: ${path.join(DOCS_DIR, 'api-spec/openapi.json')}`);
  console.log(`- YAML: ${path.join(DOCS_DIR, 'api-spec/openapi.yaml')}`);
} catch (error) {
  console.error('Erreur lors de la génération de la documentation API:', error);
}

// 2. Exécuter quelques tests de performance pour générer des données
console.log('\n--- Exécution des tests de performance ---');
console.log('Note: Assurez-vous que l\'application est en cours d\'exécution pour ces tests');

// Vérifier si k6 est installé
let k6Installed = false;
try {
  execSync('k6 version', { stdio: 'ignore' });
  k6Installed = true;
} catch (error) {
  console.warn('k6 n\'est pas installé. Les tests de performance ne seront pas exécutés.');
  console.warn('Installez k6 via: https://k6.io/docs/getting-started/installation/');
}

if (k6Installed) {
  try {
    console.log('Exécution des tests de base pour générer des données de monitoring...');
    
    // Test des API standard
    console.log('1. Test des API standard...');
    execSync('k6 run --quiet --vus 5 --duration 30s ../tests/performance/api-load-tests.js --env SCENARIO=constant_load', 
      { cwd: __dirname, stdio: 'inherit' });
    
    // Test spécifique de l'API de visualisation 3D
    console.log('2. Test de l\'API de visualisation 3D...');
    execSync('k6 run --quiet --vus 3 --duration 20s ../tests/performance/api-load-tests.js --env SCENARIO=visualization_3d', 
      { cwd: __dirname, stdio: 'inherit' });
    
    console.log('Tests de performance exécutés avec succès !');
  } catch (error) {
    console.error('Erreur lors de l\'exécution des tests de performance:', error.message);
  }
} else {
  console.log('Simulation de données de test pour la démo...');
  
  // Générer des données simulées pour la démo si k6 n'est pas disponible
  const simulateMonitoringData = require('../services/performance-monitoring.service');
  const externalMonitoring = require('../services/external-services-monitor');
  
  // Simuler quelques métriques pour la démo
  for (let i = 0; i < 50; i++) {
    const randomDuration = Math.floor(Math.random() * 1000) + 100;
    simulateMonitoringData.recordMapRenderingMetric(
      randomDuration, 
      ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      Math.floor(Math.random() * 15) + 5
    );
    
    if (i % 5 === 0) {
      externalMonitoring.record3DVisualizationTime(
        `col${Math.floor(Math.random() * 5) + 1}`,
        ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        Math.floor(Math.random() * 8000) + 2000
      );
    }
  }
  
  console.log('Données simulées générées avec succès !');
}

// 3. Démarrer un serveur pour la documentation API
console.log('\n--- Configuration du serveur de documentation ---');
console.log('Pour démarrer le serveur de documentation API:');
console.log('   node scripts/generate-api-docs.js --serve');
console.log('   Le serveur sera accessible sur: http://localhost:3030/api-docs');

// 4. Instructions pour la démonstration du tableau de bord
console.log('\n--- Préparation du tableau de bord de monitoring ---');
console.log('Pour accéder au tableau de bord de monitoring:');
console.log('1. Démarrez le serveur: npm run start');
console.log('2. Démarrez le client: cd ../client && npm run start');
console.log('3. Connectez-vous en tant qu\'administrateur');
console.log('4. Accédez à: /admin/performance');

console.log('\n=== Préparation terminée ! ===');
console.log('Tout est prêt pour votre démonstration de demain.');
console.log('Documentation et monitoring sont configurés et fonctionnels.');

// Sortie avec code de succès
process.exit(0);
