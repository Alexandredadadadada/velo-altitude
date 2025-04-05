import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { URL } from 'https://jslib.k6.io/url/1.0.0/index.js';

// Métriques personnalisées
const errorRate = new Rate('error_rate');
const cacheHitRate = new Rate('cache_hit_rate');
const nutritionApiCalls = new Counter('nutrition_api_calls');
const timeToFirstByte = new Trend('ttfb');
const requestDuration = new Trend('req_duration');

// Configuration du test de charge
export const options = {
  scenarios: {
    // Scénario: Charge normale (300 VUs)
    normal_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 },
        { duration: '1m', target: 300 },
        { duration: '2m', target: 300 },
        { duration: '30s', target: 0 }
      ],
      gracefulRampDown: '30s',
    },
    
    // Scénario: Charge élevée (500 VUs)
    high_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 200 },
        { duration: '1m', target: 500 },
        { duration: '3m', target: 500 }, 
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '30s',
      startTime: '5m', // Commence après que normal_load soit terminé
    },
    
    // Scénario: Pic de charge (1000 VUs)
    spike_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 500 },
        { duration: '1m', target: 1000 },
        { duration: '1m', target: 1000 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '30s',
      startTime: '11m', // Commence après que high_load soit terminé
    }
  },
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% des requêtes doivent être inférieures à 500ms
    'http_req_failed': ['rate<0.01'], // Moins de 1% d'erreurs
    'error_rate': ['rate<0.05'], // Taux d'erreur global < 5%
    'cache_hit_rate': ['rate>0.8'], // Taux de cache hit > 80%
    'ttfb': ['p(95)<300'], // 95% des TTFB < 300ms
  },
};

// Liste des utilisateurs tests (générée pour les tests)
const TEST_USERS = Array(1000).fill().map((_, i) => ({
  id: `user_${i+1}`,
  token: `test_token_${i+1}`,
}));

// Routes API à tester
const API_ENDPOINTS = {
  GET_USER_NUTRITION: '/api/nutrition/user-data',
  GET_RECIPES: '/api/nutrition/recipes',
  CALCULATE_NUTRITION: '/api/nutrition/calculate',
  GENERATE_MEAL_PLAN: '/api/nutrition/meal-plan',
  SEARCH_FOOD: '/api/nutrition/food-search',
};

// Initialisation du contexte utilisateur
export function setup() {
  return {
    baseUrl: 'https://dashboard-velo.com', // À remplacer par l'URL de développement/test
    users: TEST_USERS
  };
}

