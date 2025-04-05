/**
 * Script de vérification des intégrations API externes
 * Vérifie que toutes les API externes sont correctement configurées
 * et fonctionnelles avant le déploiement
 */

require('dotenv').config();
const axios = require('axios');
const chalk = require('chalk');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const writeFileAsync = promisify(fs.writeFile);

// Configuration
const API_TESTS = [
  {
    name: 'Mapbox',
    envVars: ['MAPBOX_PUBLIC_TOKEN', 'MAPBOX_SECRET_TOKEN'],
    testUrl: `https://api.mapbox.com/geocoding/v5/mapbox.places/Paris.json?access_token=${process.env.MAPBOX_PUBLIC_TOKEN}`,
    expectedStatus: 200,
    validateResponse: (data) => data && data.features && data.features.length > 0
  },
  {
    name: 'OpenWeatherMap',
    envVars: ['OPENWEATHER_API_KEY'],
    testUrl: `https://api.openweathermap.org/data/2.5/weather?q=Paris&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`,
    expectedStatus: 200,
    validateResponse: (data) => data && data.main && data.weather
  },
  {
    name: 'OpenRouteService',
    envVars: ['OPENROUTE_API_KEY'],
    testUrl: `https://api.openrouteservice.org/v2/directions/cycling-regular?api_key=${process.env.OPENROUTE_API_KEY}&start=7.4979,43.7774&end=7.5068,43.7800`,
    expectedStatus: 200,
    validateResponse: (data) => data && data.features && data.features.length > 0
  },
  {
    name: 'Strava',
    envVars: ['STRAVA_CLIENT_ID', 'STRAVA_CLIENT_SECRET', 'STRAVA_REDIRECT_URI'],
    testUrl: `https://www.strava.com/oauth/authorize?client_id=${process.env.STRAVA_CLIENT_ID}&redirect_uri=${process.env.STRAVA_REDIRECT_URI}&response_type=code&scope=read,activity:read`,
    expectedStatus: 200,
    validateResponse: (data) => true, // Juste vérifier que l'URL est valide
    method: 'HEAD' // Utiliser HEAD au lieu de GET pour cette requête
  }
];

// Variables pour le rapport
let allTestsPassed = true;
const results = [];

/**
 * Vérifie les variables d'environnement
 * @param {Array} envVars - Liste des variables d'environnement à vérifier
 * @returns {Object} - Résultat de la vérification
 */
function checkEnvVars(envVars) {
  const missing = [];
  const empty = [];
  
  envVars.forEach(varName => {
    if (!(varName in process.env)) {
      missing.push(varName);
    } else if (!process.env[varName]) {
      empty.push(varName);
    }
  });
  
  return {
    success: missing.length === 0 && empty.length === 0,
    missing,
    empty
  };
}

/**
 * Teste une API externe
 * @param {Object} apiTest - Configuration du test d'API
 * @returns {Object} - Résultat du test
 */
async function testApi(apiTest) {
  const result = {
    name: apiTest.name,
    envCheck: checkEnvVars(apiTest.envVars),
    apiCheck: { success: false, error: null, response: null }
  };
  
  // Si les variables d'environnement ne sont pas correctement configurées, on ne teste pas l'API
  if (!result.envCheck.success) {
    return result;
  }
  
  try {
    const method = apiTest.method || 'GET';
    const response = await axios({
      method,
      url: apiTest.testUrl,
      timeout: 10000, // 10 secondes de timeout
      validateStatus: () => true // Ne pas rejeter les réponses avec des codes d'erreur
    });
    
    result.apiCheck.status = response.status;
    result.apiCheck.success = 
      response.status === apiTest.expectedStatus && 
      (method === 'HEAD' || apiTest.validateResponse(response.data));
    
    if (method !== 'HEAD') {
      result.apiCheck.response = response.data;
    }
  } catch (error) {
    result.apiCheck.success = false;
    result.apiCheck.error = error.message;
  }
  
  return result;
}

/**
 * Affiche les résultats des tests
 * @param {Array} results - Résultats des tests
 */
function displayResults(results) {
  console.log(chalk.bold('\n=== Résultats des tests d\'intégration API ===\n'));
  
  results.forEach(result => {
    // Déterminer le statut global du test
    const testPassed = result.envCheck.success && result.apiCheck.success;
    const statusIcon = testPassed ? chalk.green('✓') : chalk.red('✗');
    
    console.log(`${statusIcon} ${chalk.bold(result.name)}`);
    
    // Afficher les résultats de la vérification des variables d'environnement
    if (!result.envCheck.success) {
      if (result.envCheck.missing.length > 0) {
        console.log(chalk.red(`  Variables manquantes: ${result.envCheck.missing.join(', ')}`));
      }
      if (result.envCheck.empty.length > 0) {
        console.log(chalk.yellow(`  Variables vides: ${result.envCheck.empty.join(', ')}`));
      }
    }
    
    // Afficher les résultats du test d'API
    if (result.envCheck.success) {
      if (result.apiCheck.success) {
        console.log(chalk.green('  API accessible et fonctionnelle'));
      } else if (result.apiCheck.error) {
        console.log(chalk.red(`  Erreur lors du test d'API: ${result.apiCheck.error}`));
      } else if (result.apiCheck.status) {
        console.log(chalk.red(`  Code de statut inattendu: ${result.apiCheck.status} (attendu: ${apiTests.find(t => t.name === result.name).expectedStatus})`));
      }
    }
    
    console.log(''); // Ligne vide pour la lisibilité
  });
  
  // Afficher le résultat global
  if (allTestsPassed) {
    console.log(chalk.green.bold('✓ Toutes les intégrations API sont correctement configurées et fonctionnelles.'));
  } else {
    console.log(chalk.red.bold('✗ Certaines intégrations API ne sont pas correctement configurées ou ne sont pas fonctionnelles.'));
    console.log(chalk.yellow('  Veuillez corriger les problèmes avant de déployer l\'application.'));
  }
}

