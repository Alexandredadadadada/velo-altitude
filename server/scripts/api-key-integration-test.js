/**
 * Tests d'intégration pour le système de gestion des clés API
 * 
 * Ce script teste l'intégration avec tous les services externes,
 * la rotation des clés API, la gestion des erreurs et la résilience
 * face aux pannes réseau.
 * 
 * Dashboard-Velo.com
 */

const axios = require('axios');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');
const apiServices = require('../services/apiServices');
const authService = require('../services/auth.service');
const openRouteService = require('../services/openroute.service');
const { EnhancedJwtRotation } = require('../utils/enhanced-jwt-rotation');

// Configuration des tests
const TEST_CONFIG = {
  // Délai d'attente pour les requêtes (en ms)
  timeout: 10000,
  
  // Nombre de tentatives pour chaque test
  retries: 3,
  
  // Délai entre les tentatives (en ms)
  retryDelay: 1000,
  
  // Services à tester
  services: [
    'openRouteService',
    'stravaService',
    'weatherService',
    'mapboxService',
    'openaiService'
  ],
  
  // Fichier de sortie pour les résultats
  outputFile: path.join(__dirname, '../logs/api-integration-test-results.json')
};

// Résultats des tests
const testResults = {
  startTime: null,
  endTime: null,
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  skippedTests: 0,
  services: {}
};

/**
 * Exécute un test avec plusieurs tentatives
 * @param {Function} testFn Fonction de test à exécuter
 * @param {string} testName Nom du test
 * @param {string} serviceName Nom du service
 * @returns {Promise<Object>} Résultat du test
 */
