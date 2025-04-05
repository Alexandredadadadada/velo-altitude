/**
 * Tests d'intégration API
 * Implémente les recommandations de l'Agent 3 (Assurance Qualité & Intégration)
 */
const axios = require('axios');
const { setupTestServer, teardownTestServer, createTestUser, cleanupTestData } = require('../test-utils');

let server;
let baseUrl;
let testUser;

// Configuration globale avant tous les tests
beforeAll(async () => {
  jest.setTimeout(30000); // Augmenter le timeout pour le démarrage du serveur
  server = await setupTestServer();
  baseUrl = `${server.url}/api`;
});

// Nettoyage après tous les tests
afterAll(async () => {
  if (testUser && testUser.token) {
    await cleanupTestData(baseUrl, testUser.token);
  }
  await teardownTestServer(server);
});

describe('API Integration Tests', () => {
  // Test du flux complet d'authentification
  describe('Authentication Flow', () => {
    test('Should register, login and access protected resources', async () => {
      // 1. Enregistrement d'un utilisateur de test
      const email = `cyclist-${Date.now()}@example.com`;
      const password = 'TestPassword123!';
      const name = 'Test Cyclist';
      
      const registerResponse = await axios.post(`${baseUrl}/auth/register`, {
        email,
        password,
        name
      });
      
      expect(registerResponse.status).toBe(201);
      expect(registerResponse.data).toHaveProperty('userId');
      expect(registerResponse.data).toHaveProperty('email', email);
      
      const userId = registerResponse.data.userId;
      
      // 2. Connexion avec l'utilisateur créé
      const loginResponse = await axios.post(`${baseUrl}/auth/login`, {
        email,
        password
      });
      
      expect(loginResponse.status).toBe(200);
      expect(loginResponse.data).toHaveProperty('token');
      expect(loginResponse.data).toHaveProperty('userId', userId);
      
      const token = loginResponse.data.token;
      
      // Sauvegarder l'utilisateur de test pour les autres tests
      testUser = { id: userId, email, token };
      
      // 3. Accès à une ressource protégée (profil utilisateur)
      const profileResponse = await axios.get(`${baseUrl}/users/${userId}/profile`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      expect(profileResponse.status).toBe(200);
      expect(profileResponse.data).toHaveProperty('name', name);
      expect(profileResponse.data).toHaveProperty('email', email);
      
      // 4. Tentative d'accès sans authentification
      try {
        await axios.get(`${baseUrl}/users/${userId}/profile`);
        // Cette requête devrait échouer
        fail('Request should have failed without authentication');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
      
      // 5. Tentative d'accès avec un token invalide
      try {
        await axios.get(`${baseUrl}/users/${userId}/profile`, {
          headers: {
            Authorization: 'Bearer invalid-token'
          }
        });
        // Cette requête devrait échouer
        fail('Request should have failed with invalid token');
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });
  });
  
  // Test du flux social avec création et récupération de posts
  describe('Social Posts Flow', () => {
    beforeAll(async () => {
      // Si testUser n'est pas défini, créer un nouvel utilisateur de test
      if (!testUser) {
        testUser = await createTestUser(baseUrl);
      }
    });
    
    test('Should create, retrieve and interact with social posts', async () => {
      // 1. Créer un nouveau post
      const postContent = `Test cycling post content ${Date.now()}`;
      const createPostResponse = await axios.post(`${baseUrl}/social/posts`, {
        content: postContent,
        type: 'text',
        visibility: 'public'
      }, {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(createPostResponse.status).toBe(201);
      expect(createPostResponse.data).toHaveProperty('id');
      expect(createPostResponse.data).toHaveProperty('content', postContent);
      
      const postId = createPostResponse.data.id;
      
      // 2. Récupérer le post créé
      const getPostResponse = await axios.get(`${baseUrl}/social/posts/${postId}`, {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(getPostResponse.status).toBe(200);
      expect(getPostResponse.data).toHaveProperty('content', postContent);
      expect(getPostResponse.data).toHaveProperty('author.id', testUser.id);
      
      // 3. Ajouter un commentaire
      const commentContent = 'Test comment on cycling post';
      const addCommentResponse = await axios.post(`${baseUrl}/social/posts/${postId}/comments`, {
        content: commentContent
      }, {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(addCommentResponse.status).toBe(201);
      expect(addCommentResponse.data).toHaveProperty('id');
      expect(addCommentResponse.data).toHaveProperty('content', commentContent);
      
      // 4. Vérifier que le commentaire a été ajouté
      const getUpdatedPostResponse = await axios.get(`${baseUrl}/social/posts/${postId}`, {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(getUpdatedPostResponse.status).toBe(200);
      expect(getUpdatedPostResponse.data.comments).toHaveLength(1);
      expect(getUpdatedPostResponse.data.comments[0].content).toBe(commentContent);
      
      // 5. "Liker" le post
      const likePostResponse = await axios.post(`${baseUrl}/social/posts/${postId}/likes`, {}, {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(likePostResponse.status).toBe(200);
      
      // 6. Vérifier que le like a été comptabilisé
      const getLikedPostResponse = await axios.get(`${baseUrl}/social/posts/${postId}`, {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(getLikedPostResponse.status).toBe(200);
      expect(getLikedPostResponse.data.likesCount).toBe(1);
      expect(getLikedPostResponse.data.likedByCurrentUser).toBe(true);
    });
  });
  
  // Test du flux de planification d'itinéraire cycliste
  describe('Cycling Route Planning Flow', () => {
    beforeAll(async () => {
      // Si testUser n'est pas défini, créer un nouvel utilisateur de test
      if (!testUser) {
        testUser = await createTestUser(baseUrl);
      }
    });
    
    test('Should plan, analyze and save cycling routes', async () => {
      // 1. Planifier un itinéraire
      const planRouteResponse = await axios.post(`${baseUrl}/routes/plan`, {
        start: { lat: 48.5734, lng: 7.7521 }, // Strasbourg
        end: { lat: 48.6921, lng: 6.1844 },   // Nancy
        preferences: {
          routeType: 'road',
          avoidHighways: true,
          maxGradient: 8
        }
      }, {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(planRouteResponse.status).toBe(200);
      expect(planRouteResponse.data).toHaveProperty('distance');
      expect(planRouteResponse.data).toHaveProperty('duration');
      expect(planRouteResponse.data).toHaveProperty('points');
      expect(planRouteResponse.data).toHaveProperty('id');
      
      const routeId = planRouteResponse.data.id;
      
      // 2. Récupérer les données d'élévation pour cet itinéraire
      const elevationDataResponse = await axios.get(
        `${baseUrl}/routes/${routeId}/elevation`,
        {
          headers: {
            Authorization: `Bearer ${testUser.token}`
          }
        }
      );
      
      expect(elevationDataResponse.status).toBe(200);
      expect(elevationDataResponse.data).toHaveProperty('profile');
      expect(elevationDataResponse.data.profile).toBeInstanceOf(Array);
      expect(elevationDataResponse.data).toHaveProperty('stats');
      expect(elevationDataResponse.data.stats).toHaveProperty('maxElevation');
      expect(elevationDataResponse.data.stats).toHaveProperty('totalAscent');
      expect(elevationDataResponse.data.stats).toHaveProperty('totalDescent');
      
      // 3. Récupérer les données météo pour cet itinéraire
      const weatherDataResponse = await axios.get(
        `${baseUrl}/routes/${routeId}/weather`,
        {
          headers: {
            Authorization: `Bearer ${testUser.token}`
          }
        }
      );
      
      expect(weatherDataResponse.status).toBe(200);
      expect(weatherDataResponse.data).toHaveProperty('current');
      expect(weatherDataResponse.data).toHaveProperty('forecast');
      expect(weatherDataResponse.data.forecast).toBeInstanceOf(Array);
      
      // 4. Sauvegarder l'itinéraire
      const routeName = 'Strasbourg to Nancy Test Route';
      const saveRouteResponse = await axios.post(`${baseUrl}/routes/save`, {
        routeId,
        name: routeName,
        description: 'Beautiful countryside route for testing'
      }, {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(saveRouteResponse.status).toBe(201);
      expect(saveRouteResponse.data).toHaveProperty('id');
      expect(saveRouteResponse.data).toHaveProperty('name', routeName);
      
      // 5. Récupérer les itinéraires sauvegardés
      const getSavedRoutesResponse = await axios.get(`${baseUrl}/routes/saved`, {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(getSavedRoutesResponse.status).toBe(200);
      expect(getSavedRoutesResponse.data).toBeInstanceOf(Array);
      const savedRoute = getSavedRoutesResponse.data.find(route => route.name === routeName);
      expect(savedRoute).toBeTruthy();
      expect(savedRoute.id).toBeTruthy();
      
      // 6. Récupérer un itinéraire sauvegardé spécifique
      const getSavedRouteResponse = await axios.get(`${baseUrl}/routes/saved/${savedRoute.id}`, {
        headers: {
          Authorization: `Bearer ${testUser.token}`
        }
      });
      
      expect(getSavedRouteResponse.status).toBe(200);
      expect(getSavedRouteResponse.data).toHaveProperty('name', routeName);
      expect(getSavedRouteResponse.data).toHaveProperty('points');
      expect(getSavedRouteResponse.data).toHaveProperty('distance');
    });
  });
  
  // Test du flux d'intégration météo
  describe('Weather Integration Flow', () => {
    beforeAll(async () => {
      // Si testUser n'est pas défini, créer un nouvel utilisateur de test
      if (!testUser) {
        testUser = await createTestUser(baseUrl);
      }
    });
    
    test('Should retrieve weather data for cycling locations', async () => {
      // 1. Récupérer les données météo pour une position
      const locationWeatherResponse = await axios.get(
        `${baseUrl}/weather?lat=48.5734&lng=7.7521`, // Strasbourg
        {
          headers: {
            Authorization: `Bearer ${testUser.token}`
          }
        }
      );
      
      expect(locationWeatherResponse.status).toBe(200);
      expect(locationWeatherResponse.data).toHaveProperty('current');
      expect(locationWeatherResponse.data.current).toHaveProperty('temperature');
      expect(locationWeatherResponse.data.current).toHaveProperty('humidity');
      expect(locationWeatherResponse.data.current).toHaveProperty('windSpeed');
      expect(locationWeatherResponse.data.current).toHaveProperty('description');
      expect(locationWeatherResponse.data).toHaveProperty('daily');
      expect(locationWeatherResponse.data.daily).toBeInstanceOf(Array);
      
      // 2. Récupérer les prévisions météo pour les 5 prochains jours
      const forecastResponse = await axios.get(
        `${baseUrl}/weather/forecast?lat=48.5734&lng=7.7521&days=5`, // Strasbourg, 5 jours
        {
          headers: {
            Authorization: `Bearer ${testUser.token}`
          }
        }
      );
      
      expect(forecastResponse.status).toBe(200);
      expect(forecastResponse.data).toBeInstanceOf(Array);
      expect(forecastResponse.data.length).toBe(5);
      expect(forecastResponse.data[0]).toHaveProperty('date');
      expect(forecastResponse.data[0]).toHaveProperty('temperature');
      expect(forecastResponse.data[0]).toHaveProperty('precipitation');
      
      // 3. Récupérer la qualité de l'air
      const airQualityResponse = await axios.get(
        `${baseUrl}/weather/air-quality?lat=48.5734&lng=7.7521`, // Strasbourg
        {
          headers: {
            Authorization: `Bearer ${testUser.token}`
          }
        }
      );
      
      expect(airQualityResponse.status).toBe(200);
      expect(airQualityResponse.data).toHaveProperty('aqi'); // Air Quality Index
      expect(airQualityResponse.data).toHaveProperty('components');
      expect(airQualityResponse.data.components).toHaveProperty('co'); // Monoxyde de carbone
      expect(airQualityResponse.data.components).toHaveProperty('no2'); // Dioxyde d'azote
      expect(airQualityResponse.data.components).toHaveProperty('o3'); // Ozone
      expect(airQualityResponse.data.components).toHaveProperty('pm2_5'); // Particules fines
    });
  });
  
  // Test des appels API avec mise en cache et monitoring
  describe('API Caching and Monitoring', () => {
    test('Should cache API responses correctly', async () => {
      // 1. Premier appel - devrait aller à l'API externe
      const startTime1 = Date.now();
      const firstResponse = await axios.get(
        `${baseUrl}/weather?lat=48.5734&lng=7.7521`, // Strasbourg
        {
          headers: {
            Authorization: `Bearer ${testUser.token}`
          }
        }
      );
      const duration1 = Date.now() - startTime1;
      
      expect(firstResponse.status).toBe(200);
      
      // 2. Deuxième appel - devrait venir du cache
      const startTime2 = Date.now();
      const secondResponse = await axios.get(
        `${baseUrl}/weather?lat=48.5734&lng=7.7521`, // Même requête
        {
          headers: {
            Authorization: `Bearer ${testUser.token}`
          }
        }
      );
      const duration2 = Date.now() - startTime2;
      
      expect(secondResponse.status).toBe(200);
      
      // Le second appel devrait être significativement plus rapide
      // Note: ce test peut être fragile selon l'environnement
      expect(duration2).toBeLessThan(duration1 * 0.5);
      
      // 3. Récupérer les statistiques de monitoring
      const monitoringResponse = await axios.get(
        `${baseUrl}/admin/monitoring`,
        {
          headers: {
            Authorization: `Bearer ${testUser.token}`
          }
        }
      );
      
      expect(monitoringResponse.status).toBe(200);
      expect(monitoringResponse.data).toHaveProperty('summary');
      expect(monitoringResponse.data.summary).toHaveProperty('totalCalls');
      expect(monitoringResponse.data.summary.totalCalls).toBeGreaterThanOrEqual(2);
      expect(monitoringResponse.data.summary).toHaveProperty('totalCacheHits');
      expect(monitoringResponse.data.summary.totalCacheHits).toBeGreaterThanOrEqual(1);
    });
  });
});
