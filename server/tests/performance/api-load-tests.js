/**
 * Tests de charge pour les API du Dashboard-Velo
 * Utilise k6 pour simuler des charges réalistes avec différents profils d'utilisation
 * Optimisé pour tester la scalabilité européenne
 * 
 * Installation : npm install -g k6
 * Exécution : k6 run api-load-tests.js
 */

import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Métriques personnalisées
const visualization3DRequests = new Counter('visualization_3d_requests');
const trainingZonesRequests = new Counter('training_zones_requests');
const routePlanningRequests = new Counter('route_planning_requests');
const europeRegionRequests = new Counter('europe_region_requests');
const visualization3DErrors = new Rate('visualization_3d_errors');
const cacheMissRate = new Rate('cache_miss_rate');
const ttfbTrend = new Trend('time_to_first_byte');
const distributedCacheHitRate = new Rate('distributed_cache_hit_rate');
const regionalResponseTime = new Trend('regional_response_time');

// Variables d'environnement
const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:5000/api';
const TEST_USER_TOKEN = __ENV.TEST_USER_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Token de test à remplacer
const COL_IDS = __ENV.COL_IDS ? __ENV.COL_IDS.split(',') : ['col1', 'col2', 'col3', 'col4', 'col5'];
const USER_IDS = __ENV.USER_IDS ? __ENV.USER_IDS.split(',') : ['user1', 'user2', 'user3'];
const EUROPEAN_REGIONS = ['western', 'eastern', 'northern', 'southern', 'central'];
const DEVICES = ['desktop', 'tablet', 'mobile'];

/**
 * Configuration des scénarios de test
 */
export const options = {
  scenarios: {
    // Scénario de base - charge constante
    constant_load: {
      executor: 'constant-arrival-rate',
      rate: 10, // Nombre de requêtes par seconde
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 20,
      maxVUs: 50,
      tags: { scenario: 'constant_load' },
    },
    // Pic de trafic soudain - simulation d'événement
    traffic_spike: {
      executor: 'ramping-arrival-rate',
      startRate: 5,
      timeUnit: '1s',
      stages: [
        { duration: '30s', target: 50 }, // Montée rapide
        { duration: '1m', target: 50 },  // Maintien du pic
        { duration: '30s', target: 5 },  // Retour à la normale
      ],
      preAllocatedVUs: 50,
      maxVUs: 100,
      tags: { scenario: 'traffic_spike' },
      startTime: '1m30s', // Démarrage après le scénario de base
    },
    // Simulation de charge réelle avec patterns journaliers
    realistic_usage: {
      executor: 'ramping-arrival-rate',
      startRate: 1,
      timeUnit: '1s',
      stages: [
        { duration: '2m', target: 10 },  // Montée du matin
        { duration: '10m', target: 20 }, // Pic du midi
        { duration: '5m', target: 10 },  // Après-midi
        { duration: '3m', target: 30 },  // Pic du soir
        { duration: '5m', target: 5 },   // Diminution en soirée
      ],
      preAllocatedVUs: 50,
      maxVUs: 100,
      tags: { scenario: 'realistic_usage' },
      startTime: '3m30s', // Démarrage après les deux premiers scénarios
    },
    // Simulation de charge européenne multi-région
    european_load: {
      executor: 'per-vu-iterations',
      vus: 50,
      iterations: 200,
      maxDuration: '5m',
      tags: { scenario: 'european_load' },
      startTime: '7m', // Démarrage après les autres scénarios
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% des requêtes doivent être < 2s
    http_req_failed: ['rate<0.05'],     // Taux d'erreur < 5%
    'visualization_3d_errors': ['rate<0.03'], // Taux d'erreur pour les visualisations 3D < 3%
    'http_req_duration{endpoint:cols_3d}': ['p(95)<5000'], // 95% des requêtes de visualisation 3D < 5s
    'http_req_duration{endpoint:training_zones}': ['p(95)<1000'], // 95% des requêtes de zones d'entraînement < 1s
    'http_req_duration{endpoint:route_planning}': ['p(95)<3000'], // 95% des requêtes de planification d'itinéraire < 3s
    'distributed_cache_hit_rate': ['rate>0.7'], // Taux de hit du cache distribué > 70%
    'regional_response_time{region:western}': ['p(95)<1500'], // 95% des requêtes pour l'Europe occidentale < 1.5s
    'regional_response_time{region:eastern}': ['p(95)<2000'], // 95% des requêtes pour l'Europe orientale < 2s
    'regional_response_time{region:central}': ['p(95)<1800'], // 95% des requêtes pour l'Europe centrale < 1.8s
  },
};

/**
 * Setup pour les tests
 */
export function setup() {
  // Vérifier l'accès à l'API
  const checkResponse = http.get(`${API_BASE_URL}/health`);
  check(checkResponse, {
    'API accessible': (r) => r.status === 200,
  });

  // Précharger les données de test
  const preloadResponse = http.post(`${API_BASE_URL}/admin/test/preload-data`,
    JSON.stringify({ regions: EUROPEAN_REGIONS }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_USER_TOKEN}`
      }
    }
  );

  check(preloadResponse, {
    'Préchargement des données réussi': (r) => r.status === 200,
  });

  return {
    colIds: COL_IDS,
    userIds: USER_IDS,
    regions: EUROPEAN_REGIONS,
    devices: DEVICES,
  };
}

/**
 * Point d'entrée principal
 */
export default function(data) {
  // Définir un utilisateur pour les requêtes authentifiées (pick random or fixed)
  const userId = data.userIds[randomIntBetween(0, data.userIds.length - 1)];
  const region = data.regions[randomIntBetween(0, data.regions.length - 1)];
  const device = data.devices[randomIntBetween(0, data.devices.length - 1)];
  
  // Exécuter les groupes de test
  group('Visualisation 3D des cols', () => {
    test3DVisualization(data.colIds, region, device);
  });

  group('Zones d\'entraînement', () => {
    testTrainingZones(userId, region);
  });

  group('Planification d\'itinéraire', () => {
    testRoutePlanning(region);
  });

  group('Consultations classiques', () => {
    testStandardEndpoints(region);
  });

  group('Fonctionnalités européennes', () => {
    testEuropeanFeatures(region);
  });

  // Pause entre les groupes de tests pour simuler le comportement utilisateur
  sleep(randomIntBetween(1, 5));
}

/**
 * Test des endpoints de visualisation 3D
 */
function test3DVisualization(colIds, region, device) {
  // Sélectionner un col aléatoire
  const colId = colIds[randomIntBetween(0, colIds.length - 1)];
  
  // Paramètres de visualisation 3D
  const params = {
    resolution: device === 'desktop' ? 'high' : (device === 'tablet' ? 'medium' : 'low'),
    withTextures: Math.random() > 0.2, // 80% des requêtes incluent les textures
    withAnimation: Math.random() > 0.5, // 50% des requêtes incluent les animations
    region: region,
    device: device
  };
  
  visualization3DRequests.add(1);
  const response = http.get(`${API_BASE_URL}/cols/3d/${colId}`, {
    params: params,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_USER_TOKEN}`,
      'X-Region': region,
      'X-Device-Type': device
    },
    tags: { 
      endpoint: 'cols_3d',
      region: region,
      device: device
    }
  });

  // Vérifier le temps de premier octet
  ttfbTrend.add(response.timings.waiting);
  
  // Vérifier le statut et le contenu
  const success = check(response, {
    'Statut 200 pour visualisation 3D': (r) => r.status === 200,
    'Données JSON valides': (r) => {
      try {
        return JSON.parse(r.body);
      } catch (e) {
        return false;
      }
    },
    'Contient les données de maillage': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.mesh && data.mesh.vertices;
      } catch (e) {
        return false;
      }
    },
  });

  if (!success) {
    visualization3DErrors.add(1);
  }

  // Vérifier si c'est un hit de cache
  if (response.headers['X-Cache']) {
    if (response.headers['X-Cache'] === 'HIT') {
      distributedCacheHitRate.add(1);
    } else if (response.headers['X-Cache'] === 'MISS') {
      cacheMissRate.add(1);
    }
  }

  // Mesurer le temps de réponse par région
  regionalResponseTime.add(response.timings.duration, { region: region });
}