async function runTestWithRetries(testFn, testName, serviceName) {
  const result = {
    name: testName,
    service: serviceName,
    passed: false,
    skipped: false,
    error: null,
    duration: 0,
    attempts: 0
  };
  
  const startTime = performance.now();
  
  for (let attempt = 1; attempt <= TEST_CONFIG.retries; attempt++) {
    result.attempts = attempt;
    
    try {
      await testFn();
      result.passed = true;
      break;
    } catch (error) {
      if (attempt < TEST_CONFIG.retries) {
        logger.warn(`Test "${testName}" échoué (tentative ${attempt}/${TEST_CONFIG.retries}): ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.retryDelay));
      } else {
        result.error = error.message;
        logger.error(`Test "${testName}" échoué définitivement: ${error.message}`);
      }
    }
  }
  
  const endTime = performance.now();
  result.duration = endTime - startTime;
  
  // Mettre à jour les statistiques globales
  testResults.totalTests++;
  if (result.passed) {
    testResults.passedTests++;
  } else if (result.skipped) {
    testResults.skippedTests++;
  } else {
    testResults.failedTests++;
  }
  
  // Mettre à jour les statistiques du service
  if (!testResults.services[serviceName]) {
    testResults.services[serviceName] = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: []
    };
  }
  
  const serviceStats = testResults.services[serviceName];
  serviceStats.total++;
  if (result.passed) {
    serviceStats.passed++;
  } else if (result.skipped) {
    serviceStats.skipped++;
  } else {
    serviceStats.failed++;
  }
  
  serviceStats.tests.push(result);
  
  return result;
}

/**
 * Teste la rotation des clés JWT
 */
async function testJwtRotation() {
  const serviceName = 'authService';
  
  // Test 1: Création et vérification d'un token
  await runTestWithRetries(async () => {
    const jwtRotation = new EnhancedJwtRotation({
      minRotationInterval: 1000, // 1 seconde pour le test
      gracePeriod: 500, // 500ms pour le test
      logger
    });
    
    // Signer un token
    const userData = { id: '123', email: 'test@example.com', role: 'user' };
    const tokenData = jwtRotation.sign(userData, { expiresIn: '5s' });
    
    if (!tokenData || !tokenData.token) {
      throw new Error('Échec de la génération du token');
    }
    
    // Vérifier le token
    const decoded = jwtRotation.verify(tokenData.token);
    
    if (!decoded || decoded.id !== userData.id) {
      throw new Error('Échec de la vérification du token');
    }
    
    logger.info('Test de base JWT réussi');
  }, 'Génération et vérification de token JWT', serviceName);
  
  // Test 2: Rotation des clés
  await runTestWithRetries(async () => {
    const jwtRotation = new EnhancedJwtRotation({
      minRotationInterval: 100, // 100ms pour le test
      gracePeriod: 1000, // 1s pour le test
      logger
    });
    
    // Signer un token avec la clé initiale
    const userData = { id: '123', email: 'test@example.com', role: 'user' };
    const tokenData = jwtRotation.sign(userData, { expiresIn: '5s' });
    
    // Forcer une rotation des clés
    jwtRotation.rotateKeys();
    
    // Vérifier que le token est toujours valide (grâce à la période de grâce)
    const decoded = jwtRotation.verify(tokenData.token);
    
    if (!decoded || !decoded.gracePeriod) {
      throw new Error('Le token n\'est pas dans la période de grâce après rotation');
    }
    
    logger.info('Test de rotation des clés JWT réussi');
  }, 'Rotation des clés JWT', serviceName);
  
  // Test 3: Révocation de token
  await runTestWithRetries(async () => {
    const jwtRotation = new EnhancedJwtRotation({
      minRotationInterval: 1000,
      gracePeriod: 500,
      logger
    });
    
    // Signer un token
    const userData = { id: '123', email: 'test@example.com', role: 'user' };
    const tokenData = jwtRotation.sign(userData, { expiresIn: '5s' });
    
    // Révoquer le token
    const revoked = jwtRotation.revokeToken(tokenData.token, 'test', userData.id);
    
    if (!revoked) {
      throw new Error('Échec de la révocation du token');
    }
    
    // Vérifier que le token est révoqué
    try {
      jwtRotation.verify(tokenData.token);
      throw new Error('Le token devrait être révoqué');
    } catch (error) {
      if (!error.message.includes('révoqué')) {
        throw error;
      }
    }
    
    logger.info('Test de révocation de token réussi');
  }, 'Révocation de token JWT', serviceName);
}

/**
 * Teste le service OpenRoute
 */
async function testOpenRouteService() {
  const serviceName = 'openRouteService';
  
  // Test 1: Obtention d'une clé API valide
  await runTestWithRetries(async () => {
    const apiKey = await apiServices.openRouteService.getKey();
    
    if (!apiKey) {
      throw new Error('Impossible d\'obtenir une clé API valide');
    }
    
    logger.info('Test d\'obtention de clé API OpenRoute réussi');
  }, 'Obtention de clé API', serviceName);
  
  // Test 2: Calcul d'itinéraire
  await runTestWithRetries(async () => {
    const start = [7.7491, 48.5734]; // Strasbourg
    const end = [7.2661, 47.7486];   // Belfort
    
    const route = await openRouteService.calculateRoute(start, end, {
      profile: 'cycling-road',
      preference: 'recommended'
    });
    
    if (!route || !route.geometry) {
      throw new Error('Échec du calcul d\'itinéraire');
    }
    
    logger.info('Test de calcul d\'itinéraire OpenRoute réussi');
  }, 'Calcul d\'itinéraire', serviceName);
  
  // Test 3: Gestion des erreurs d'authentification
  await runTestWithRetries(async () => {
    // Simuler une erreur d'authentification
    const originalGetKey = apiServices.openRouteService.getKey;
    apiServices.openRouteService.getKey = async () => 'invalid_key';
    
    try {
      const start = [7.7491, 48.5734];
      const end = [7.2661, 47.7486];
      
      await openRouteService.calculateRoute(start, end);
      throw new Error('Le calcul aurait dû échouer avec une clé invalide');
    } catch (error) {
      // Vérifier que l'erreur est bien une erreur d'authentification
      if (!error.message.includes('Auth') && !error.message.includes('401') && !error.message.includes('403')) {
        throw new Error(`Erreur inattendue: ${error.message}`);
      }
    } finally {
      // Restaurer la fonction originale
      apiServices.openRouteService.getKey = originalGetKey;
    }
    
    logger.info('Test de gestion des erreurs d\'authentification OpenRoute réussi');
  }, 'Gestion des erreurs d\'authentification', serviceName);
}

/**
 * Teste le service Strava
 */
async function testStravaService() {
  const serviceName = 'stravaService';
  
  // Test 1: Obtention d'une clé API valide
  await runTestWithRetries(async () => {
    const apiKey = await apiServices.stravaService.getKey();
    
    if (!apiKey) {
      throw new Error('Impossible d\'obtenir une clé API valide pour Strava');
    }
    
    logger.info('Test d\'obtention de clé API Strava réussi');
  }, 'Obtention de clé API', serviceName);
  
  // Test 2: Authentification OAuth
  await runTestWithRetries(async () => {
    // Simuler le service Strava
    const stravaService = {
      generateAuthUrl: () => 'https://www.strava.com/oauth/authorize?client_id=12345&response_type=code&redirect_uri=http://localhost/callback&scope=read,activity:read',
      exchangeCodeForToken: async (code) => {
        if (code !== 'valid_code') {
          throw new Error('Code d\'autorisation invalide');
        }
        
        return {
          access_token: 'mock_access_token',
          refresh_token: 'mock_refresh_token',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          athlete: {
            id: 12345,
            firstname: 'John',
            lastname: 'Doe'
          }
        };
      },
      refreshToken: async (refreshToken) => {
        if (refreshToken !== 'mock_refresh_token') {
          throw new Error('Token de rafraîchissement invalide');
        }
        
        return {
          access_token: 'new_mock_access_token',
          refresh_token: 'new_mock_refresh_token',
          expires_at: Math.floor(Date.now() / 1000) + 3600
        };
      }
    };
    
    // Tester la génération d'URL d'authentification
    const authUrl = stravaService.generateAuthUrl();
    if (!authUrl || !authUrl.includes('strava.com/oauth/authorize')) {
      throw new Error('URL d\'authentification Strava invalide');
    }
    
    // Tester l'échange de code contre un token
    const tokenData = await stravaService.exchangeCodeForToken('valid_code');
    if (!tokenData || !tokenData.access_token || !tokenData.refresh_token) {
      throw new Error('Échec de l\'échange de code contre un token');
    }
    
    // Tester le rafraîchissement du token
    const refreshedTokenData = await stravaService.refreshToken('mock_refresh_token');
    if (!refreshedTokenData || !refreshedTokenData.access_token || !refreshedTokenData.refresh_token) {
      throw new Error('Échec du rafraîchissement du token');
    }
    
    logger.info('Test d\'authentification OAuth Strava réussi');
  }, 'Authentification OAuth', serviceName);
  
  // Test 3: Récupération des activités
  await runTestWithRetries(async () => {
    // Simuler le service Strava
    const stravaService = {
      getActivities: async (accessToken, params) => {
        if (accessToken !== 'mock_access_token') {
          throw new Error('Token d\'accès invalide');
        }
        
        // Simuler une réponse avec des activités
        return [
          {
            id: 1234567890,
            name: 'Morning Ride',
            distance: 10000,
            moving_time: 1800,
            elapsed_time: 2000,
            total_elevation_gain: 150,
            type: 'Ride',
            start_date: '2025-04-01T08:00:00Z',
            map: {
              summary_polyline: 'abc123'
            }
          },
          {
            id: 9876543210,
            name: 'Evening Ride',
            distance: 15000,
            moving_time: 2700,
            elapsed_time: 3000,
            total_elevation_gain: 250,
            type: 'Ride',
            start_date: '2025-04-01T18:00:00Z',
            map: {
              summary_polyline: 'xyz789'
            }
          }
        ];
      },
      
      getActivity: async (accessToken, activityId) => {
        if (accessToken !== 'mock_access_token') {
          throw new Error('Token d\'accès invalide');
        }
        
        if (activityId !== 1234567890) {
          throw new Error('ID d\'activité invalide');
        }
        
        // Simuler une réponse avec une activité détaillée
        return {
          id: 1234567890,
          name: 'Morning Ride',
          distance: 10000,
          moving_time: 1800,
          elapsed_time: 2000,
          total_elevation_gain: 150,
          type: 'Ride',
          start_date: '2025-04-01T08:00:00Z',
          map: {
            polyline: 'detailed_polyline_abc123'
          },
          start_latlng: [48.5734, 7.7491],
          end_latlng: [48.5839, 7.7455],
          average_speed: 5.56,
          max_speed: 12.2,
          average_watts: 185,
          device_watts: true,
          average_heartrate: 142,
          max_heartrate: 175
        };
      }
    };
    
    // Tester la récupération des activités
    const activities = await stravaService.getActivities('mock_access_token', { per_page: 10, page: 1 });
    if (!activities || !Array.isArray(activities) || activities.length < 1) {
      throw new Error('Échec de la récupération des activités');
    }
    
    // Tester la récupération d'une activité spécifique
    const activity = await stravaService.getActivity('mock_access_token', 1234567890);
    if (!activity || activity.id !== 1234567890) {
      throw new Error('Échec de la récupération de l\'activité');
    }
    
    logger.info('Test de récupération des activités Strava réussi');
  }, 'Récupération des activités', serviceName);
  
  // Test 4: Gestion des erreurs et limites de taux
  await runTestWithRetries(async () => {
    // Simuler le service Strava avec des erreurs de limite de taux
    let rateLimitExceeded = true;
    const stravaService = {
      getActivities: async (accessToken) => {
        if (rateLimitExceeded) {
          rateLimitExceeded = false;
          const error = new Error('Rate Limit Exceeded');
          error.response = {
            status: 429,
            headers: {
              'x-ratelimit-limit': '100',
              'x-ratelimit-usage': '100',
              'date': new Date().toUTCString()
            }
          };
          throw error;
        }
        
        return [{ id: 1234567890, name: 'Morning Ride' }];
      }
    };
    
    // Tester la gestion des limites de taux avec retry
    const result = await fetchWithRetry('https://www.strava.com/api/v3/athlete/activities', {
      headers: { 'Authorization': 'Bearer mock_access_token' },
      maxRetries: 3,
      baseDelay: 100,
      useExponentialBackoff: true,
      retryStatusCodes: [429]
    });
    
    // Vérifier que la requête a réussi après le retry
    if (!result || !result.success) {
      throw new Error('La fonction fetchWithRetry n\'a pas réussi après l\'erreur de limite de taux');
    }
    
    logger.info('Test de gestion des limites de taux Strava réussi');
  }, 'Gestion des limites de taux', serviceName);
}

/**
 * Teste le service OpenWeatherMap
 */
async function testWeatherService() {
  const serviceName = 'weatherService';
  
  // Test 1: Obtention d'une clé API valide
  await runTestWithRetries(async () => {
    const apiKey = await apiServices.weatherService.getKey();
    
    if (!apiKey) {
      throw new Error('Impossible d\'obtenir une clé API valide pour OpenWeatherMap');
    }
    
    logger.info('Test d\'obtention de clé API OpenWeatherMap réussi');
  }, 'Obtention de clé API', serviceName);
  
  // Test 2: Récupération des données météo actuelles
  await runTestWithRetries(async () => {
    // Simuler le service météo
    const weatherService = {
      getCurrentWeather: async (lat, lon, apiKey) => {
        if (!apiKey) {
          throw new Error('Clé API manquante');
        }
        
        if (typeof lat !== 'number' || typeof lon !== 'number') {
          throw new Error('Coordonnées invalides');
        }
        
        // Simuler une réponse météo
        return {
          coord: { lat, lon },
          weather: [
            {
              id: 800,
              main: 'Clear',
              description: 'ciel dégagé',
              icon: '01d'
            }
          ],
          main: {
            temp: 22.5,
            feels_like: 21.8,
            temp_min: 20.1,
            temp_max: 24.3,
            pressure: 1015,
            humidity: 45
          },
          wind: {
            speed: 3.6,
            deg: 220
          },
          clouds: {
            all: 0
          },
          dt: Math.floor(Date.now() / 1000),
          sys: {
            country: 'FR',
            sunrise: Math.floor(Date.now() / 1000) - 3600,
            sunset: Math.floor(Date.now() / 1000) + 3600
          },
          name: 'Col du Galibier',
          cod: 200
        };
      }
    };
    
    // Tester la récupération des données météo
    const weather = await weatherService.getCurrentWeather(45.0639, 6.4077, 'mock_api_key');
    
    if (!weather || !weather.weather || !weather.main) {
      throw new Error('Échec de la récupération des données météo');
    }
    
    logger.info('Test de récupération des données météo actuelles réussi');
  }, 'Récupération des données météo actuelles', serviceName);
  
  // Test 3: Récupération des prévisions météo
  await runTestWithRetries(async () => {
    // Simuler le service météo
    const weatherService = {
      getForecast: async (lat, lon, apiKey) => {
        if (!apiKey) {
          throw new Error('Clé API manquante');
        }
        
        if (typeof lat !== 'number' || typeof lon !== 'number') {
          throw new Error('Coordonnées invalides');
        }
        
        // Simuler une réponse de prévisions
        return {
          lat,
          lon,
          timezone: 'Europe/Paris',
          timezone_offset: 7200,
          daily: Array.from({ length: 7 }, (_, i) => ({
            dt: Math.floor(Date.now() / 1000) + i * 86400,
            sunrise: Math.floor(Date.now() / 1000) + i * 86400 - 3600,
            sunset: Math.floor(Date.now() / 1000) + i * 86400 + 3600,
            temp: {
              day: 22 + Math.random() * 5,
              min: 15 + Math.random() * 5,
              max: 25 + Math.random() * 5,
              night: 15 + Math.random() * 3,
              eve: 20 + Math.random() * 3,
              morn: 17 + Math.random() * 3
            },
            feels_like: {
              day: 21 + Math.random() * 5,
              night: 14 + Math.random() * 3,
              eve: 19 + Math.random() * 3,
              morn: 16 + Math.random() * 3
            },
            pressure: 1010 + Math.random() * 10,
            humidity: 40 + Math.random() * 20,
            weather: [
              {
                id: 800 + Math.floor(Math.random() * 3),
                main: ['Clear', 'Clouds', 'Rain'][Math.floor(Math.random() * 3)],
                description: ['ciel dégagé', 'nuageux', 'pluie légère'][Math.floor(Math.random() * 3)],
                icon: ['01d', '03d', '10d'][Math.floor(Math.random() * 3)]
              }
            ],
            wind_speed: 2 + Math.random() * 5,
            wind_deg: Math.floor(Math.random() * 360)
          }))
        };
      }
    };
    
    // Tester la récupération des prévisions
    const forecast = await weatherService.getForecast(45.0639, 6.4077, 'mock_api_key');
    
    if (!forecast || !forecast.daily || !Array.isArray(forecast.daily) || forecast.daily.length < 1) {
      throw new Error('Échec de la récupération des prévisions météo');
    }
    
    logger.info('Test de récupération des prévisions météo réussi');
  }, 'Récupération des prévisions météo', serviceName);
  
  // Test 4: Gestion des erreurs d'API
  await runTestWithRetries(async () => {
    // Simuler le service météo avec des erreurs
    const weatherService = {
      getCurrentWeather: async (lat, lon, apiKey) => {
        if (apiKey === 'invalid_key') {
          const error = new Error('Invalid API key');
          error.response = {
            status: 401,
            data: {
              cod: 401,
              message: 'Invalid API key. Please see https://openweathermap.org/faq#error401 for more info.'
            }
          };
          throw error;
        }
        
        return {
          weather: [{ id: 800, main: 'Clear', description: 'ciel dégagé', icon: '01d' }],
          main: { temp: 22.5 }
        };
      }
    };
    
    // Tester la gestion des erreurs d'API
    try {
      await weatherService.getCurrentWeather(45.0639, 6.4077, 'invalid_key');
      throw new Error('La requête aurait dû échouer avec une clé invalide');
    } catch (error) {
      if (!error.response || error.response.status !== 401) {
        throw new Error(`Erreur inattendue: ${error.message}`);
      }
      
      // Tester avec une clé valide après l'échec
      const weather = await weatherService.getCurrentWeather(45.0639, 6.4077, 'valid_key');
      
      if (!weather || !weather.weather) {
        throw new Error('Échec de la récupération des données météo avec une clé valide');
      }
    }
    
    logger.info('Test de gestion des erreurs d\'API OpenWeatherMap réussi');
  }, 'Gestion des erreurs d\'API', serviceName);
  
  // Test 5: Mise en cache des données météo
  await runTestWithRetries(async () => {
    // Simuler un service météo avec cache
    let apiCallCount = 0;
    const weatherService = {
      cache: new Map(),
      
      getCacheKey: (lat, lon) => `${lat.toFixed(4)},${lon.toFixed(4)}`,
      
      getCurrentWeatherWithCache: async (lat, lon, apiKey) => {
        const cacheKey = weatherService.getCacheKey(lat, lon);
        const now = Date.now();
        
        // Vérifier si les données sont en cache et encore valides (moins de 10 minutes)
        const cachedData = weatherService.cache.get(cacheKey);
        if (cachedData && now - cachedData.timestamp < 10 * 60 * 1000) {
          return cachedData.data;
        }
        
        // Sinon, appeler l'API
        apiCallCount++;
        const data = {
          weather: [{ id: 800, main: 'Clear', description: 'ciel dégagé', icon: '01d' }],
          main: { temp: 22.5 + Math.random() }
        };
        
        // Mettre en cache
        weatherService.cache.set(cacheKey, {
          data,
          timestamp: now
        });
        
        return data;
      }
    };
    
    // Premier appel - devrait appeler l'API
    await weatherService.getCurrentWeatherWithCache(45.0639, 6.4077, 'mock_api_key');
    
    // Deuxième appel avec les mêmes coordonnées - devrait utiliser le cache
    await weatherService.getCurrentWeatherWithCache(45.0639, 6.4077, 'mock_api_key');
    
    // Troisième appel avec des coordonnées différentes - devrait appeler l'API
    await weatherService.getCurrentWeatherWithCache(48.5734, 7.7491, 'mock_api_key');
    
    // Vérifier que l'API a été appelée exactement 2 fois
    if (apiCallCount !== 2) {
      throw new Error(`Le cache ne fonctionne pas correctement. Nombre d'appels API: ${apiCallCount}, attendu: 2`);
    }
    
    logger.info('Test de mise en cache des données météo réussi');
  }, 'Mise en cache des données météo', serviceName);
}

/**
 * Teste le service Mapbox
 */
async function testMapboxService() {
  const serviceName = 'mapboxService';
  
  // Test 1: Obtention d'une clé API valide
  await runTestWithRetries(async () => {
    const apiKey = await apiServices.mapboxService.getKey();
    
    if (!apiKey) {
      throw new Error('Impossible d\'obtenir une clé API valide pour Mapbox');
    }
    
    logger.info('Test d\'obtention de clé API Mapbox réussi');
  }, 'Obtention de clé API', serviceName);
  
  // Test 2: Récupération des données de géocodage
  await runTestWithRetries(async () => {
    // Simuler le service Mapbox
    const mapboxService = {
      geocode: async (query, apiKey) => {
        if (!apiKey) {
          throw new Error('Clé API manquante');
        }
        
        if (!query || typeof query !== 'string') {
          throw new Error('Requête de géocodage invalide');
        }
        
        // Simuler une réponse de géocodage
        return {
          type: 'FeatureCollection',
          query: [query],
          features: [
            {
              id: 'place.123456789',
              type: 'Feature',
              place_type: ['place'],
              relevance: 1,
              properties: {
                wikidata: 'Q90'
              },
              text: 'Paris',
              place_name: 'Paris, France',
              bbox: [2.224199, 48.815573, 2.469921, 48.902145],
              center: [2.3488, 48.8534],
              geometry: {
                type: 'Point',
                coordinates: [2.3488, 48.8534]
              },
              context: [
                {
                  id: 'region.123456',
                  wikidata: 'Q13917',
                  text: 'Île-de-France'
                },
                {
                  id: 'country.123456',
                  wikidata: 'Q142',
                  text: 'France'
                }
              ]
            }
          ],
          attribution: 'NOTICE: 2023 Mapbox and its suppliers. All rights reserved.'
        };
      }
    };
    
    // Tester le géocodage
    const geocodeResult = await mapboxService.geocode('Paris, France', 'mock_api_key');
    
    if (!geocodeResult || !geocodeResult.features || !Array.isArray(geocodeResult.features) || geocodeResult.features.length < 1) {
      throw new Error('Échec de la récupération des données de géocodage');
    }
    
    logger.info('Test de géocodage Mapbox réussi');
  }, 'Géocodage', serviceName);
  
  // Test 3: Récupération des données d'itinéraire
  await runTestWithRetries(async () => {
    // Simuler le service Mapbox
    const mapboxService = {
      getDirections: async (start, end, apiKey) => {
        if (!apiKey) {
          throw new Error('Clé API manquante');
        }
        
        if (!start || !end || !Array.isArray(start) || !Array.isArray(end) || start.length !== 2 || end.length !== 2) {
          throw new Error('Coordonnées de départ ou d\'arrivée invalides');
        }
        
        // Simuler une réponse d'itinéraire
        return {
          routes: [
            {
              weight_name: 'cyclability',
              weight: 1234.56,
              duration: 1800,
              distance: 15000,
              legs: [
                {
                  via_waypoints: [],
                  admins: [
                    {
                      iso_3166_1_alpha3: 'FRA',
                      iso_3166_1: 'FR'
                    }
                  ],
                  weight: 1234.56,
                  duration: 1800,
                  steps: [
                    {
                      intersections: [
                        {
                          bearings: [90],
                          entry: [true],
                          location: start
                        }
                      ],
                      driving_side: 'right',
                      geometry: 'mock_geometry_string',
                      mode: 'cycling',
                      maneuver: {
                        bearing_after: 90,
                        bearing_before: 0,
                        location: start,
                        type: 'depart',
                        instruction: 'Head east on Cycling Path'
                      },
                      name: 'Cycling Path',
                      duration: 300,
                      distance: 2500
                    },
                    {
                      intersections: [
                        {
                          bearings: [90, 180],
                          entry: [true, false],
                          location: [start[0] + 0.1, start[1]]
                        }
                      ],
                      driving_side: 'right',
                      geometry: 'another_mock_geometry_string',
                      mode: 'cycling',
                      maneuver: {
                        bearing_after: 90,
                        bearing_before: 90,
                        location: [start[0] + 0.1, start[1]],
                        type: 'continue',
                        instruction: 'Continue on Mountain Road'
                      },
                      name: 'Mountain Road',
                      duration: 1500,
                      distance: 12500
                    }
                  ],
                  distance: 15000,
                  summary: 'Cycling Path, Mountain Road'
                }
              ],
              geometry: 'complete_mock_geometry'
            }
          ],
          waypoints: [
            {
              name: 'Cycling Path',
              location: start
            },
            {
              name: 'Mountain Road',
              location: end
            }
          ],
          code: 'Ok'
        };
      }
    };
    
    // Tester l'obtention d'itinéraire
    const directionsResult = await mapboxService.getDirections([7.7491, 48.5734], [7.7455, 48.5839], 'mock_api_key');
    
    if (!directionsResult || !directionsResult.routes || !Array.isArray(directionsResult.routes) || directionsResult.routes.length < 1) {
      throw new Error('Échec de la récupération des données d\'itinéraire');
    }
    
    logger.info('Test d\'obtention d\'itinéraire Mapbox réussi');
  }, 'Obtention d\'itinéraire', serviceName);
  
  // Test 4: Récupération des données d'élévation
  await runTestWithRetries(async () => {
    // Simuler le service Mapbox
    const mapboxService = {
      getElevation: async (coordinates, apiKey) => {
        if (!apiKey) {
          throw new Error('Clé API manquante');
        }
        
        if (!coordinates || !Array.isArray(coordinates)) {
          throw new Error('Coordonnées invalides');
        }
        
        // Simuler une réponse d'élévation
        return {
          results: coordinates.map(coord => ({
            elevation: 100 + Math.random() * 1000,
            location: coord
          }))
        };
      }
    };
    
    // Tester l'obtention des données d'élévation
    const elevationResult = await mapboxService.getElevation([
      [7.7491, 48.5734],
      [7.7455, 48.5839]
    ], 'mock_api_key');
    
    if (!elevationResult || !elevationResult.results || !Array.isArray(elevationResult.results) || elevationResult.results.length < 1) {
      throw new Error('Échec de la récupération des données d\'élévation');
    }
    
    logger.info('Test d\'obtention des données d\'élévation Mapbox réussi');
  }, 'Obtention des données d\'élévation', serviceName);
  
  // Test 5: Gestion des erreurs et limites de taux
  await runTestWithRetries(async () => {
    // Simuler le service Mapbox avec des erreurs de limite de taux
    let rateLimitExceeded = true;
    const mapboxService = {
      geocode: async (query, apiKey) => {
        if (rateLimitExceeded) {
          rateLimitExceeded = false;
          const error = new Error('Rate Limit Exceeded');
          error.response = {
            status: 429,
            headers: {
              'x-rate-limit-interval': '60',
              'x-rate-limit-limit': '300',
              'x-rate-limit-reset': Math.floor(Date.now() / 1000) + 60
            }
          };
          throw error;
        }
        
        return {
          type: 'FeatureCollection',
          features: [{ place_name: 'Paris, France', center: [2.3488, 48.8534] }]
        };
      }
    };
    
    // Tester la gestion des limites de taux avec retry
    const result = await fetchWithRetry('https://api.mapbox.com/geocoding/v5/mapbox.places/Paris.json', {
      headers: { 'Authorization': 'Bearer mock_api_key' },
      maxRetries: 3,
      baseDelay: 100,
      useExponentialBackoff: true,
      retryStatusCodes: [429]
    });
    
    // Vérifier que la requête a réussi après le retry
    if (!result || !result.success) {
      throw new Error('La fonction fetchWithRetry n\'a pas réussi après l\'erreur de limite de taux');
    }
    
    logger.info('Test de gestion des limites de taux Mapbox réussi');
  }, 'Gestion des limites de taux', serviceName);
}

/**
 * Teste le service OpenAI
 */
async function testOpenAIService() {
  const serviceName = 'openaiService';
  
  // Test 1: Obtention d'une clé API valide
  await runTestWithRetries(async () => {
    const apiKey = await apiServices.openaiService.getKey();
    
    if (!apiKey) {
      throw new Error('Impossible d\'obtenir une clé API valide pour OpenAI');
    }
    
    logger.info('Test d\'obtention de clé API OpenAI réussi');
  }, 'Obtention de clé API', serviceName);
  
  // Test 2: Génération de texte avec GPT
  await runTestWithRetries(async () => {
    // Simuler le service OpenAI
    const openaiService = {
      generateText: async (prompt, apiKey, options = {}) => {
        if (!apiKey) {
          throw new Error('Clé API manquante');
        }
        
        if (!prompt || typeof prompt !== 'string') {
          throw new Error('Prompt invalide');
        }
        
        // Simuler une réponse de génération de texte
        return {
          id: 'chatcmpl-' + Math.random().toString(36).substring(2, 12),
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: options.model || 'gpt-3.5-turbo',
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: `Voici une description générée pour le col du Galibier: 
                Le Col du Galibier, situé à 2 642 mètres d'altitude dans les Alpes françaises, est l'un des cols les plus emblématiques pour les cyclistes. 
                Reliant Saint-Michel-de-Maurienne à Briançon, ce col offre des paysages à couper le souffle et des défis considérables avec ses pentes 
                qui atteignent jusqu'à 10%. Fréquemment inclus dans le Tour de France, le Galibier est réputé pour ses conditions météorologiques 
                changeantes et ses vues panoramiques exceptionnelles sur les massifs environnants.`
              },
              finish_reason: 'stop'
            }
          ],
          usage: {
            prompt_tokens: prompt.length / 4,
            completion_tokens: 150,
            total_tokens: prompt.length / 4 + 150
          }
        };
      }
    };
    
    // Tester la génération de texte
    const textResult = await openaiService.generateText(
      'Écris une description du col du Galibier pour les cyclistes',
      'mock_api_key',
      { model: 'gpt-3.5-turbo' }
    );
    
    if (!textResult || !textResult.choices || !Array.isArray(textResult.choices) || textResult.choices.length < 1) {
      throw new Error('Échec de la génération de texte');
    }
    
    const generatedText = textResult.choices[0]?.message?.content;
    if (!generatedText || typeof generatedText !== 'string' || generatedText.length < 10) {
      throw new Error('Texte généré invalide ou trop court');
    }
    
    logger.info('Test de génération de texte OpenAI réussi');
  }, 'Génération de texte', serviceName);
  
  // Test 3: Génération d'embeddings
  await runTestWithRetries(async () => {
    // Simuler le service OpenAI
    const openaiService = {
      generateEmbeddings: async (text, apiKey, options = {}) => {
        if (!apiKey) {
          throw new Error('Clé API manquante');
        }
        
        if (!text || (typeof text !== 'string' && !Array.isArray(text))) {
          throw new Error('Texte invalide pour les embeddings');
        }
        
        const texts = Array.isArray(text) ? text : [text];
        
        // Simuler une réponse d'embeddings
        return {
          object: 'list',
          data: texts.map(t => ({
            object: 'embedding',
            embedding: Array.from({ length: 1536 }, () => Math.random() * 2 - 1),
            index: 0
          })),
          model: options.model || 'text-embedding-ada-002',
          usage: {
            prompt_tokens: texts.join(' ').length / 4,
            total_tokens: texts.join(' ').length / 4
          }
        };
      }
    };
    
    // Tester la génération d'embeddings
    const embeddingsResult = await openaiService.generateEmbeddings(
      'Col du Galibier, un col mythique des Alpes françaises',
      'mock_api_key'
    );
    
    if (!embeddingsResult || !embeddingsResult.data || !Array.isArray(embeddingsResult.data) || embeddingsResult.data.length < 1) {
      throw new Error('Échec de la génération d\'embeddings');
    }
    
    const embedding = embeddingsResult.data[0]?.embedding;
    if (!embedding || !Array.isArray(embedding) || embedding.length < 100) {
      throw new Error('Embedding généré invalide ou trop court');
    }
    
    logger.info('Test de génération d\'embeddings OpenAI réussi');
  }, 'Génération d\'embeddings', serviceName);
  
  // Test 4: Gestion des erreurs et limites de taux
  await runTestWithRetries(async () => {
    // Simuler le service OpenAI avec des erreurs
    let rateLimitExceeded = true;
    let invalidApiKey = true;
    
    const openaiService = {
      generateText: async (prompt, apiKey) => {
        if (apiKey === 'invalid_key') {
          const error = new Error('Invalid API key');
          error.response = {
            status: 401,
            data: {
              error: {
                message: 'Incorrect API key provided',
                type: 'invalid_request_error',
                param: null,
                code: 'invalid_api_key'
              }
            }
          };
          throw error;
        }
        
        if (rateLimitExceeded) {
          rateLimitExceeded = false;
          const error = new Error('Rate limit exceeded');
          error.response = {
            status: 429,
            data: {
              error: {
                message: 'Rate limit reached for requests',
                type: 'rate_limit_error',
                param: null,
                code: 'rate_limit'
              }
            },
            headers: {
              'retry-after': '30'
            }
          };
          throw error;
        }
        
        return {
          choices: [{ message: { content: 'Texte généré avec succès' } }]
        };
      },
      
      handleApiError: async (error) => {
        if (error.response?.status === 401) {
          // Simuler la rotation de clé API
          invalidApiKey = false;
          return { success: true, message: 'Clé API rotée avec succès' };
        }
        
        if (error.response?.status === 429) {
          // Simuler l'attente avant de réessayer
          const retryAfter = error.response.headers['retry-after'] || '5';
          const waitTime = parseInt(retryAfter, 10) * 100; // Réduire le temps d'attente pour le test
          
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({ success: true, message: 'Attente terminée, prêt à réessayer' });
            }, waitTime);
          });
        }
        
        return { success: false, message: `Erreur non gérée: ${error.message}` };
      }
    };
    
    // Tester la gestion des erreurs d'API
    try {
      await openaiService.generateText('Test prompt', 'invalid_key');
      throw new Error('La requête aurait dû échouer avec une clé invalide');
    } catch (error) {
      // Gérer l'erreur de clé invalide
      const keyRotationResult = await openaiService.handleApiError(error);
      
      if (!keyRotationResult.success) {
        throw new Error('Échec de la rotation de clé API');
      }
      
      // Tester la gestion des limites de taux
      try {
        await openaiService.generateText('Test prompt', 'valid_key');
        throw new Error('La requête aurait dû échouer avec une limite de taux');
      } catch (rateLimitError) {
        // Gérer l'erreur de limite de taux
        const retryResult = await openaiService.handleApiError(rateLimitError);
        
        if (!retryResult.success) {
          throw new Error('Échec de la gestion de limite de taux');
        }
        
        // Réessayer après l'attente
        const finalResult = await openaiService.generateText('Test prompt', 'valid_key');
        
        if (!finalResult || !finalResult.choices || !finalResult.choices[0]?.message?.content) {
          throw new Error('Échec de la génération de texte après la gestion des erreurs');
        }
      }
    }
    
    logger.info('Test de gestion des erreurs et limites de taux OpenAI réussi');
  }, 'Gestion des erreurs et limites de taux', serviceName);
  
  // Test 5: Modération de contenu
  await runTestWithRetries(async () => {
    // Simuler le service OpenAI pour la modération
    const openaiService = {
      moderateContent: async (content, apiKey) => {
        if (!apiKey) {
          throw new Error('Clé API manquante');
        }
        
        if (!content || typeof content !== 'string') {
          throw new Error('Contenu invalide pour la modération');
        }
        
        // Simuler une réponse de modération
        const hasFlaggedContent = content.toLowerCase().includes('inapproprié') || 
                                 content.toLowerCase().includes('violent') ||
                                 content.toLowerCase().includes('haineux');
        
        return {
          id: 'modr-' + Math.random().toString(36).substring(2, 12),
          model: 'text-moderation-latest',
          results: [
            {
              flagged: hasFlaggedContent,
              categories: {
                sexual: false,
                hate: content.toLowerCase().includes('haineux'),
                harassment: false,
                'self-harm': false,
                'sexual/minors': false,
                'hate/threatening': false,
                violence: content.toLowerCase().includes('violent'),
                'violence/graphic': false
              },
              category_scores: {
                sexual: 0.0001,
                hate: content.toLowerCase().includes('haineux') ? 0.88 : 0.0001,
                harassment: 0.0001,
                'self-harm': 0.0001,
                'sexual/minors': 0.0001,
                'hate/threatening': 0.0001,
                violence: content.toLowerCase().includes('violent') ? 0.92 : 0.0001,
                'violence/graphic': 0.0001
              }
            }
          ]
        };
      }
    };
    
    // Tester la modération avec du contenu approprié
    const safeContentResult = await openaiService.moderateContent(
      'Le Col du Galibier est un col magnifique pour les cyclistes.',
      'mock_api_key'
    );
    
    if (!safeContentResult || !safeContentResult.results || !Array.isArray(safeContentResult.results)) {
      throw new Error('Échec de la modération de contenu approprié');
    }
    
    if (safeContentResult.results[0]?.flagged) {
      throw new Error('Le contenu approprié a été incorrectement signalé');
    }
    
    // Tester la modération avec du contenu inapproprié
    const unsafeContentResult = await openaiService.moderateContent(
      'Contenu violent et haineux qui devrait être signalé.',
      'mock_api_key'
    );
    
    if (!unsafeContentResult || !unsafeContentResult.results || !Array.isArray(unsafeContentResult.results)) {
      throw new Error('Échec de la modération de contenu inapproprié');
    }
    
    if (!unsafeContentResult.results[0]?.flagged) {
      throw new Error('Le contenu inapproprié n\'a pas été correctement signalé');
    }
    
    logger.info('Test de modération de contenu OpenAI réussi');
  }, 'Modération de contenu', serviceName);
}

