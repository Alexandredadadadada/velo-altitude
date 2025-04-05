/**
 * Configuration pour les tests de performance k6
 * Définit les environnements et scénarios de test par défaut
 */

export const environments = {
  development: {
    apiBaseUrl: 'http://localhost:5000/api',
    testUserToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXItaWQiLCJyb2xlIjoidXNlciIsImlhdCI6MTYwMDAwMDAwMH0.signature',
    colIds: ['col1', 'col2', 'col3'],
    userIds: ['user1', 'user2'],
    vus: {
      max: 50,
      initial: 10
    },
    duration: '5m',
    thresholds: {
      http_req_duration: ['p(95)<3000'], // 95% des requêtes < 3s en dev
      http_req_failed: ['rate<0.10']     // Taux d'erreur < 10% en dev
    }
  },
  
  staging: {
    apiBaseUrl: 'https://staging-api.grand-est-cyclisme.fr/api',
    testUserToken: process.env.K6_TEST_USER_TOKEN,
    colIds: ['col1', 'col2', 'col3', 'col4', 'col5'],
    userIds: ['user1', 'user2', 'user3'],
    vus: {
      max: 100,
      initial: 20
    },
    duration: '15m',
    thresholds: {
      http_req_duration: ['p(95)<2000'], // 95% des requêtes < 2s en staging
      http_req_failed: ['rate<0.05']     // Taux d'erreur < 5% en staging
    }
  },
  
  production: {
    apiBaseUrl: 'https://api.grand-est-cyclisme.fr/api',
    testUserToken: process.env.K6_TEST_USER_TOKEN,
    colIds: process.env.K6_COL_IDS ? process.env.K6_COL_IDS.split(',') : ['col1', 'col2', 'col3', 'col4', 'col5'],
    userIds: process.env.K6_USER_IDS ? process.env.K6_USER_IDS.split(',') : ['user1', 'user2', 'user3'],
    vus: {
      max: 200,
      initial: 30
    },
    duration: '30m',
    thresholds: {
      http_req_duration: ['p(95)<1500'], // 95% des requêtes < 1.5s en prod
      http_req_failed: ['rate<0.01']     // Taux d'erreur < 1% en prod
    }
  }
};

export const testScenarios = {
  // Test de base - charge constante
  constant_load: {
    executor: 'constant-arrival-rate',
    rate: 10,
    timeUnit: '1s',
    duration: '1m',
    preAllocatedVUs: 20,
    maxVUs: 50,
  },
  
  // Pic de trafic soudain
  traffic_spike: {
    executor: 'ramping-arrival-rate',
    startRate: 5,
    timeUnit: '1s',
    stages: [
      { duration: '30s', target: 50 },
      { duration: '1m', target: 50 },
      { duration: '30s', target: 5 },
    ],
    preAllocatedVUs: 50,
    maxVUs: 100,
  },
  
  // Montée en charge progressive
  ramp_up: {
    executor: 'ramping-arrival-rate',
    startRate: 1,
    timeUnit: '1s',
    stages: [
      { duration: '1m', target: 5 },
      { duration: '1m', target: 10 },
      { duration: '1m', target: 20 },
      { duration: '1m', target: 30 },
      { duration: '1m', target: 40 },
      { duration: '1m', target: 50 },
      { duration: '1m', target: 60 },
    ],
    preAllocatedVUs: 70,
    maxVUs: 100,
  },
  
  // Test d'endurance
  endurance: {
    executor: 'constant-arrival-rate',
    rate: 20,
    timeUnit: '1s',
    duration: '30m',
    preAllocatedVUs: 30,
    maxVUs: 100,
  },
  
  // Test de stress
  stress: {
    executor: 'ramping-arrival-rate',
    startRate: 10,
    timeUnit: '1s',
    stages: [
      { duration: '1m', target: 20 },
      { duration: '1m', target: 40 },
      { duration: '1m', target: 60 },
      { duration: '1m', target: 80 },
      { duration: '1m', target: 100 },
      { duration: '1m', target: 120 },
      { duration: '1m', target: 140 },
      { duration: '1m', target: 160 },
      { duration: '1m', target: 180 },
      { duration: '1m', target: 200 },
    ],
    preAllocatedVUs: 220,
    maxVUs: 250,
  },
  
  // Simulation d'utilisation réelle
  realistic_usage: {
    executor: 'ramping-arrival-rate',
    startRate: 1,
    timeUnit: '1s',
    stages: [
      { duration: '5m', target: 10 },   // Matin - trafic léger
      { duration: '10m', target: 30 },  // Midi - pic d'activité
      { duration: '5m', target: 15 },   // Après-midi - trafic modéré
      { duration: '10m', target: 40 },  // Soir - pic d'activité principal
      { duration: '5m', target: 5 },    // Nuit - trafic faible
    ],
    preAllocatedVUs: 50,
    maxVUs: 100,
  },
  
  // Test des endpoints gourmands en ressources
  heavy_endpoints: {
    executor: 'per-vu-iterations',
    vus: 20,
    iterations: 10,
    maxDuration: '10m',
  },
  
  // Test des endpoints 3D spécifiquement
  visualization_3d: {
    executor: 'constant-arrival-rate',
    rate: 5,  // Taux réduit car endpoint très consommateur
    timeUnit: '1s',
    duration: '5m',
    preAllocatedVUs: 10,
    maxVUs: 30,
  }
};

// Configurations par défaut des seuils pour différents types d'endpoints
export const endpointThresholds = {
  standard: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.01']
  },
  
  data_intensive: {
    http_req_duration: ['p(95)<2000', 'p(99)<4000'],
    http_req_failed: ['rate<0.03']
  },
  
  visualization: {
    http_req_duration: ['p(95)<5000', 'p(99)<10000'],
    http_req_failed: ['rate<0.05']
  },
  
  realtime: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01']
  }
};

// Fonction utilitaire pour combiner les configurations
export function createTestConfig(env = 'development', scenarios = ['constant_load']) {
  const environment = environments[env] || environments.development;
  
  const config = {
    scenarios: {},
    thresholds: { ...environment.thresholds },
    env: {
      API_BASE_URL: environment.apiBaseUrl,
      TEST_USER_TOKEN: environment.testUserToken,
      COL_IDS: Array.isArray(environment.colIds) ? environment.colIds.join(',') : environment.colIds,
      USER_IDS: Array.isArray(environment.userIds) ? environment.userIds.join(',') : environment.userIds
    }
  };
  
  // Ajouter les scénarios demandés
  scenarios.forEach(scenarioName => {
    if (testScenarios[scenarioName]) {
      config.scenarios[scenarioName] = {
        ...testScenarios[scenarioName],
        tags: { scenario: scenarioName }
      };
    }
  });
  
  return config;
}
