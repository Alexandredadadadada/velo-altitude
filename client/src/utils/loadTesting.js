/**
 * Module de test de charge pour Dashboard-Velo
 * Utilitaires pour exécuter et analyser des tests de performance
 */

// Constantes de configuration
const TEST_SCENARIOS = {
  LIGHT: 'light',    // 100 utilisateurs simultanés
  MEDIUM: 'medium',  // 500 utilisateurs simultanés
  HEAVY: 'heavy',    // 1000 utilisateurs simultanés 
  SPIKE: 'spike',    // Pic soudain de 2000 utilisateurs
  ENDURANCE: 'endurance' // 300 utilisateurs sur 4 heures
};

// Configuration par défaut des tests
const DEFAULT_CONFIG = {
  rampUpPeriod: 60, // secondes
  duration: 300,    // secondes
  thinkTime: [3, 10], // min, max en secondes
  baseUrl: 'https://dashboard-velo.com',
  acceptableResponseTime: 800, // ms
  acceptableErrorRate: 0.01, // 1%
  maxConcurrentUsers: 100
};

/**
 * Génère un script k6 pour un scénario de test spécifié
 * @param {string} scenario - Type de scénario (voir TEST_SCENARIOS)
 * @param {Object} customConfig - Configuration personnalisée (optionnel)
 * @returns {string} Script k6 à exécuter
 */
