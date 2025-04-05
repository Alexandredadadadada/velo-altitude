/**
 * Tests de charge pour Dashboard-Velo
 * Simule une utilisation à l'échelle européenne pour vérifier la robustesse du système de quotas
 */

const axios = require('axios');
const { performance } = require('perf_hooks');

// Configuration
const config = {
  baseUrl: 'http://localhost:3000',
  apiKey: 'test-api-key', // Remplacer par une clé de test valide
  concurrentUsers: 100,
  requestsPerUser: 50,
  delayBetweenRequests: 50, // ms
  endpoints: [
    '/api/route',
    '/api/elevation',
    '/api/geocode',
    '/api/places'
  ],
  countries: [
    'fr', 'de', 'it', 'es', 'be', 'nl', 'ch', 'at', 'gb', 'ie',
    'dk', 'se', 'no', 'fi', 'pt', 'pl', 'cz', 'sk', 'hu'
  ],
  // Distribution des requêtes par pays (en pourcentage)
  countryDistribution: {
    'fr': 20, 'de': 15, 'it': 10, 'es': 10, 'be': 5, 'nl': 5, 'ch': 5, 'at': 5,
    'gb': 5, 'ie': 3, 'dk': 3, 'se': 3, 'no': 2, 'fi': 2, 'pt': 2,
    'pl': 2, 'cz': 1, 'sk': 1, 'hu': 1
  }
};

// Statistiques
const stats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  quotaExceededCount: 0,
  responseTimeTotal: 0,
  responseTimeMin: Number.MAX_SAFE_INTEGER,
  responseTimeMax: 0,
  responseTimeByEndpoint: {},
  errorsByEndpoint: {},
  requestsByCountry: {},
  startTime: null,
  endTime: null
};

// Initialiser les statistiques
function initStats() {
  config.endpoints.forEach(endpoint => {
    stats.responseTimeByEndpoint[endpoint] = {
      count: 0,
      total: 0,
      min: Number.MAX_SAFE_INTEGER,
      max: 0
    };
    stats.errorsByEndpoint[endpoint] = 0;
  });
  
  config.countries.forEach(country => {
    stats.requestsByCountry[country] = {
      total: 0,
      success: 0,
      failed: 0,
      quotaExceeded: 0
    };
  });
}

// Générer des coordonnées aléatoires pour un pays
function getRandomCoordinates(country) {
  // Coordonnées approximatives pour chaque pays
  const countryBounds = {
    'fr': { lat: [42.5, 51.0], lng: [-4.5, 8.0] },
    'de': { lat: [47.3, 55.0], lng: [5.9, 15.0] },
    'it': { lat: [36.6, 47.1], lng: [6.7, 18.5] },
    'es': { lat: [36.0, 43.8], lng: [-9.3, 3.3] },
    'be': { lat: [49.5, 51.5], lng: [2.5, 6.4] },
    'nl': { lat: [50.8, 53.5], lng: [3.3, 7.2] },
    'ch': { lat: [45.8, 47.8], lng: [6.0, 10.5] },
    'at': { lat: [46.4, 49.0], lng: [9.5, 17.2] },
    'gb': { lat: [49.9, 58.7], lng: [-8.2, 1.8] },
    'ie': { lat: [51.4, 55.4], lng: [-10.5, -6.0] },
    'dk': { lat: [54.5, 57.8], lng: [8.0, 15.2] },
    'se': { lat: [55.3, 69.1], lng: [11.1, 24.2] },
    'no': { lat: [58.0, 71.2], lng: [4.5, 31.0] },
    'fi': { lat: [59.8, 70.1], lng: [20.6, 31.5] },
    'pt': { lat: [37.0, 42.2], lng: [-9.5, -6.2] },
    'pl': { lat: [49.0, 54.8], lng: [14.1, 24.2] },
    'cz': { lat: [48.5, 51.1], lng: [12.1, 18.9] },
    'sk': { lat: [47.7, 49.6], lng: [16.8, 22.6] },
    'hu': { lat: [45.7, 48.6], lng: [16.1, 22.9] }
  };
  
  const bounds = countryBounds[country] || countryBounds['fr']; // Par défaut, utiliser la France
  
  const lat = bounds.lat[0] + Math.random() * (bounds.lat[1] - bounds.lat[0]);
  const lng = bounds.lng[0] + Math.random() * (bounds.lng[1] - bounds.lng[0]);
  
  return { lat, lng };
}

// Sélectionner un pays en fonction de la distribution
function selectCountry() {
  const rand = Math.random() * 100;
  let cumulativePercentage = 0;
  
  for (const [country, percentage] of Object.entries(config.countryDistribution)) {
    cumulativePercentage += percentage;
    if (rand <= cumulativePercentage) {
      return country;
    }
  }
  
  return config.countries[0]; // Par défaut, retourner le premier pays
}

