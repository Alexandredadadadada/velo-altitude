/**
 * Diagnostic des clés API
 * 
 * Ce script vérifie si toutes les clés API sont valides et fonctionnent correctement.
 * Il teste chaque service API et affiche un rapport détaillé sur l'état des clés.
 * 
 * Dashboard-Velo.com
 */

const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');
const { logger } = require('../utils/logger');

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Importer les services
const apiServices = require('../services/apiServices');

// Configuration pour les tests
const API_TESTS = {
  openRouteService: {
    name: 'OpenRoute Service',
    testUrl: 'https://api.openrouteservice.org/v2/health',
    testFunction: async (key) => {
      try {
        const response = await axios.get('https://api.openrouteservice.org/v2/health', {
          headers: {
            'Authorization': key
          }
        });
        return { valid: response.status === 200, details: response.data };
      } catch (error) {
        return { 
          valid: false, 
          details: {
            status: error.response?.status,
            message: error.response?.data?.error?.message || error.message
          }
        };
      }
    }
  },
  strava: {
    name: 'Strava API',
    testUrl: 'https://www.strava.com/api/v3/athlete',
    testFunction: async (key) => {
      try {
        // Pour Strava, nous avons besoin d'un token d'accès, pas directement la clé API
        // Ceci est une vérification simplifiée
        if (!key || key.length < 10) {
          return { valid: false, details: { message: 'Clé API trop courte ou non définie' } };
        }
        return { valid: true, details: { message: 'Clé API présente, mais nécessite un flux OAuth complet pour validation' } };
      } catch (error) {
        return { 
          valid: false, 
          details: {
            message: error.message
          }
        };
      }
    }
  },
  weatherService: {
    name: 'OpenWeather API',
    testUrl: 'https://api.openweathermap.org/data/2.5/weather',
    testFunction: async (key) => {
      try {
        const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=Paris&appid=${key}`);
        return { valid: response.status === 200, details: { city: response.data.name } };
      } catch (error) {
        return { 
          valid: false, 
          details: {
            status: error.response?.status,
            message: error.response?.data?.message || error.message
          }
        };
      }
    }
  },
  mapbox: {
    name: 'Mapbox API',
    testUrl: 'https://api.mapbox.com/geocoding/v5/mapbox.places/Paris.json',
    testFunction: async (key) => {
      try {
        const response = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/Paris.json?access_token=${key}`);
        return { valid: response.status === 200, details: { features: response.data.features.length } };
      } catch (error) {
        return { 
          valid: false, 
          details: {
            status: error.response?.status,
            message: error.response?.data?.message || error.message
          }
        };
      }
    }
  },
  openai: {
    name: 'OpenAI API',
    testUrl: 'https://api.openai.com/v1/models',
    testFunction: async (key) => {
      try {
        const response = await axios.get('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${key}`
          }
        });
        return { valid: response.status === 200, details: { models: response.data.data.length } };
      } catch (error) {
        return { 
          valid: false, 
          details: {
            status: error.response?.status,
            message: error.response?.data?.error?.message || error.message
          }
        };
      }
    }
  }
};

/**
 * Fonction principale de diagnostic
 */
async function runDiagnostic() {
  logger.info('Démarrage du diagnostic des clés API');
  
  const results = {
    timestamp: new Date().toISOString(),
    services: {},
    summary: {
      total: 0,
      valid: 0,
      invalid: 0
    }
  };
  
  try {
    // Vérifier que le gestionnaire est bien initialisé
    if (!apiServices.manager) {
      logger.warn('Le gestionnaire de clés API amélioré n\'est pas disponible, utilisation du mode de compatibilité');
    }
    
    // Tester chaque service
    for (const [serviceName, serviceConfig] of Object.entries(API_TESTS)) {
      logger.info(`Test du service ${serviceConfig.name}...`);
      results.summary.total++;
      
      try {
        // Récupérer la clé API
        let apiKey;
        try {
          apiKey = await apiServices[serviceName].getKey();
          logger.info(`Clé API récupérée pour ${serviceConfig.name}`);
        } catch (error) {
          logger.error(`Erreur lors de la récupération de la clé API pour ${serviceConfig.name}`, {
            error: error.message
          });
          
          results.services[serviceName] = {
            name: serviceConfig.name,
            status: 'ERROR',
            message: `Erreur lors de la récupération de la clé API: ${error.message}`,
            valid: false
          };
          
          results.summary.invalid++;
          continue;
        }
        
        // Tester la clé API
        logger.info(`Test de la clé API pour ${serviceConfig.name}...`);
        const testResult = await serviceConfig.testFunction(apiKey);
        
        if (testResult.valid) {
          logger.info(`La clé API pour ${serviceConfig.name} est valide`);
          results.services[serviceName] = {
            name: serviceConfig.name,
            status: 'OK',
            message: 'Clé API valide',
            valid: true,
            details: testResult.details
          };
          
          results.summary.valid++;
        } else {
          logger.warn(`La clé API pour ${serviceConfig.name} n'est pas valide`, {
            details: testResult.details
          });
          
          results.services[serviceName] = {
            name: serviceConfig.name,
            status: 'INVALID',
            message: 'Clé API invalide',
            valid: false,
            details: testResult.details
          };
          
          results.summary.invalid++;
        }
      } catch (error) {
        logger.error(`Erreur lors du test du service ${serviceConfig.name}`, {
          error: error.message
        });
        
        results.services[serviceName] = {
          name: serviceConfig.name,
          status: 'ERROR',
          message: `Erreur lors du test: ${error.message}`,
          valid: false
        };
        
        results.summary.invalid++;
      }
    }
    
    // Afficher le rapport
    logger.info('Diagnostic des clés API terminé');
    console.log('\n==== RAPPORT DE DIAGNOSTIC DES CLÉS API ====');
    console.log(`Date: ${results.timestamp}`);
    console.log(`Total des services: ${results.summary.total}`);
    console.log(`Services valides: ${results.summary.valid}`);
    console.log(`Services invalides: ${results.summary.invalid}`);
    console.log('\nDétails par service:');
    
    for (const [serviceName, serviceResult] of Object.entries(results.services)) {
      console.log(`\n${serviceResult.name} (${serviceName}):`);
      console.log(`  Status: ${serviceResult.status}`);
      console.log(`  Message: ${serviceResult.message}`);
      
      if (serviceResult.details) {
        console.log('  Détails:');
        console.log(JSON.stringify(serviceResult.details, null, 2).split('\n').map(line => `    ${line}`).join('\n'));
      }
    }
    
    console.log('\n=========================================');
    
    return results;
  } catch (error) {
    logger.error('Erreur lors du diagnostic des clés API', {
      error: error.message,
      stack: error.stack
    });
    
    throw error;
  }
}

// Exécuter le diagnostic
if (require.main === module) {
  runDiagnostic().then(() => {
    process.exit(0);
  }).catch(error => {
    logger.error('Erreur non gérée', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  });
}

module.exports = {
  runDiagnostic
};