function generateK6Script(scenario = TEST_SCENARIOS.MEDIUM, customConfig = {}) {
  const config = { ...DEFAULT_CONFIG, ...customConfig };
  
  // Paramètres spécifiques au scénario
  let users, duration, stages;
  
  switch(scenario) {
    case TEST_SCENARIOS.LIGHT:
      users = 100;
      duration = 300;
      stages = [
        { duration: '1m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '2m', target: 100 },
      ];
      break;
    case TEST_SCENARIOS.MEDIUM:
      users = 500;
      duration = 600;
      stages = [
        { duration: '2m', target: 200 },
        { duration: '3m', target: 500 },
        { duration: '5m', target: 500 },
      ];
      break;
    case TEST_SCENARIOS.HEAVY:
      users = 1000;
      duration = 900;
      stages = [
        { duration: '3m', target: 400 },
        { duration: '5m', target: 1000 },
        { duration: '7m', target: 1000 },
      ];
      break;
    case TEST_SCENARIOS.SPIKE:
      users = 2000;
      duration = 600;
      stages = [
        { duration: '1m', target: 500 },
        { duration: '1m', target: 2000 },
        { duration: '3m', target: 2000 },
        { duration: '1m', target: 500 },
      ];
      break;
    case TEST_SCENARIOS.ENDURANCE:
      users = 300;
      duration = 14400; // 4 heures
      stages = [
        { duration: '10m', target: 300 },
        { duration: '230m', target: 300 },
        { duration: '10m', target: 0 },
      ];
      break;
    default:
      throw new Error(`Scénario non reconnu: ${scenario}`);
  }
  
  // Générer le script k6
  return `
import http from 'k6/http';
import { sleep, check } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Métriques personnalisées
export const errorRate = new Rate('error_rate');
export const pageLoadTime = new Trend('page_load_time');

// Options de test
export const options = {
  stages: ${JSON.stringify(stages)},
  thresholds: {
    'http_req_duration': ['p(95)<${config.acceptableResponseTime}'],
    'error_rate': ['rate<${config.acceptableErrorRate}'],
  },
};

// Fonction principale - flux utilisateur type
export default function() {
  // 1. Page d'accueil
  let res = http.get('${config.baseUrl}/', {
    tags: { name: 'HomePage' },
  });
  check(res, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage contains title': (r) => r.body.includes('Dashboard-Velo')
  });
  errorRate.add(res.status !== 200);
  pageLoadTime.add(res.timings.duration);
  sleep(Math.random() * (${config.thinkTime[1]} - ${config.thinkTime[0]}) + ${config.thinkTime[0]});

  // 2. Explorer les itinéraires disponibles
  res = http.get('${config.baseUrl}/routes', {
    tags: { name: 'RoutesPage' },
  });
  check(res, {
    'routes page status is 200': (r) => r.status === 200,
  });
  errorRate.add(res.status !== 200);
  pageLoadTime.add(res.timings.duration);
  sleep(Math.random() * (${config.thinkTime[1]} - ${config.thinkTime[0]}) + ${config.thinkTime[0]});

  // 3. Détails d'un itinéraire spécifique
  res = http.get('${config.baseUrl}/routes/42', {
    tags: { name: 'RouteDetailPage' },
  });
  check(res, {
    'route detail status is 200': (r) => r.status === 200,
  });
  errorRate.add(res.status !== 200);
  pageLoadTime.add(res.timings.duration);
  sleep(Math.random() * (${config.thinkTime[1]} - ${config.thinkTime[0]}) + ${config.thinkTime[0]});

  // 4. Chargement du profil utilisateur avec authentification simulée
  res = http.get('${config.baseUrl}/profile', {
    tags: { name: 'ProfilePage' },
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXIiLCJpYXQiOjE2MzQ1Njc4OTB9.example-token'
    }
  });
  check(res, {
    'profile status is 200': (r) => r.status === 200,
  });
  errorRate.add(res.status !== 200);
  pageLoadTime.add(res.timings.duration);
  sleep(Math.random() * (${config.thinkTime[1]} - ${config.thinkTime[0]}) + ${config.thinkTime[0]});
  
  // 5. Appel API pour récupérer les statistiques (simulé)
  res = http.get('${config.baseUrl}/api/stats', {
    tags: { name: 'StatsAPI' },
    headers: {
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXIiLCJpYXQiOjE2MzQ1Njc4OTB9.example-token',
      'Content-Type': 'application/json'
    }
  });
  check(res, {
    'stats API status is 200': (r) => r.status === 200,
    'stats API returns JSON': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json')
  });
  errorRate.add(res.status !== 200);
  pageLoadTime.add(res.timings.duration);
}`;
}

/**
 * Génère un rapport d'analyse à partir des résultats de tests de charge
 * @param {Object} results - Résultats des tests de charge
 * @returns {Object} Rapport d'analyse formaté
 */
function analyzeResults(results) {
  const { metrics, checks } = results;
  
  // Calcul des indicateurs clés
  const p95ResponseTime = metrics.http_req_duration.values["p(95)"];
  const errorRate = metrics.error_rate ? metrics.error_rate.values.rate : 0;
  const successRate = checks ? checks.values.rate : 1.0;
  const requestCount = metrics.http_reqs.values.count;
  const avgRequestsPerSecond = requestCount / (results.duration_seconds || 1);
  
  // Déterminer le statut global du test
  let status = "SUCCESS";
  let recommendations = [];
  
  if (p95ResponseTime > DEFAULT_CONFIG.acceptableResponseTime) {
    status = "WARNING";
    recommendations.push(`Le temps de réponse P95 (${p95ResponseTime.toFixed(2)}ms) dépasse la limite acceptable (${DEFAULT_CONFIG.acceptableResponseTime}ms). Envisagez d'optimiser les requêtes les plus lentes.`);
  }
  
  if (errorRate > DEFAULT_CONFIG.acceptableErrorRate) {
    status = "FAILURE";
    recommendations.push(`Le taux d'erreur (${(errorRate * 100).toFixed(2)}%) dépasse la limite acceptable (${DEFAULT_CONFIG.acceptableErrorRate * 100}%). Résolvez les erreurs HTTP avant le déploiement.`);
  }
  
  // Générer le rapport
  return {
    status,
    summary: {
      duration: results.duration_seconds,
      users: results.metrics.vus_max.values.max,
      requests: requestCount,
      requestsPerSecond: avgRequestsPerSecond.toFixed(2),
      p95ResponseTime: p95ResponseTime.toFixed(2),
      errorRate: (errorRate * 100).toFixed(2) + "%",
      successRate: (successRate * 100).toFixed(2) + "%"
    },
    performanceByEndpoint: Object.keys(results.metrics)
      .filter(key => key.startsWith('page_load_time{name:'))
      .map(key => {
        const name = key.match(/page_load_time\{name:(.*?)\}/)[1];
        return {
          endpoint: name,
          avgResponseTime: results.metrics[key].values.avg.toFixed(2),
          p95ResponseTime: results.metrics[key].values["p(95)"].toFixed(2)
        };
      }),
    recommendations
  };
}

/**
 * Vérifie si l'infrastructure actuelle peut supporter la charge prévue
 * @param {number} expectedUsers - Nombre d'utilisateurs simultanés prévus
 * @param {number} safetyFactor - Facteur de sécurité (marge supplémentaire)
 * @returns {Object} Évaluation de capacité
 */
function evaluateCapacity(expectedUsers, safetyFactor = 1.5) {
  // Cette fonction simulerait normalement une analyse des ressources
  // actuelles et des résultats de tests précédents
  const targetCapacity = expectedUsers * safetyFactor;
  
  // Exemple de sortie
  return {
    expectedPeakUsers: expectedUsers,
    recommendedCapacity: targetCapacity,
    currentEstimatedCapacity: 1200, // Cette valeur serait normalement calculée
    sufficientCapacity: 1200 >= targetCapacity,
    recommendations: 1200 >= targetCapacity
      ? []
      : [`Augmenter la capacité des serveurs pour supporter ${targetCapacity} utilisateurs simultanés`]
  };
}

/**
 * Simule une connexion WebSocket pour tester la charge sur cette infrastructure
 * @param {number} connections - Nombre de connexions à simuler
 * @param {number} duration - Durée du test en secondes
 * @returns {Promise<Object>} Résultats du test WebSocket
 */
async function testWebSocketLoad(connections = 500, duration = 300) {
  console.log(`Simulation de test WebSocket: ${connections} connexions sur ${duration}s`);
  
  // Cette fonction générerait un script de test WebSocket 
  // à exécuter avec un outil comme Artillery ou k6
  
  // Simulation de résultats
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        connections,
        duration,
        successRate: 0.985,
        avgLatency: 120,
        messageRate: 15.2,
        errors: {
          connectionErrors: connections * 0.005,
          messageErrors: connections * duration * 0.0001
        },
        recommendations: connections > 1000 
          ? ["Envisager de partitionner les connexions WebSocket par région"]
          : []
      });
    }, 1000); // Simulation d'attente
  });
}