// Effectuer une requête API
async function makeRequest(userId, requestId) {
  const endpoint = config.endpoints[Math.floor(Math.random() * config.endpoints.length)];
  const country = selectCountry();
  const coordinates = getRandomCoordinates(country);
  
  const url = `${config.baseUrl}${endpoint}`;
  const params = {
    lat: coordinates.lat.toFixed(6),
    lng: coordinates.lng.toFixed(6),
    country: country
  };
  
  const startTime = performance.now();
  
  try {
    const response = await axios.get(url, {
      params,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'X-User-ID': `load-test-user-${userId}`,
        'X-Request-ID': `load-test-request-${requestId}`
      },
      timeout: 10000 // 10 secondes
    });
    
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    // Mettre à jour les statistiques
    stats.totalRequests++;
    stats.successfulRequests++;
    stats.responseTimeTotal += responseTime;
    stats.responseTimeMin = Math.min(stats.responseTimeMin, responseTime);
    stats.responseTimeMax = Math.max(stats.responseTimeMax, responseTime);
    
    // Statistiques par endpoint
    const endpointStats = stats.responseTimeByEndpoint[endpoint];
    endpointStats.count++;
    endpointStats.total += responseTime;
    endpointStats.min = Math.min(endpointStats.min, responseTime);
    endpointStats.max = Math.max(endpointStats.max, responseTime);
    
    // Statistiques par pays
    stats.requestsByCountry[country].total++;
    stats.requestsByCountry[country].success++;
    
    return { success: true, endpoint, country, responseTime };
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    stats.totalRequests++;
    stats.failedRequests++;
    
    // Vérifier si c'est une erreur de quota dépassé
    const isQuotaExceeded = error.response && 
      (error.response.status === 429 || 
       (error.response.data && error.response.data.error === 'quota_exceeded'));
    
    if (isQuotaExceeded) {
      stats.quotaExceededCount++;
      stats.requestsByCountry[country].quotaExceeded++;
    }
    
    // Statistiques par endpoint
    stats.errorsByEndpoint[endpoint]++;
    
    // Statistiques par pays
    stats.requestsByCountry[country].total++;
    stats.requestsByCountry[country].failed++;
    
    return { 
      success: false, 
      endpoint, 
      country,
      responseTime,
      error: error.message,
      isQuotaExceeded
    };
  }
}

// Simuler un utilisateur faisant plusieurs requêtes
async function simulateUser(userId) {
  const results = [];
  
  for (let i = 0; i < config.requestsPerUser; i++) {
    const result = await makeRequest(userId, i);
    results.push(result);
    
    // Afficher des informations sur la requête
    if (result.success) {
      console.log(`User ${userId}, Request ${i}: ${result.endpoint} (${result.country}) - ${Math.round(result.responseTime)}ms`);
    } else {
      console.log(`User ${userId}, Request ${i}: ${result.endpoint} (${result.country}) - FAILED: ${result.error}`);
    }
    
    // Attendre entre les requêtes
    if (i < config.requestsPerUser - 1) {
      await new Promise(resolve => setTimeout(resolve, config.delayBetweenRequests));
    }
  }
  
  return results;
}

// Afficher les statistiques finales
function displayStats() {
  const durationMs = stats.endTime - stats.startTime;
  const durationSec = durationMs / 1000;
  const requestsPerSecond = stats.totalRequests / durationSec;
  const avgResponseTime = stats.responseTimeTotal / stats.totalRequests;
  const successRate = (stats.successfulRequests / stats.totalRequests) * 100;
  
  console.log('\n========== RÉSULTATS DU TEST DE CHARGE ==========');
  console.log(`Durée totale: ${durationSec.toFixed(2)} secondes`);
  console.log(`Requêtes totales: ${stats.totalRequests}`);
  console.log(`Requêtes réussies: ${stats.successfulRequests} (${successRate.toFixed(2)}%)`);
  console.log(`Requêtes échouées: ${stats.failedRequests}`);
  console.log(`Dépassements de quota: ${stats.quotaExceededCount}`);
  console.log(`Requêtes par seconde: ${requestsPerSecond.toFixed(2)}`);
  console.log(`Temps de réponse moyen: ${avgResponseTime.toFixed(2)} ms`);
  console.log(`Temps de réponse min: ${stats.responseTimeMin.toFixed(2)} ms`);
  console.log(`Temps de réponse max: ${stats.responseTimeMax.toFixed(2)} ms`);
  
  console.log('\n--- Statistiques par endpoint ---');
  for (const [endpoint, endpointStats] of Object.entries(stats.responseTimeByEndpoint)) {
    if (endpointStats.count > 0) {
      const avgTime = endpointStats.total / endpointStats.count;
      console.log(`${endpoint}: ${endpointStats.count} requêtes, ${avgTime.toFixed(2)} ms en moyenne, ${stats.errorsByEndpoint[endpoint]} erreurs`);
    }
  }
  
  console.log('\n--- Statistiques par pays ---');
  for (const [country, countryStats] of Object.entries(stats.requestsByCountry)) {
    if (countryStats.total > 0) {
      const successRate = (countryStats.success / countryStats.total) * 100;
      console.log(`${country}: ${countryStats.total} requêtes, ${successRate.toFixed(2)}% de succès, ${countryStats.quotaExceeded} dépassements de quota`);
    }
  }
  
  console.log('\n=================================================');
}

// Fonction principale
async function runLoadTest() {
  console.log(`Démarrage du test de charge avec ${config.concurrentUsers} utilisateurs simultanés, chacun effectuant ${config.requestsPerUser} requêtes...`);
  
  initStats();
  stats.startTime = performance.now();
  
  // Créer les promesses pour tous les utilisateurs
  const userPromises = [];
  for (let i = 0; i < config.concurrentUsers; i++) {
    userPromises.push(simulateUser(i));
  }
  
  // Attendre que tous les utilisateurs aient terminé
  await Promise.all(userPromises);
  
  stats.endTime = performance.now();
  
  // Afficher les statistiques
  displayStats();
}

// Exécuter le test
runLoadTest().catch(error => {
  console.error('Erreur lors du test de charge:', error);
});