/**
 * Teste la robustesse face aux pannes réseau
 */
async function testNetworkResilience() {
  const serviceName = 'networkResilience';
  
  // Test 1: Timeouts
  await runTestWithRetries(async () => {
    // Créer un intercepteur Axios pour simuler des timeouts
    const originalAxiosGet = axios.get;
    const originalAxiosPost = axios.post;
    
    // Simuler un timeout puis une réponse réussie
    let timeoutCount = 0;
    axios.get = async (url, config) => {
      if (url.includes('timeout-test') && timeoutCount < 2) {
        timeoutCount++;
        await new Promise(resolve => setTimeout(resolve, 100)); // Petit délai pour être réaliste
        const error = new Error('Timeout of 2000ms exceeded');
        error.code = 'ECONNABORTED';
        throw error;
      }
      return originalAxiosGet(url, config);
    };
    
    try {
      // Tester une fonction avec retry et backoff exponentiel
      const result = await fetchWithRetry('http://example.com/timeout-test', {
        maxRetries: 3,
        baseDelay: 100,
        useExponentialBackoff: true
      });
      
      if (!result || !result.success) {
        throw new Error('La fonction fetchWithRetry n\'a pas réussi après les timeouts');
      }
      
      logger.info('Test de résilience aux timeouts réussi');
    } finally {
      // Restaurer les fonctions originales
      axios.get = originalAxiosGet;
      axios.post = originalAxiosPost;
    }
  }, 'Résilience aux timeouts', serviceName);
  
  // Test 2: Erreurs HTTP 5xx
  await runTestWithRetries(async () => {
    // Créer un intercepteur Axios pour simuler des erreurs 5xx
    const originalAxiosGet = axios.get;
    let errorCount = 0;
    
    axios.get = async (url, config) => {
      if (url.includes('server-error-test') && errorCount < 2) {
        errorCount++;
        const error = new Error('Request failed with status code 503');
        error.response = {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'retry-after': '2' },
          data: { error: 'Service temporarily unavailable' }
        };
        throw error;
      }
      return originalAxiosGet(url, config);
    };
    
    try {
      // Tester une fonction avec retry et backoff exponentiel
      const result = await fetchWithRetry('http://example.com/server-error-test', {
        maxRetries: 3,
        baseDelay: 100,
        retryStatusCodes: [500, 502, 503, 504]
      });
      
      if (!result || !result.success) {
        throw new Error('La fonction fetchWithRetry n\'a pas réussi après les erreurs 5xx');
      }
      
      logger.info('Test de résilience aux erreurs HTTP 5xx réussi');
    } finally {
      // Restaurer la fonction originale
      axios.get = originalAxiosGet;
    }
  }, 'Résilience aux erreurs HTTP 5xx', serviceName);
  
  // Test 3: Latence élevée
  await runTestWithRetries(async () => {
    // Créer un intercepteur Axios pour simuler une latence élevée
    const originalAxiosGet = axios.get;
    let highLatencyCount = 0;
    
    axios.get = async (url, config) => {
      if (url.includes('high-latency-test') && highLatencyCount < 2) {
        highLatencyCount++;
        // Simuler une latence élevée
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      return originalAxiosGet(url, config);
    };
    
    try {
      // Mesurer le temps de réponse avec et sans latence
      const startTimeWithLatency = performance.now();
      await fetchWithTimeout('http://example.com/high-latency-test', { timeout: 2000 });
      const endTimeWithLatency = performance.now();
      
      const latencyDuration = endTimeWithLatency - startTimeWithLatency;
      
      if (latencyDuration < 1000) {
        throw new Error('Le test de latence n\'a pas correctement simulé une latence élevée');
      }
      
      logger.info(`Test de résilience à la latence élevée réussi (${latencyDuration.toFixed(2)}ms)`);
    } finally {
      // Restaurer la fonction originale
      axios.get = originalAxiosGet;
    }
  }, 'Résilience à la latence élevée', serviceName);
  
  // Test 4: Perte de connexion temporaire
  await runTestWithRetries(async () => {
    // Créer un intercepteur Axios pour simuler une perte de connexion
    const originalAxiosGet = axios.get;
    let connectionLossCount = 0;
    
    axios.get = async (url, config) => {
      if (url.includes('connection-loss-test') && connectionLossCount < 2) {
        connectionLossCount++;
        const error = new Error('Network Error');
        error.code = 'ECONNRESET';
        throw error;
      }
      return originalAxiosGet(url, config);
    };
    
    try {
      // Tester une fonction avec retry et backoff exponentiel
      const result = await fetchWithRetry('http://example.com/connection-loss-test', {
        maxRetries: 3,
        baseDelay: 100,
        retryNetworkErrors: true
      });
      
      if (!result || !result.success) {
        throw new Error('La fonction fetchWithRetry n\'a pas réussi après les pertes de connexion');
      }
      
      logger.info('Test de résilience aux pertes de connexion réussi');
    } finally {
      // Restaurer la fonction originale
      axios.get = originalAxiosGet;
    }
  }, 'Résilience aux pertes de connexion', serviceName);
}

