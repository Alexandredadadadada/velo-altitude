/**
 * Script de test des fonctionnalités de l'application Grand Est Cyclisme
 * Ce script vérifie que toutes les fonctionnalités principales fonctionnent correctement
 * avec les clés API configurées
 */

const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config({ path: path.resolve(__dirname, '../.env.production') });

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const REPORT_PATH = path.resolve(__dirname, '../application-features-test-report.html');

// Fonctionnalités à tester
const FEATURES = [
  {
    name: 'Visualisation des cols',
    endpoints: [
      { url: '/api/cols', method: 'GET', description: 'Liste des cols' },
      { url: '/api/cols/1', method: 'GET', description: 'Détails d\'un col' },
      { url: '/api/cols/1/segments', method: 'GET', description: 'Segments d\'un col' },
      { url: '/api/cols/1/weather', method: 'GET', description: 'Météo d\'un col' },
      { url: '/api/cols/1/routes', method: 'GET', description: 'Itinéraires passant par un col' },
      { url: '/api/cols/1/similar', method: 'GET', description: 'Cols similaires' }
    ],
    dependencies: ['MAPBOX_PUBLIC_TOKEN', 'OPENWEATHER_API_KEY']
  },
  {
    name: 'Planification d\'itinéraires',
    endpoints: [
      { url: '/api/routes', method: 'GET', description: 'Liste des itinéraires' },
      { url: '/api/routes/calculate', method: 'POST', description: 'Calcul d\'itinéraire', 
        data: { start: [4.8357, 48.8640], end: [4.9357, 48.9640], profile: 'cycling-regular' } }
    ],
    dependencies: ['MAPBOX_PUBLIC_TOKEN', 'OPENROUTE_API_KEY']
  },
  {
    name: 'Prévisions météo',
    endpoints: [
      { url: '/api/weather/forecast?lat=48.8640&lon=4.8357', method: 'GET', description: 'Prévisions météo' },
      { url: '/api/weather/cycling-conditions?lat=48.8640&lon=4.8357', method: 'GET', description: 'Conditions cyclistes' }
    ],
    dependencies: ['OPENWEATHER_API_KEY']
  },
  {
    name: 'Intégration Strava',
    endpoints: [
      { url: '/api/strava/auth-url', method: 'GET', description: 'URL d\'authentification Strava' }
    ],
    dependencies: ['STRAVA_CLIENT_ID', 'STRAVA_CLIENT_SECRET', 'STRAVA_REDIRECT_URI']
  },
  {
    name: 'Coach virtuel',
    endpoints: [
      { url: '/api/coach/suggestions', method: 'GET', description: 'Suggestions du coach' }
    ],
    dependencies: ['OPENAI_API_KEY', 'CLAUDE_API_KEY']
  },
  {
    name: 'Cache Redis',
    endpoints: [
      { url: '/api/system/cache-status', method: 'GET', description: 'Statut du cache' }
    ],
    dependencies: ['REDIS_HOST', 'REDIS_PORT', 'REDIS_PASSWORD']
  }
];

// Fonction pour tester un endpoint
async function testEndpoint(endpoint, baseUrl) {
  try {
    const url = `${baseUrl}${endpoint.url}`;
    console.log(chalk.blue(`Testing ${endpoint.method} ${url}`));
    
    const response = await axios({
      method: endpoint.method,
      url,
      data: endpoint.data || {},
      timeout: 10000,
      validateStatus: () => true // Ne pas rejeter les réponses avec des codes d'erreur
    });
    
    const success = response.status >= 200 && response.status < 300;
    
    return {
      url: endpoint.url,
      method: endpoint.method,
      description: endpoint.description,
      status: response.status,
      success,
      error: success ? null : (response.data?.message || 'Erreur inconnue')
    };
  } catch (error) {
    return {
      url: endpoint.url,
      method: endpoint.method,
      description: endpoint.description,
      status: null,
      success: false,
      error: error.message
    };
  }
}

// Fonction pour tester une fonctionnalité
async function testFeature(feature, baseUrl) {
  console.log(chalk.yellow.bold(`\nTesting feature: ${feature.name}`));
  
  // Vérifier les dépendances
  const missingDependencies = feature.dependencies.filter(dep => !process.env[dep]);
  
  if (missingDependencies.length > 0) {
    console.log(chalk.red(`❌ Missing dependencies: ${missingDependencies.join(', ')}`));
    
    return {
      name: feature.name,
      success: false,
      missingDependencies,
      endpoints: feature.endpoints.map(endpoint => ({
        url: endpoint.url,
        method: endpoint.method,
        description: endpoint.description,
        status: null,
        success: false,
        error: `Missing dependencies: ${missingDependencies.join(', ')}`
      }))
    };
  }
  
  // Tester les endpoints
  const endpointResults = await Promise.all(
    feature.endpoints.map(endpoint => testEndpoint(endpoint, baseUrl))
  );
  
  const success = endpointResults.every(result => result.success);
  
  if (success) {
    console.log(chalk.green(`✓ Feature ${feature.name} is working correctly`));
  } else {
    console.log(chalk.red(`❌ Feature ${feature.name} has issues`));
    endpointResults.filter(result => !result.success).forEach(result => {
      console.log(chalk.red(`  - ${result.method} ${result.url}: ${result.error}`));
    });
  }
  
  return {
    name: feature.name,
    success,
    missingDependencies: [],
    endpoints: endpointResults
  };
}