// Fonction principale d'exécution du test de charge
export default function(data) {
  const baseUrl = data.baseUrl;
  
  // Sélectionner un utilisateur aléatoire pour ce VU
  const userIndex = __VU % data.users.length;
  const user = data.users[userIndex];
  
  // Headers communs pour toutes les requêtes
  const headers = {
    'Authorization': `Bearer ${user.token}`,
    'Content-Type': 'application/json',
    'X-Test-User-Id': user.id
  };
  
  // Ajouter un délai variable pour simuler le comportement d'un utilisateur réel
  sleep(randomIntBetween(1, 3));

  // Test des données nutritionnelles de l'utilisateur (lecture avec cache)
  group('User Nutrition Data', function() {
    // Construire l'URL avec paramètres
    const url = new URL(`${baseUrl}${API_ENDPOINTS.GET_USER_NUTRITION}`);
    url.searchParams.append('userId', user.id);
    
    // Première requête (potentiellement un cache miss)
    let response = http.get(url.toString(), { headers });
    
    nutritionApiCalls.add(1);
    timeToFirstByte.add(response.timings.waiting);
    requestDuration.add(response.timings.duration);
    
    // Vérifier la réponse
    check(response, {
      'GET user nutrition status is 200': (r) => r.status === 200,
      'GET user nutrition has valid data': (r) => {
        const body = r.json();
        return body && body.metrics && body.goals;
      },
    }) || errorRate.add(1);
    
    // Simuler un léger délai entre les requêtes
    sleep(randomIntBetween(1, 2));
    
    // Deuxième requête pour vérifier le cache hit
    response = http.get(url.toString(), { headers });
    
    nutritionApiCalls.add(1);
    timeToFirstByte.add(response.timings.waiting);
    requestDuration.add(response.timings.duration);
    
    // Vérifier si la requête a été servie depuis le cache
    const cacheHeader = response.headers['X-Cache'] || '';
    const isCacheHit = cacheHeader.includes('HIT');
    cacheHitRate.add(isCacheHit ? 1 : 0);
    
    check(response, {
      'GET cached user nutrition is fast': (r) => r.timings.duration < 100,
    }) || errorRate.add(1);
  });
  
  // Test de recherche de recettes (endpoint critique à haute utilisation)
  group('Recipe Search', function() {
    // Différents filtres de recettes pour simuler la variété des requêtes
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    const difficulties = ['easy', 'medium', 'hard'];
    
    // Sélectionner des filtres aléatoires
    const randomMealType = mealTypes[randomIntBetween(0, mealTypes.length - 1)];
    const randomDifficulty = difficulties[randomIntBetween(0, difficulties.length - 1)];
    const maxPrepTime = randomIntBetween(15, 60);
    
    // Construire l'URL avec filtres
    const url = new URL(`${baseUrl}${API_ENDPOINTS.GET_RECIPES}`);
    url.searchParams.append('mealType', randomMealType);
    url.searchParams.append('difficulty', randomDifficulty);
    url.searchParams.append('maxPrepTime', maxPrepTime);
    url.searchParams.append('page', 1);
    url.searchParams.append('limit', 12);
    
    // Effectuer la requête GET
    const response = http.get(url.toString(), { headers });
    
    nutritionApiCalls.add(1);
    timeToFirstByte.add(response.timings.waiting);
    requestDuration.add(response.timings.duration);
    
    // Vérifier la réponse
    check(response, {
      'GET recipes status is 200': (r) => r.status === 200,
      'GET recipes returns data': (r) => {
        const body = r.json();
        return body && Array.isArray(body.recipes) && body.pagination;
      },
      'GET recipes response time < 300ms': (r) => r.timings.duration < 300,
    }) || errorRate.add(1);
  });

  // Test de calcul nutritionnel (opération intensive en CPU)
  group('Nutrition Calculation', function() {
    // Données de profil aléatoires pour simuler différentes entrées utilisateur
    const profileData = {
      metrics: {
        weight: randomIntBetween(50, 100),
        height: randomIntBetween(150, 200),
        age: randomIntBetween(18, 70),
        gender: Math.random() > 0.5 ? 'male' : 'female',
        activityLevel: ['sedentary', 'light', 'moderate', 'active', 'veryActive'][randomIntBetween(0, 4)]
      },
      goals: {
        type: ['weightLoss', 'maintenance', 'performance', 'weightGain'][randomIntBetween(0, 3)]
      }
    };
    
    // Effectuer la requête POST
    const response = http.post(
      `${baseUrl}${API_ENDPOINTS.CALCULATE_NUTRITION}`,
      JSON.stringify(profileData),
      { headers }
    );
    
    nutritionApiCalls.add(1);
    timeToFirstByte.add(response.timings.waiting);
    requestDuration.add(response.timings.duration);
    
    // Vérifier la réponse
    check(response, {
      'POST calculation status is 200': (r) => r.status === 200,
      'POST calculation returns nutrition data': (r) => {
        const body = r.json();
        return body && 
               body.dailyCalories && 
               body.dailyProtein && 
               body.dailyCarbs && 
               body.dailyFat;
      },
      'POST calculation response time < 500ms': (r) => r.timings.duration < 500,
    }) || errorRate.add(1);
  });
  
  // Test de génération de plan de repas (opération la plus intensive)
  if (Math.random() < 0.3) { // Seulement 30% des utilisateurs effectuent cette action
    group('Meal Plan Generation', function() {
      // Besoins nutritionnels aléatoires
      const nutritionalRequirements = {
        dailyCalories: randomIntBetween(1600, 3500),
        dailyProtein: randomIntBetween(80, 200),
        dailyCarbs: randomIntBetween(150, 450),
        dailyFat: randomIntBetween(40, 150),
      };
      
      // Préférences alimentaires aléatoires
      const preferences = {
        dietaryRestrictions: Math.random() > 0.7 ? ['gluten'] : [],
        favoriteIngredients: ['chicken', 'rice']
      };
      
      // Effectuer la requête POST
      const response = http.post(
        `${baseUrl}${API_ENDPOINTS.GENERATE_MEAL_PLAN}`,
        JSON.stringify({ 
          userId: user.id,
          nutritionalRequirements,
          preferences 
        }),
        { headers }
      );
      
      nutritionApiCalls.add(1);
      timeToFirstByte.add(response.timings.waiting);
      requestDuration.add(response.timings.duration);
      
      // Vérifier la réponse (cette opération est plus lente, donc seuils plus élevés)
      check(response, {
        'POST meal plan status is 200': (r) => r.status === 200,
        'POST meal plan returns valid plan': (r) => {
          const body = r.json();
          return body && 
                 body.days && 
                 Array.isArray(body.days) && 
                 body.days.length > 0;
        },
        'POST meal plan response time < 800ms': (r) => r.timings.duration < 800,
      }) || errorRate.add(1);
    });
  }
  
  // Test de recherche d'aliments (recherche textuelle, utilisation fréquente)
  group('Food Search', function() {
    // Liste de termes de recherche fréquents
    const searchTerms = [
      'apple', 'banana', 'chicken', 'rice', 'pasta',
      'egg', 'fish', 'beef', 'yogurt', 'cheese',
      'bread', 'oatmeal', 'avocado', 'spinach', 'carrot'
    ];
    
    // Sélectionner un terme aléatoire
    const randomTerm = searchTerms[randomIntBetween(0, searchTerms.length - 1)];
    
    // Construire l'URL avec le terme de recherche
    const url = new URL(`${baseUrl}${API_ENDPOINTS.SEARCH_FOOD}`);
    url.searchParams.append('query', randomTerm);
    url.searchParams.append('limit', 20);
    
    // Effectuer la requête GET
    const response = http.get(url.toString(), { headers });
    
    nutritionApiCalls.add(1);
    timeToFirstByte.add(response.timings.waiting);
    requestDuration.add(response.timings.duration);
    
    // Vérifier la réponse
    check(response, {
      'GET food search status is 200': (r) => r.status === 200,
      'GET food search returns results': (r) => {
        const body = r.json();
        return body && Array.isArray(body) && body.length >= 0;
      },
      'GET food search response time < 200ms': (r) => r.timings.duration < 200,
    }) || errorRate.add(1);
  });
  
  // Délai entre les itérations pour simuler un comportement utilisateur réaliste
  sleep(randomIntBetween(3, 8));
}

// Fonction de teardown pour nettoyer ou générer des rapports
export function teardown(data) {
  // Pas de nettoyage nécessaire pour ce test
}