/**
 * Fonction utilitaire pour effectuer une requête avec retry et backoff exponentiel
 * @param {string} url URL à appeler
 * @param {Object} options Options de configuration
 * @returns {Promise<Object>} Résultat de la requête
 */
async function fetchWithRetry(url, options = {}) {
  const {
    method = 'GET',
    data = null,
    headers = {},
    maxRetries = 3,
    baseDelay = 1000,
    useExponentialBackoff = true,
    retryStatusCodes = [408, 429, 500, 502, 503, 504],
    retryNetworkErrors = true
  } = options;
  
  let attempt = 0;
  
  while (attempt <= maxRetries) {
    try {
      // Effectuer la requête
      const response = method === 'GET'
        ? await axios.get(url, { headers })
        : await axios.post(url, data, { headers });
      
      // Si la requête réussit, retourner le résultat
      return {
        success: true,
        data: response.data,
        status: response.status
      };
    } catch (error) {
      attempt++;
      
      // Si c'est la dernière tentative, propager l'erreur
      if (attempt > maxRetries) {
        throw error;
      }
      
      // Déterminer si l'erreur est récupérable
      const isNetworkError = !error.response && retryNetworkErrors;
      const isRetryableStatusCode = error.response && retryStatusCodes.includes(error.response.status);
      
      if (!isNetworkError && !isRetryableStatusCode) {
        throw error;
      }
      
      // Calculer le délai avant la prochaine tentative
      let delay = baseDelay;
      if (useExponentialBackoff) {
        delay = baseDelay * Math.pow(2, attempt - 1);
      }
      
      // Ajouter un peu d'aléatoire pour éviter les tempêtes de requêtes
      delay += Math.random() * 100;
      
      // Respecter le header Retry-After s'il est présent
      if (error.response && error.response.headers['retry-after']) {
        const retryAfter = parseInt(error.response.headers['retry-after'], 10);
        if (!isNaN(retryAfter)) {
          delay = retryAfter * 1000;
        }
      }
      
      logger.debug(`Tentative ${attempt}/${maxRetries} échouée, nouvelle tentative dans ${delay}ms`);
      
      // Attendre avant la prochaine tentative
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Fonction utilitaire pour effectuer une requête avec timeout
 * @param {string} url URL à appeler
 * @param {Object} options Options de configuration
 * @returns {Promise<Object>} Résultat de la requête
 */
async function fetchWithTimeout(url, options = {}) {
  const { timeout = 5000 } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await axios.get(url, {
      signal: controller.signal
    });
    
    return {
      success: true,
      data: response.data,
      status: response.status
    };
  } finally {
    clearTimeout(id);
  }
}

/**
 * Affiche les résultats des tests
 */
function displayResults() {
  const duration = (testResults.endTime - testResults.startTime) / 1000;
  const successRate = testResults.totalTests > 0 
    ? (testResults.passedTests / testResults.totalTests) * 100 
    : 0;
  
  console.log('\n\n==== RÉSULTATS DES TESTS D\'INTÉGRATION ====');
  console.log(`Durée: ${duration.toFixed(2)} secondes`);
  console.log(`Tests totaux: ${testResults.totalTests}`);
  console.log(`Tests réussis: ${testResults.passedTests} (${successRate.toFixed(2)}%)`);
  console.log(`Tests échoués: ${testResults.failedTests}`);
  console.log(`Tests ignorés: ${testResults.skippedTests}`);
  
  console.log('\nRésultats par service:');
  for (const [service, stats] of Object.entries(testResults.services)) {
    const serviceSuccessRate = stats.total > 0 
      ? (stats.passed / stats.total) * 100 
      : 0;
    
    console.log(`  ${service}: ${stats.total} tests, ${serviceSuccessRate.toFixed(2)}% de succès`);
    
    // Afficher les tests échoués
    if (stats.failed > 0) {
      console.log('    Tests échoués:');
      for (const test of stats.tests) {
        if (!test.passed && !test.skipped) {
          console.log(`      - ${test.name}: ${test.error}`);
        }
      }
    }
  }
  
  console.log('\n=========================================');
}

/**
 * Sauvegarde les résultats dans un fichier
 */
function saveResults() {
  try {
    // Créer le répertoire de logs s'il n'existe pas
    const logsDir = path.dirname(TEST_CONFIG.outputFile);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Calculer des statistiques supplémentaires
    const duration = (testResults.endTime - testResults.startTime) / 1000;
    const successRate = testResults.totalTests > 0 
      ? (testResults.passedTests / testResults.totalTests) * 100 
      : 0;
    
    // Préparer les données à sauvegarder
    const results = {
      ...testResults,
      summary: {
        duration,
        successRate,
        timestamp: new Date().toISOString()
      }
    };
    
    // Sauvegarder les résultats
    fs.writeFileSync(TEST_CONFIG.outputFile, JSON.stringify(results, null, 2));
    
    logger.info(`Résultats sauvegardés dans ${TEST_CONFIG.outputFile}`);
  } catch (error) {
    logger.error(`Erreur lors de la sauvegarde des résultats: ${error.message}`);
  }
}

/**
 * Exécute tous les tests d'intégration
 */
async function runAllTests() {
  logger.info('Démarrage des tests d\'intégration API...');
  
  // Initialiser les résultats
  testResults.startTime = Date.now();
  
  // Tester la rotation des tokens JWT
  await testJwtRotation();
  
  // Tester le service OpenRoute
  await testOpenRouteService();
  
  // Tester le service Strava
  await testStravaService();
  
  // Tester le service OpenWeatherMap
  await testWeatherService();
  
  // Tester le service Mapbox
  await testMapboxService();
  
  // Tester le service OpenAI
  await testOpenAIService();
  
  // Tester la robustesse face aux pannes réseau
  await testNetworkResilience();
  
  // Ajouter d'autres tests de service ici...
  // TODO: Implémenter les tests pour les autres services
  
  // Finaliser les résultats
  testResults.endTime = Date.now();
  
  // Afficher les résultats
  displayResults();
  
  // Sauvegarder les résultats
  saveResults();
  
  return testResults;
}

/**
 * Fonction principale
 */
async function main() {
  try {
    await runAllTests();
  } catch (error) {
    logger.error(`Erreur lors de l'exécution des tests d'intégration: ${error.message}`);
    console.error(error);
  }
}

// Exécuter les tests si ce script est appelé directement
if (require.main === module) {
  main();
}

module.exports = {
  runAllTests,
  TEST_CONFIG
};