/**
 * Test des endpoints de calcul des zones d'entraînement
 */
function testTrainingZones(userId, region) {
  // Types de zones
  const zoneTypes = ['power', 'hr', 'pace'];
  const zoneType = zoneTypes[randomIntBetween(0, 2)];
  
  trainingZonesRequests.add(1);
  const response = http.get(`${API_BASE_URL}/training/zones/${userId}`, {
    params: { 
      type: zoneType,
      region: region
    },
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_USER_TOKEN}`,
      'X-Region': region
    },
    tags: { 
      endpoint: 'training_zones',
      region: region
    }
  });

  check(response, {
    'Statut 200 pour zones d\'entraînement': (r) => r.status === 200,
    'Données JSON valides': (r) => {
      try {
        return JSON.parse(r.body);
      } catch (e) {
        return false;
      }
    },
    'Contient les bonnes zones': (r) => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data.zones) && data.zones.length > 0;
      } catch (e) {
        return false;
      }
    },
  });

  // Mesurer le temps de réponse par région
  regionalResponseTime.add(response.timings.duration, { region: region });
}

/**
 * Test des endpoints de planification d'itinéraire
 */
function testRoutePlanning(region) {
  // Coordonnées par région
  const regionCoordinates = {
    western: { start: { lat: 48.856614, lng: 2.352222 }, end: { lat: 48.583148, lng: 7.747882 } }, // Paris à Strasbourg
    eastern: { start: { lat: 52.520008, lng: 13.404954 }, end: { lat: 50.075538, lng: 14.437800 } }, // Berlin à Prague
    northern: { start: { lat: 59.329323, lng: 18.068581 }, end: { lat: 60.169857, lng: 24.938379 } }, // Stockholm à Helsinki
    southern: { start: { lat: 41.902782, lng: 12.496366 }, end: { lat: 40.416775, lng: -3.703790 } }, // Rome à Madrid
    central: { start: { lat: 48.208176, lng: 16.373819 }, end: { lat: 47.497913, lng: 19.040236 } }  // Vienne à Budapest
  };

  // Paramètres de planification
  const coordinates = regionCoordinates[region] || regionCoordinates.western;
  const payload = {
    start: coordinates.start,
    end: coordinates.end,
    preferences: {
      avoidTraffic: Math.random() > 0.5,
      preferScenic: Math.random() > 0.7,
      difficulty: ['easy', 'medium', 'hard'][randomIntBetween(0, 2)]
    },
    includeWeather: Math.random() > 0.3, // 70% des requêtes incluent la météo
    region: region
  };

  routePlanningRequests.add(1);
  const response = http.post(`${API_BASE_URL}/routes/plan`, 
    JSON.stringify(payload),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_USER_TOKEN}`,
        'X-Region': region
      },
      tags: { 
        endpoint: 'route_planning',
        region: region
      }
    }
  );

  check(response, {
    'Statut 200 pour planification d\'itinéraire': (r) => r.status === 200,
    'Données JSON valides': (r) => {
      try {
        return JSON.parse(r.body);
      } catch (e) {
        return false;
      }
    },
    'Contient un itinéraire': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.route && Array.isArray(data.route.points);
      } catch (e) {
        return false;
      }
    },
  });

  // Mesurer le temps de réponse par région
  regionalResponseTime.add(response.timings.duration, { region: region });
}

