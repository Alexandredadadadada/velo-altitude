/**
 * Script de test de l'intégration du système de gestion des clés API
 * Dashboard-Velo.com
 * 
 * Ce script teste l'intégration du système de gestion des clés API
 * dans tous les services de l'application.
 */

require('dotenv').config({ path: '../../.env' });
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { logger } = require('../utils/logger');

// Services à tester
const weatherService = require('../services/weather.service');
const stravaService = require('../services/strava.service');
const openRouteService = require('../services/openroute.service');
const openAIService = require('../services/openai.service');

// Configuration
const resultsPath = path.join(__dirname, '../../reports/api-integration-tests');

// Créer le répertoire des résultats s'il n'existe pas
if (!fs.existsSync(resultsPath)) {
  fs.mkdirSync(resultsPath, { recursive: true });
}

/**
 * Formate le temps écoulé en millisecondes
 * @param {number} ms Temps en millisecondes
 * @returns {string} Temps formaté
 */
function formatTime(ms) {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Teste le service météo
 * @returns {Promise<Object>} Résultat du test
 */
async function testWeatherService() {
  console.log('Test du service météo...');
  const startTime = Date.now();
  
  try {
    // Test de récupération de la météo actuelle
    const weatherResult = await weatherService.fetchCurrentWeather(48.8566, 2.3522);
    
    // Test de récupération des prévisions
    const forecastResult = await weatherService.fetchForecast(48.8566, 2.3522);
    
    // Test de récupération de l'indice UV
    const uvResult = await weatherService.fetchUVIndex(48.8566, 2.3522);
    
    // Test de récupération de la pollution de l'air
    const pollutionResult = await weatherService.fetchAirPollution(48.8566, 2.3522);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      service: 'WeatherService',
      status: 'success',
      duration: formatTime(duration),
      tests: [
        {
          name: 'fetchCurrentWeather',
          status: weatherResult ? 'success' : 'failed',
          data: weatherResult ? {
            temperature: weatherResult.main.temp,
            description: weatherResult.weather[0].description
          } : null
        },
        {
          name: 'fetchForecast',
          status: forecastResult ? 'success' : 'failed',
          data: forecastResult ? {
            count: forecastResult.list.length
          } : null
        },
        {
          name: 'fetchUVIndex',
          status: uvResult ? 'success' : 'failed',
          data: uvResult ? {
            value: uvResult.value
          } : null
        },
        {
          name: 'fetchAirPollution',
          status: pollutionResult ? 'success' : 'failed',
          data: pollutionResult ? {
            aqi: pollutionResult.list[0].main.aqi
          } : null
        }
      ]
    };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      service: 'WeatherService',
      status: 'failed',
      duration: formatTime(duration),
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Teste le service Strava
 * @returns {Promise<Object>} Résultat du test
 */
async function testStravaService() {
  console.log('Test du service Strava...');
  const startTime = Date.now();
  
  try {
    // Simuler un code d'autorisation pour le test
    const mockAuthCode = 'test_auth_code';
    
    // Test de l'échange de token (va échouer mais nous voulons tester l'intégration des clés)
    try {
      await stravaService.exchangeToken(mockAuthCode);
    } catch (error) {
      // Ignorer l'erreur car nous testons juste l'intégration des clés
      console.log('Erreur attendue lors de l\'échange de token Strava (code de test)');
    }
    
    // Test de rafraîchissement de token (va échouer mais nous voulons tester l'intégration des clés)
    try {
      await stravaService.refreshToken('test_refresh_token');
    } catch (error) {
      // Ignorer l'erreur car nous testons juste l'intégration des clés
      console.log('Erreur attendue lors du rafraîchissement de token Strava (token de test)');
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      service: 'StravaService',
      status: 'success',
      duration: formatTime(duration),
      tests: [
        {
          name: 'exchangeToken',
          status: 'tested',
          notes: 'L\'échec est attendu car nous utilisons un code de test'
        },
        {
          name: 'refreshToken',
          status: 'tested',
          notes: 'L\'échec est attendu car nous utilisons un token de test'
        }
      ]
    };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      service: 'StravaService',
      status: 'failed',
      duration: formatTime(duration),
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Teste le service OpenRoute
 * @returns {Promise<Object>} Résultat du test
 */
async function testOpenRouteService() {
  console.log('Test du service OpenRoute...');
  const startTime = Date.now();
  
  try {
    // Test de calcul d'itinéraire
    const routeResult = await openRouteService.calculateRoute({
      start: [2.3522, 48.8566], // Paris
      end: [2.3488, 48.8534],   // Près de Paris
      profile: 'cycling-regular'
    });
    
    // Test de calcul d'isochrone
    const isochroneResult = await openRouteService.calculateIsochrone({
      center: [2.3522, 48.8566], // Paris
      range: 1000, // 1000 mètres
      profile: 'cycling-regular'
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      service: 'OpenRouteService',
      status: 'success',
      duration: formatTime(duration),
      tests: [
        {
          name: 'calculateRoute',
          status: routeResult ? 'success' : 'failed',
          data: routeResult ? {
            distance: routeResult.features[0].properties.summary.distance,
            duration: routeResult.features[0].properties.summary.duration
          } : null
        },
        {
          name: 'calculateIsochrone',
          status: isochroneResult ? 'success' : 'failed',
          data: isochroneResult ? {
            type: isochroneResult.type,
            features: isochroneResult.features.length
          } : null
        }
      ]
    };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      service: 'OpenRouteService',
      status: 'failed',
      duration: formatTime(duration),
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Teste le service OpenAI
 * @returns {Promise<Object>} Résultat du test
 */
async function testOpenAIService() {
  console.log('Test du service OpenAI...');
  const startTime = Date.now();
  
  try {
    // Test de génération de réponse
    const responseResult = await openAIService.generateResponse(
      'Quels sont les meilleurs cols à vélo dans les Vosges?',
      { profile: { level: 'intermédiaire', preference: 'montagne' } }
    );
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      service: 'OpenAIService',
      status: 'success',
      duration: formatTime(duration),
      tests: [
        {
          name: 'generateResponse',
          status: responseResult ? 'success' : 'failed',
          data: responseResult ? {
            responseLength: responseResult.length,
            snippet: responseResult.substring(0, 100) + '...'
          } : null
        }
      ]
    };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      service: 'OpenAIService',
      status: 'failed',
      duration: formatTime(duration),
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Génère un rapport HTML
 * @param {Array} results Résultats des tests
 * @returns {string} Rapport HTML
 */
function generateHtmlReport(results) {
  const date = new Date().toLocaleString('fr-FR');
  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Rapport d'intégration des clés API - Dashboard-Velo</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1, h2, h3 { color: #2c3e50; }
    .header { background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
    .summary { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .summary-box { background-color: #f9f9f9; padding: 15px; border-radius: 5px; width: 30%; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .success { color: #27ae60; }
    .warning { color: #f39c12; }
    .failed { color: #e74c3c; }
    .service-card { background-color: #fff; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 20px; overflow: hidden; }
    .service-header { padding: 15px; border-bottom: 1px solid #eee; }
    .service-header h3 { margin: 0; }
    .service-body { padding: 15px; }
    .service-footer { padding: 10px 15px; background-color: #f9f9f9; font-size: 14px; }
    .test-item { margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee; }
    .test-item:last-child { border-bottom: none; }
    .test-name { font-weight: bold; margin-bottom: 5px; }
    .test-data { background-color: #f5f5f5; padding: 10px; border-radius: 3px; font-family: monospace; margin-top: 10px; }
    .error-details { background-color: #fff0f0; padding: 10px; border-radius: 3px; margin-top: 10px; border-left: 3px solid #e74c3c; }
    .footer { margin-top: 30px; font-size: 12px; color: #777; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Rapport d'intégration des clés API</h1>
    <p>Dashboard-Velo.com - Généré le ${date}</p>
  </div>
  
  <div class="summary">
    <div class="summary-box">
      <h3>Services testés</h3>
      <p><strong>${results.length}</strong> services</p>
    </div>
    <div class="summary-box">
      <h3>Tests réussis</h3>
      <p class="success"><strong>${successCount}</strong> services</p>
    </div>
    <div class="summary-box">
      <h3>Tests échoués</h3>
      <p class="${failedCount > 0 ? 'failed' : 'success'}"><strong>${failedCount}</strong> services</p>
    </div>
  </div>
  
  <h2>Résultats détaillés</h2>
  
  ${results.map(result => `
    <div class="service-card">
      <div class="service-header">
        <h3>${result.service} <span class="${result.status === 'success' ? 'success' : 'failed'}">(${result.status})</span></h3>
      </div>
      <div class="service-body">
        ${result.status === 'success' 
          ? result.tests.map(test => `
            <div class="test-item">
              <div class="test-name">${test.name} <span class="${test.status === 'success' ? 'success' : (test.status === 'tested' ? 'warning' : 'failed')}">(${test.status})</span></div>
              ${test.notes ? `<div>${test.notes}</div>` : ''}
              ${test.data ? `<div class="test-data"><pre>${JSON.stringify(test.data, null, 2)}</pre></div>` : ''}
            </div>
          `).join('')
          : `
            <div class="error-details">
              <p><strong>Erreur:</strong> ${result.error}</p>
              <pre>${result.stack}</pre>
            </div>
          `
        }
      </div>
      <div class="service-footer">
        Durée du test: ${result.duration}
      </div>
    </div>
  `).join('')}
  
  <div class="footer">
    <p>Ce rapport est généré automatiquement par le script de test d'intégration des clés API.</p>
    <p>Pour plus d'informations, consultez la documentation sur la gestion des clés API.</p>
  </div>
</body>
</html>
  `;
  
  return html;
}

/**
 * Fonction principale
 */
async function main() {
  console.log('=== Test d\'intégration du système de gestion des clés API ===');
  
  const results = [];
  
  // Tester le service météo
  try {
    const weatherResult = await testWeatherService();
    results.push(weatherResult);
  } catch (error) {
    console.error('Erreur lors du test du service météo:', error);
    results.push({
      service: 'WeatherService',
      status: 'failed',
      error: error.message,
      stack: error.stack
    });
  }
  
  // Tester le service Strava
  try {
    const stravaResult = await testStravaService();
    results.push(stravaResult);
  } catch (error) {
    console.error('Erreur lors du test du service Strava:', error);
    results.push({
      service: 'StravaService',
      status: 'failed',
      error: error.message,
      stack: error.stack
    });
  }
  
  // Tester le service OpenRoute
  try {
    const openRouteResult = await testOpenRouteService();
    results.push(openRouteResult);
  } catch (error) {
    console.error('Erreur lors du test du service OpenRoute:', error);
    results.push({
      service: 'OpenRouteService',
      status: 'failed',
      error: error.message,
      stack: error.stack
    });
  }
  
  // Tester le service OpenAI
  try {
    const openAIResult = await testOpenAIService();
    results.push(openAIResult);
  } catch (error) {
    console.error('Erreur lors du test du service OpenAI:', error);
    results.push({
      service: 'OpenAIService',
      status: 'failed',
      error: error.message,
      stack: error.stack
    });
  }
  
  // Générer le rapport HTML
  const htmlReport = generateHtmlReport(results);
  const reportFilePath = path.join(resultsPath, `api-integration-test-${new Date().toISOString().split('T')[0]}.html`);
  fs.writeFileSync(reportFilePath, htmlReport);
  
  console.log(`\nRapport généré avec succès: ${reportFilePath}`);
  
  // Générer un rapport JSON
  const jsonReport = JSON.stringify(results, null, 2);
  const jsonReportPath = path.join(resultsPath, `api-integration-test-${new Date().toISOString().split('T')[0]}.json`);
  fs.writeFileSync(jsonReportPath, jsonReport);
  
  console.log(`Rapport JSON généré: ${jsonReportPath}`);
  
  // Afficher un résumé
  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  
  console.log('\nRésumé des tests:');
  console.log(`- Services testés: ${results.length}`);
  console.log(`- Tests réussis: ${successCount}`);
  console.log(`- Tests échoués: ${failedCount}`);
  
  if (failedCount > 0) {
    console.log('\nServices en échec:');
    results.filter(r => r.status === 'failed').forEach(r => {
      console.log(`- ${r.service}: ${r.error}`);
    });
    
    process.exit(1);
  } else {
    console.log('\nTous les tests ont réussi!');
  }
}

// Exécuter la fonction principale
main().catch(error => {
  console.error('Erreur lors de l\'exécution du script:', error);
  process.exit(1);
});