/**
 * Génère un plan de capacité pour le déploiement en production
 * @param {Object} params - Paramètres pour le plan de capacité
 * @returns {Object} Plan de capacité détaillé
 */
function generateCapacityPlan({ peakUsers = 1000, 
                               avgRequestsPerUser = 5,
                               avgResponseSize = 50, // KB
                               growthFactor = 1.2 } = {}) {
  // Calculer les besoins en ressources
  const peakRPS = peakUsers * avgRequestsPerUser / 60;
  const bandwidthNeeded = peakRPS * avgResponseSize / 1024; // MB/s
  
  // Calculer les besoins en instances de serveur (exemple)
  const frontendInstances = Math.ceil(peakUsers / 300);
  const backendInstances = Math.ceil(peakRPS / 100);
  const dbConnections = backendInstances * 20;
  
  return {
    current: {
      peakUsers,
      requestsPerSecond: peakRPS.toFixed(2),
      bandwidthMBps: bandwidthNeeded.toFixed(2),
      instances: {
        frontend: frontendInstances,
        backend: backendInstances,
        database: 1
      }
    },
    sixMonths: {
      peakUsers: Math.ceil(peakUsers * growthFactor),
      requestsPerSecond: (peakRPS * growthFactor).toFixed(2),
      bandwidthMBps: (bandwidthNeeded * growthFactor).toFixed(2),
      instances: {
        frontend: Math.ceil(frontendInstances * growthFactor),
        backend: Math.ceil(backendInstances * growthFactor),
        database: 2
      }
    },
    recommendations: [
      `Configurer l'auto-scaling pour supporter jusqu'à ${Math.ceil(peakUsers * growthFactor * 1.5)} utilisateurs simultanés`,
      `Prévoir ${(bandwidthNeeded * growthFactor * 1.5).toFixed(2)} MB/s de bande passante pour les pics d'activité`,
      `Mettre en place une réplication de base de données avant d'atteindre ${Math.ceil(peakUsers * 0.8)} utilisateurs simultanés`
    ]
  };
}

// Exporter les utilitaires
module.exports = {
  TEST_SCENARIOS,
  DEFAULT_CONFIG,
  generateK6Script,
  analyzeResults,
  evaluateCapacity,
  testWebSocketLoad,
  generateCapacityPlan
};