/**
 * Génère un rapport HTML des résultats
 * @param {Array} results - Résultats des tests
 * @returns {String} - Rapport HTML
 */
function generateHtmlReport(results) {
  const htmlReport = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport d'intégration API - Grand Est Cyclisme</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      color: #2c3e50;
      border-bottom: 2px solid #ecf0f1;
      padding-bottom: 10px;
    }
    .api-test {
      margin-bottom: 20px;
      padding: 15px;
      border-radius: 5px;
      border: 1px solid #ddd;
    }
    .success {
      border-left: 5px solid #2ecc71;
    }
    .failure {
      border-left: 5px solid #e74c3c;
    }
    .api-name {
      font-weight: bold;
      font-size: 1.2em;
      margin-bottom: 10px;
    }
    .success-icon {
      color: #2ecc71;
    }
    .failure-icon {
      color: #e74c3c;
    }
    .env-vars, .api-check {
      margin-top: 10px;
    }
    .env-var {
      font-family: monospace;
      background-color: #f8f9fa;
      padding: 2px 5px;
      border-radius: 3px;
    }
    .missing {
      color: #e74c3c;
    }
    .empty {
      color: #f39c12;
    }
    .summary {
      margin-top: 30px;
      padding: 15px;
      border-radius: 5px;
      font-weight: bold;
    }
    .summary.success {
      background-color: #d5f5e3;
      color: #27ae60;
    }
    .summary.failure {
      background-color: #fadbd8;
      color: #c0392b;
    }
    .timestamp {
      margin-top: 30px;
      color: #7f8c8d;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <h1>Rapport d'intégration API - Grand Est Cyclisme</h1>
  
  <div class="test-results">
    ${results.map(result => {
      const testPassed = result.envCheck.success && result.apiCheck.success;
      const statusClass = testPassed ? 'success' : 'failure';
      const statusIcon = testPassed ? '✓' : '✗';
      const statusIconClass = testPassed ? 'success-icon' : 'failure-icon';
      
      return `
        <div class="api-test ${statusClass}">
          <div class="api-name">
            <span class="${statusIconClass}">${statusIcon}</span> ${result.name}
          </div>
          
          <div class="env-vars">
            <strong>Variables d'environnement:</strong>
            ${result.envCheck.success 
              ? '<span class="success-icon">✓</span> Toutes les variables sont configurées' 
              : `
                ${result.envCheck.missing.length > 0 
                  ? `<div>Variables manquantes: ${result.envCheck.missing.map(v => `<span class="env-var missing">${v}</span>`).join(', ')}</div>` 
                  : ''}
                ${result.envCheck.empty.length > 0 
                  ? `<div>Variables vides: ${result.envCheck.empty.map(v => `<span class="env-var empty">${v}</span>`).join(', ')}</div>` 
                  : ''}
              `}
          </div>
          
          ${result.envCheck.success ? `
            <div class="api-check">
              <strong>Test d'API:</strong>
              ${result.apiCheck.success 
                ? '<span class="success-icon">✓</span> API accessible et fonctionnelle' 
                : `
                  <span class="failure-icon">✗</span> 
                  ${result.apiCheck.error 
                    ? `Erreur: ${result.apiCheck.error}` 
                    : `Code de statut: ${result.apiCheck.status} (attendu: ${API_TESTS.find(t => t.name === result.name).expectedStatus})`}
                `}
            </div>
          ` : ''}
        </div>
      `;
    }).join('')}
  </div>
  
  <div class="summary ${allTestsPassed ? 'success' : 'failure'}">
    ${allTestsPassed 
      ? '✓ Toutes les intégrations API sont correctement configurées et fonctionnelles.' 
      : '✗ Certaines intégrations API ne sont pas correctement configurées ou ne sont pas fonctionnelles.'}
  </div>
  
  <div class="timestamp">
    Rapport généré le ${new Date().toLocaleString('fr-FR')}
  </div>
</body>
</html>
  `;
  
  return htmlReport;
}

/**
 * Fonction principale
 */
async function main() {
  console.log(chalk.blue.bold('Vérification des intégrations API externes...'));
  
  // Exécuter les tests d'API en parallèle
  const testPromises = API_TESTS.map(testApi);
  const testResults = await Promise.all(testPromises);
  
  // Vérifier si tous les tests ont réussi
  allTestsPassed = testResults.every(result => result.envCheck.success && result.apiCheck.success);
  
  // Afficher les résultats
  displayResults(testResults);
  
  // Générer un rapport HTML
  const htmlReport = generateHtmlReport(testResults);
  const reportPath = path.join(__dirname, '..', 'api-integration-report.html');
  
  try {
    await writeFileAsync(reportPath, htmlReport);
    console.log(chalk.blue(`\nRapport HTML généré: ${reportPath}`));
  } catch (error) {
    console.error(chalk.red(`Erreur lors de la génération du rapport HTML: ${error.message}`));
  }
  
  // Sortir avec un code d'erreur si des tests ont échoué
  process.exit(allTestsPassed ? 0 : 1);
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(chalk.red(`Erreur lors de l'exécution des tests: ${error.message}`));
  process.exit(1);
});