/**
 * Test des endpoints standards (moins gourmands en ressources)
 */
function testStandardEndpoints(region) {
  const standardEndpoints = [
    { url: '/cols', params: { region: region }, tag: 'cols_list' },
    { url: '/nutrition/foodlist', params: { region: region }, tag: 'nutrition_foodlist' },
    { url: '/training/types', params: { region: region }, tag: 'training_types' },
    { url: '/weather/current', params: { lat: 48.584614, lng: 7.750712, region: region }, tag: 'weather' }
  ];

  // Choisir un endpoint aléatoire
  const endpoint = standardEndpoints[randomIntBetween(0, standardEndpoints.length - 1)];
  
  const response = http.get(`${API_BASE_URL}${endpoint.url}`, {
    params: endpoint.params,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_USER_TOKEN}`,
      'X-Region': region
    },
    tags: { 
      endpoint: endpoint.tag,
      region: region
    }
  });

  check(response, {
    [`Statut 200 pour ${endpoint.tag}`]: (r) => r.status === 200,
    'Temps de réponse rapide': (r) => r.timings.duration < 1000,
  });

  // Mesurer le temps de réponse par région
  regionalResponseTime.add(response.timings.duration, { region: region });
}

/**
 * Test des fonctionnalités spécifiques à l'adaptation européenne
 */
function testEuropeanFeatures(region) {
  europeRegionRequests.add(1);
  
  // Tester les fonctionnalités européennes
  const europeanEndpoints = [
    { url: '/europe/regions', tag: 'europe_regions' },
    { url: `/europe/cols/${region}`, tag: 'europe_cols' },
    { url: `/europe/events/${region}`, tag: 'europe_events' },
    { url: '/europe/statistics', params: { region: region }, tag: 'europe_statistics' }
  ];

  // Choisir un endpoint aléatoire
  const endpoint = europeanEndpoints[randomIntBetween(0, europeanEndpoints.length - 1)];
  
  const response = http.get(`${API_BASE_URL}${endpoint.url}`, {
    params: endpoint.params,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_USER_TOKEN}`,
      'X-Region': region
    },
    tags: { 
      endpoint: endpoint.tag,
      region: region
    }
  });

  check(response, {
    [`Statut 200 pour ${endpoint.tag}`]: (r) => r.status === 200,
    'Données JSON valides': (r) => {
      try {
        return JSON.parse(r.body);
      } catch (e) {
        return false;
      }
    },
  });

  // Mesurer le temps de réponse par région
  regionalResponseTime.add(response.timings.duration, { region: region });
}

/**
 * Teardown après les tests
 */
export function teardown(data) {
  // Envoyer un rapport final
  const reportPayload = {
    testTimestamp: new Date().toISOString(),
    summary: {
      visualization3DRequests: visualization3DRequests.name,
      trainingZonesRequests: trainingZonesRequests.name,
      routePlanningRequests: routePlanningRequests.name,
      europeRegionRequests: europeRegionRequests.name,
      visualization3DErrors: visualization3DErrors.name,
      cacheMissRate: cacheMissRate.name,
      distributedCacheHitRate: distributedCacheHitRate.name,
      regionalPerformance: {
        western: regionalResponseTime.name,
        eastern: regionalResponseTime.name,
        northern: regionalResponseTime.name,
        southern: regionalResponseTime.name,
        central: regionalResponseTime.name
      }
    }
  };

  // Cette requête est envoyée une seule fois à la fin du test
  http.post(`${API_BASE_URL}/admin/performance/test-report`, 
    JSON.stringify(reportPayload),
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_USER_TOKEN}`
      }
    }
  );
}
