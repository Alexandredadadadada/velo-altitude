import { sleep, check, group } from 'k6';
import http from 'k6/http';
import { Trend, Rate, Counter } from 'k6/metrics';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { SharedArray } from 'k6/data';
import { createTestConfig } from '../../scripts/k6-config.js';

// Métriques personnalisées pour suivre spécifiquement les performances des API de nutrition
const nutritionCalculationTime = new Trend('nutrition_calculation_time');
const nutritionApiErrorRate = new Rate('nutrition_api_error_rate');
const nutritionApiRequests = new Counter('nutrition_api_requests');
const macronutrientCalculationTime = new Trend('macronutrient_calculation_time');
const nutritionPlanGenerationTime = new Trend('nutrition_plan_generation_time');

// Chargement des données d'utilisateurs pour les tests
const testUsers = new SharedArray('test users', function() {
  // Normalement, nous chargerions cela depuis un fichier JSON, mais pour simplifier, on les définit directement
  return [
    { id: 'user1', weight: 70, height: 178, age: 35, gender: 'male', activityLevel: 'moderate', ftpWatts: 250 },
    { id: 'user2', weight: 65, height: 172, age: 28, gender: 'female', activityLevel: 'very_active', ftpWatts: 220 },
    { id: 'user3', weight: 80, height: 185, age: 42, gender: 'male', activityLevel: 'extremely_active', ftpWatts: 280 },
    { id: 'user4', weight: 68, height: 168, age: 31, gender: 'female', activityLevel: 'moderate', ftpWatts: 195 },
    { id: 'user5', weight: 75, height: 180, age: 39, gender: 'male', activityLevel: 'active', ftpWatts: 265 }
  ];
});

// Configuration des activités d'entraînement pour tester le calcul des besoins énergétiques
const trainingActivities = [
  { type: 'endurance', duration: 120, intensity: 'low' },
  { type: 'tempo', duration: 90, intensity: 'medium' },
  { type: 'intervals', duration: 60, intensity: 'high' },
  { type: 'recovery', duration: 45, intensity: 'very_low' },
  { type: 'ftp_test', duration: 75, intensity: 'very_high' }
];

// Différents objectifs nutritionnels pour les tests
const nutritionGoals = ['performance', 'weight_loss', 'muscle_gain', 'endurance', 'recovery'];

// Configuration par défaut des tests k6
export const options = createTestConfig('development', ['constant_load']);

// Si SCENARIO est fourni via les variables d'environnement, on n'utilise que ce scénario
if (__ENV.SCENARIO) {
  options.scenarios = {
    [__ENV.SCENARIO]: options.scenarios[__ENV.SCENARIO]
  };
}

// Configuration par défaut des variables d'environnement
const API_BASE_URL = __ENV.API_BASE_URL || 'http://localhost:5000/api';
const TEST_USER_TOKEN = __ENV.TEST_USER_TOKEN || 'test-token';

export function setup() {
  // Vérification que les API de nutrition sont disponibles
  const healthCheck = http.get(`${API_BASE_URL}/health`);
  check(healthCheck, {
    'API health check passed': (r) => r.status === 200
  });

  return {
    baseUrl: API_BASE_URL,
    token: TEST_USER_TOKEN
  };
}

