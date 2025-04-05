/**
 * Script de vérification de l'état de santé des clés API via les variables d'environnement
 * Dashboard-Velo.com
 */

require('dotenv').config({ path: '../../.env' });
const axios = require('axios');
const chalk = require('chalk') || { green: (text) => text, red: (text) => text, yellow: (text) => text, blue: (text) => text };
const { logger } = require('../utils/logger');

// Mapping des services vers les variables d'environnement
const serviceEnvMapping = {
  'openRouteService': ['OPENROUTE_API_KEY'],
  'strava': ['STRAVA_CLIENT_SECRET', 'STRAVA_CLIENT_ID', 'STRAVA_REFRESH_TOKEN'],
  'weatherService': ['OPENWEATHER_API_KEY'],
  'mapbox': ['MAPBOX_SECRET_TOKEN', 'MAPBOX_PUBLIC_TOKEN'],
  'openai': ['OPENAI_API_KEY'],
  'mongodb': ['MONGODB_URI']
};

// Services à vérifier
const services = [
  {
    name: 'openRouteService',
    testEndpoint: 'https://api.openrouteservice.org/v2/health',
    testParams: {},
    validateResponse: (data) => data && data.status === 'ready',
    envKey: 'OPENROUTE_API_KEY'
  },
  {
    name: 'weatherService',
    testEndpoint: 'https://api.openweathermap.org/data/2.5/weather',
    testParams: { lat: 48.8534, lon: 2.3488, appid: '{key}' },
    validateResponse: (data) => data && data.cod === 200,
    envKey: 'OPENWEATHER_API_KEY'
  },
  {
    name: 'mapbox',
    testEndpoint: 'https://api.mapbox.com/geocoding/v5/mapbox.places/Paris.json',
    testParams: { access_token: '{key}' },
    validateResponse: (data) => data && data.features && data.features.length > 0,
    envKey: 'MAPBOX_SECRET_TOKEN'
  }
];

/**
 * Vérifie l'état de santé d'une clé API
 * @param {Object} service Configuration du service
 * @param {string} key Clé API à tester
 * @returns {Promise<Object>} Résultat du test
 */
async function testApiKey(service, key) {
  try {
    const params = { ...service.testParams };
    
    // Remplacer le placeholder par la vraie clé
    Object.keys(params).forEach(paramKey => {
      if (params[paramKey] === '{key}') {
        params[paramKey] = key;
      }
    });
    
    const response = await axios.get(service.testEndpoint, { 
      params,
      timeout: 5000,
      validateStatus: () => true // Accepter tous les codes de statut
    });
    
    const isValid = service.validateResponse(response.data);
    
    return {
      status: isValid ? 'valid' : 'invalid',
      statusCode: response.status,
      message: isValid ? 'Clé valide' : 'Clé invalide',
      responseTime: response.headers['x-response-time'] || 'N/A',
      rateLimitRemaining: response.headers['x-ratelimit-remaining'] || 'N/A'
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    };
  }
}

/**
 * Vérifie l'état de santé d'un service en utilisant la clé API de l'environnement
 * @param {Object} service Configuration du service
 * @returns {Promise<Object>} Résultat des tests
 */
async function checkServiceHealth(service) {
  console.log(chalk.blue(`\n=== Vérification du service ${service.name} ===`));
  
  try {
    // Vérifier si la variable d'environnement existe
    const apiKey = process.env[service.envKey];
    if (!apiKey) {
      console.log(chalk.red(`❌ Variable d'environnement ${service.envKey} non définie pour ${service.name}`));
      return {
        service: service.name,
        status: 'missing',
        message: `Variable d'environnement ${service.envKey} non définie`
      };
    }
    
    console.log(chalk.green(`✓ Variable d'environnement ${service.envKey} trouvée`));
    
    // Tester la clé API
    process.stdout.write(`Test de la clé API: `);
    
    const result = await testApiKey(service, apiKey);
    
    if (result.status === 'valid') {
      console.log(chalk.green(`✅ Valide (${result.statusCode})`));
    } else if (result.status === 'invalid') {
      console.log(chalk.yellow(`⚠️ Invalide (${result.statusCode})`));
    } else {
      console.log(chalk.red(`❌ Erreur: ${result.message}`));
    }
    
    return {
      service: service.name,
      status: result.status === 'valid' ? 'healthy' : 'unhealthy',
      apiKeyValid: result.status === 'valid',
      envKey: service.envKey,
      result
    };
  } catch (error) {
    console.log(chalk.red(`❌ Erreur: ${error.message}`));
    return {
      service: service.name,
      status: 'error',
      message: error.message
    };
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log(chalk.blue('=== Vérification de l\'état de santé des clés API (via variables d\'environnement) ==='));
  
  // Vérifier chaque service
  const results = [];
  let missingKeys = [];
  
  for (const service of services) {
    const result = await checkServiceHealth(service);
    results.push(result);
    
    if (result.status === 'missing') {
      missingKeys.push(service.envKey);
    }
  }
  
  // Afficher le résumé
  console.log(chalk.blue('\n=== Résumé de l\'état de santé ==='));
  
  let allHealthy = true;
  for (const result of results) {
    let statusSymbol;
    let statusColor;
    
    if (result.status === 'healthy') {
      statusSymbol = '✅';
      statusColor = chalk.green;
    } else if (result.status === 'unhealthy') {
      statusSymbol = '⚠️';
      statusColor = chalk.yellow;
      allHealthy = false;
    } else {
      statusSymbol = '❌';
      statusColor = chalk.red;
      allHealthy = false;
    }
    
    console.log(`${statusSymbol} ${statusColor(result.service)}: ${statusColor(result.status)}`);
  }
  
  console.log(chalk.blue('\n=== Conclusion ==='));
  if (allHealthy) {
    console.log(chalk.green('✅ Tous les services sont en bonne santé'));
    console.log(chalk.green('✅ Le système est prêt à être utilisé'));
  } else {
    console.log(chalk.yellow('⚠️ Certains services présentent des problèmes'));
    
    if (missingKeys.length > 0) {
      console.log(chalk.red('\nVariables d\'environnement manquantes:'));
      missingKeys.forEach(key => {
        console.log(chalk.yellow(`  - ${key}`));
      });
      console.log('\nAssurez-vous de configurer ces variables dans votre fichier .env ou sur votre plateforme de déploiement (Netlify, Vercel, etc.)');
    }
  }
  
  console.log(chalk.blue('\nConseil: Pour déployer sur Netlify, configurez ces variables dans "Settings > Build & deploy > Environment variables"'));
}

// Exécuter la fonction principale
main().catch(error => {
  console.error('Erreur lors de l\'exécution du script:', error);
});