// Fonction pour générer un rapport HTML
function generateHtmlReport(results) {
  const totalFeatures = results.length;
  const successfulFeatures = results.filter(result => result.success).length;
  const failedFeatures = totalFeatures - successfulFeatures;
  
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport de test des fonctionnalités - Grand Est Cyclisme</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3 {
      color: #2c3e50;
    }
    h1 {
      border-bottom: 2px solid #3498db;
      padding-bottom: 10px;
    }
    .summary {
      display: flex;
      justify-content: space-between;
      margin: 20px 0;
    }
    .summary-box {
      flex: 1;
      margin: 0 10px;
      padding: 15px;
      border-radius: 5px;
      text-align: center;
    }
    .summary-box h3 {
      margin-top: 0;
    }
    .success {
      background-color: #d5f5e3;
      color: #27ae60;
    }
    .error {
      background-color: #fadbd8;
      color: #c0392b;
    }
    .warning {
      background-color: #fef9e7;
      color: #f39c12;
    }
    .feature {
      margin-bottom: 30px;
      border: 1px solid #ddd;
      border-radius: 5px;
      overflow: hidden;
    }
    .feature-header {
      padding: 15px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .feature-header h2 {
      margin: 0;
      font-size: 18px;
    }
    .feature-content {
      padding: 0 15px 15px;
    }
    .endpoint {
      margin-bottom: 10px;
      padding: 10px;
      border-radius: 5px;
      background-color: #f8f9fa;
    }
    .endpoint-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    .endpoint-url {
      font-family: monospace;
      font-weight: bold;
    }
    .endpoint-method {
      font-family: monospace;
      padding: 2px 6px;
      border-radius: 3px;
      background-color: #e9ecef;
    }
    .status-code {
      font-family: monospace;
      padding: 2px 6px;
      border-radius: 3px;
    }
    .status-2xx {
      background-color: #d5f5e3;
      color: #27ae60;
    }
    .status-4xx, .status-5xx {
      background-color: #fadbd8;
      color: #c0392b;
    }
    .status-unknown {
      background-color: #f8f9fa;
      color: #7f8c8d;
    }
    .error-message {
      margin-top: 5px;
      padding: 5px 10px;
      background-color: #fadbd8;
      border-left: 3px solid #c0392b;
      color: #c0392b;
    }
    .timestamp {
      margin-top: 30px;
      color: #7f8c8d;
      font-size: 0.9em;
      text-align: center;
    }
  </style>
</head>
<body>
  <h1>Rapport de test des fonctionnalités - Grand Est Cyclisme</h1>
  
  <div class="summary">
    <div class="summary-box ${successfulFeatures === totalFeatures ? 'success' : (successfulFeatures === 0 ? 'error' : 'warning')}">
      <h3>Résumé</h3>
      <p>${successfulFeatures} / ${totalFeatures} fonctionnalités opérationnelles</p>
    </div>
  </div>
  
  ${results.map(feature => `
  <div class="feature">
    <div class="feature-header ${feature.success ? 'success' : 'error'}">
      <h2>${feature.name}</h2>
      <span>${feature.success ? '✓ Fonctionnel' : '✗ Non fonctionnel'}</span>
    </div>
    
    <div class="feature-content">
      ${feature.missingDependencies.length > 0 ? `
      <div class="error-message">
        <strong>Dépendances manquantes:</strong> ${feature.missingDependencies.join(', ')}
      </div>
      ` : ''}
      
      <h3>Endpoints testés:</h3>
      
      ${feature.endpoints.map(endpoint => `
      <div class="endpoint">
        <div class="endpoint-header">
          <span class="endpoint-method">${endpoint.method}</span>
          <span class="endpoint-url">${endpoint.url}</span>
          <span class="status-code status-${endpoint.status ? (Math.floor(endpoint.status / 100) + 'xx') : 'unknown'}">
            ${endpoint.status || 'N/A'}
          </span>
        </div>
        <div>${endpoint.description}</div>
        ${endpoint.error ? `<div class="error-message">${endpoint.error}</div>` : ''}
      </div>
      `).join('')}
    </div>
  </div>
  `).join('')}
  
  <div class="timestamp">
    Rapport généré le ${new Date().toLocaleString('fr-FR')}
  </div>
</body>
</html>`;
}

// Fonction principale
async function main() {
  console.log(chalk.blue.bold('=== Test des fonctionnalités de Grand Est Cyclisme ===\n'));
  
  // Tester toutes les fonctionnalités
  const results = [];
  
  for (const feature of FEATURES) {
    const result = await testFeature(feature, API_BASE_URL);
    results.push(result);
  }
  
  // Générer le rapport HTML
  const htmlReport = generateHtmlReport(results);
  
  // Enregistrer le rapport
  fs.writeFileSync(REPORT_PATH, htmlReport);
  console.log(chalk.blue(`\nRapport HTML généré: ${REPORT_PATH}`));
  
  // Résumé
  const successfulFeatures = results.filter(result => result.success).length;
  const totalFeatures = results.length;
  
  console.log(chalk.blue.bold('\n=== Résumé ==='));
  console.log(`${successfulFeatures} / ${totalFeatures} fonctionnalités opérationnelles`);
  
  if (successfulFeatures === totalFeatures) {
    console.log(chalk.green.bold('✓ Toutes les fonctionnalités sont opérationnelles'));
    process.exit(0);
  } else {
    console.log(chalk.yellow.bold('⚠️ Certaines fonctionnalités ne sont pas opérationnelles'));
    process.exit(1);
  }
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(chalk.red(`Erreur lors de l'exécution du script: ${error.message}`));
  process.exit(1);
});