export default function(data) {
  const baseUrl = data.baseUrl;
  const token = data.token;

  // En-têtes communs pour toutes les requêtes
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Sélection aléatoire d'un utilisateur et d'une activité pour cette itération
  const user = testUsers[randomIntBetween(0, testUsers.length - 1)];
  const activity = trainingActivities[randomIntBetween(0, trainingActivities.length - 1)];
  const goal = nutritionGoals[randomIntBetween(0, nutritionGoals.length - 1)];

  // 1. Test du calculateur de besoins nutritionnels de base
  group('Nutrition Calculator - Basic Needs', function() {
    const payload = {
      userId: user.id,
      weight: user.weight,
      height: user.height,
      age: user.age,
      gender: user.gender,
      activityLevel: user.activityLevel,
      goal: goal
    };

    const startTime = new Date().getTime();
    const response = http.post(`${baseUrl}/nutrition/calculate-needs`, JSON.stringify(payload), { headers });
    const endTime = new Date().getTime();
    const duration = endTime - startTime;

    nutritionCalculationTime.add(duration);
    nutritionApiRequests.add(1);

    check(response, {
      'Basic nutrition needs calculated successfully': (r) => r.status === 200,
      'Response contains caloric needs': (r) => r.json().hasOwnProperty('caloricNeeds'),
      'Response contains macronutrients': (r) => r.json().hasOwnProperty('macronutrients')
    }) || nutritionApiErrorRate.add(1);

    if (response.status === 200) {
      console.log(`Basic nutrition calculation completed in ${duration}ms for user with ${user.weight}kg and ${user.activityLevel} activity level`);
    }

    // Pause brève pour simuler le comportement utilisateur
    sleep(1);
  });

  // 2. Test du calculateur de nutrition pour les cyclistes (avec données d'entraînement)
  group('Nutrition Calculator - Cyclist Specific', function() {
    const payload = {
      userId: user.id,
      weight: user.weight,
      height: user.height,
      age: user.age,
      gender: user.gender,
      ftpWatts: user.ftpWatts,
      trainingPhase: ['base', 'build', 'peak', 'recovery'][randomIntBetween(0, 3)],
      weeklyTrainingHours: randomIntBetween(5, 20),
      upcomingEvent: randomIntBetween(0, 1) === 1 ? {
        type: ['race', 'long_ride', 'sportive'][randomIntBetween(0, 2)],
        daysUntil: randomIntBetween(7, 60)
      } : null,
      goal: goal
    };

    const startTime = new Date().getTime();
    const response = http.post(`${baseUrl}/nutrition/cyclist-needs`, JSON.stringify(payload), { headers });
    const endTime = new Date().getTime();
    const duration = endTime - startTime;

    nutritionCalculationTime.add(duration);
    nutritionApiRequests.add(1);

    check(response, {
      'Cyclist nutrition needs calculated successfully': (r) => r.status === 200,
      'Response contains training-adjusted needs': (r) => r.json().hasOwnProperty('trainingAdjustedNeeds'),
      'Response contains performance recommendations': (r) => r.json().hasOwnProperty('performanceRecommendations')
    }) || nutritionApiErrorRate.add(1);

    if (response.status === 200) {
      console.log(`Cyclist nutrition calculation completed in ${duration}ms for user with FTP ${user.ftpWatts}W`);
    }

    // Pause brève pour simuler le comportement utilisateur
    sleep(1);
  });

  // 3. Test du calcul des besoins nutritionnels pour une activité spécifique
  group('Nutrition Calculator - Per Activity', function() {
    const payload = {
      userId: user.id,
      weight: user.weight,
      activityType: activity.type,
      duration: activity.duration,
      intensity: activity.intensity,
      temperature: randomIntBetween(5, 35),
      altitude: randomIntBetween(0, 2500),
      goal: goal
    };

    const startTime = new Date().getTime();
    const response = http.post(`${baseUrl}/nutrition/activity-needs`, JSON.stringify(payload), { headers });
    const endTime = new Date().getTime();
    const duration = endTime - startTime;

    macronutrientCalculationTime.add(duration);
    nutritionApiRequests.add(1);

    check(response, {
      'Activity nutrition needs calculated successfully': (r) => r.status === 200,
      'Response contains pre-activity nutrition': (r) => r.json().hasOwnProperty('preActivity'),
      'Response contains during-activity nutrition': (r) => r.json().hasOwnProperty('duringActivity'),
      'Response contains post-activity nutrition': (r) => r.json().hasOwnProperty('postActivity')
    }) || nutritionApiErrorRate.add(1);

    if (response.status === 200) {
      console.log(`Activity nutrition calculation completed in ${duration}ms for ${activity.intensity} intensity ${activity.type} activity`);
    }

    // Pause plus longue pour ce test plus complexe
    sleep(2);
  });

  // 4. Test de génération d'un plan nutritionnel complet (opération lourde)
  if (randomIntBetween(1, 5) === 1) { // Exécuté seulement 20% du temps car plus coûteux
    group('Nutrition Plan Generation', function() {
      const payload = {
        userId: user.id,
        weight: user.weight,
        height: user.height,
        age: user.age,
        gender: user.gender,
        activityLevel: user.activityLevel,
        ftpWatts: user.ftpWatts,
        goal: goal,
        planDuration: [7, 14, 28][randomIntBetween(0, 2)], // 1, 2 ou 4 semaines
        dietaryPreferences: ['balanced', 'high_carb', 'high_protein', 'low_carb', 'mediterranean'][randomIntBetween(0, 4)],
        allergies: randomIntBetween(0, 1) === 1 ? ['dairy', 'gluten', 'nuts', 'seafood'].slice(0, randomIntBetween(0, 3)) : [],
        trainingSchedule: {
          monday: randomIntBetween(0, 1) === 1 ? trainingActivities[randomIntBetween(0, trainingActivities.length - 1)] : null,
          tuesday: randomIntBetween(0, 1) === 1 ? trainingActivities[randomIntBetween(0, trainingActivities.length - 1)] : null,
          wednesday: randomIntBetween(0, 1) === 1 ? trainingActivities[randomIntBetween(0, trainingActivities.length - 1)] : null,
          thursday: randomIntBetween(0, 1) === 1 ? trainingActivities[randomIntBetween(0, trainingActivities.length - 1)] : null,
          friday: randomIntBetween(0, 1) === 1 ? trainingActivities[randomIntBetween(0, trainingActivities.length - 1)] : null,
          saturday: randomIntBetween(0, 1) === 1 ? trainingActivities[randomIntBetween(0, trainingActivities.length - 1)] : null,
          sunday: randomIntBetween(0, 1) === 1 ? trainingActivities[randomIntBetween(0, trainingActivities.length - 1)] : null
        }
      };

      const startTime = new Date().getTime();
      const response = http.post(`${baseUrl}/nutrition/generate-plan`, JSON.stringify(payload), {
        headers,
        timeout: '60s' // Augmentation du timeout pour cette opération lourde
      });
      const endTime = new Date().getTime();
      const duration = endTime - startTime;

      nutritionPlanGenerationTime.add(duration);
      nutritionApiRequests.add(1);

      check(response, {
        'Nutrition plan generated successfully': (r) => r.status === 200,
        'Plan contains daily menus': (r) => r.json().hasOwnProperty('dailyMenus') && r.json().dailyMenus.length > 0,
        'Plan contains shopping list': (r) => r.json().hasOwnProperty('shoppingList'),
        'Plan contains nutritional summary': (r) => r.json().hasOwnProperty('nutritionalSummary')
      }) || nutritionApiErrorRate.add(1);

      if (response.status === 200) {
        console.log(`Nutrition plan generation completed in ${duration}ms for ${payload.planDuration}-day plan`);
      }

      // Pause plus longue après cette opération lourde
      sleep(3);
    });
  }

  // 5. Test de récupération et performance du cache
  group('Nutrition API - Cache Performance', function() {
    // Première requête - devrait utiliser la base de données
    const firstRequestStart = new Date().getTime();
    const firstResponse = http.get(`${baseUrl}/nutrition/user/${user.id}/latest-calculation`, { headers });
    const firstRequestDuration = new Date().getTime() - firstRequestStart;

    // Seconde requête immédiate - devrait utiliser le cache
    const secondRequestStart = new Date().getTime();
    const secondResponse = http.get(`${baseUrl}/nutrition/user/${user.id}/latest-calculation`, { headers });
    const secondRequestDuration = new Date().getTime() - secondRequestStart;

    check(firstResponse, {
      'First request successful': (r) => r.status === 200
    });

    check(secondResponse, {
      'Second request successful': (r) => r.status === 200,
      'Cache improves performance': (r) => secondRequestDuration < firstRequestDuration * 0.8
    });

    console.log(`Cache performance: First request ${firstRequestDuration}ms, Second request ${secondRequestDuration}ms`);
    
    // Pause brève
    sleep(1);
  });
}

export function teardown(data) {
  // Nettoyage éventuel après les tests
  console.log('Nutrition API tests completed');
}
