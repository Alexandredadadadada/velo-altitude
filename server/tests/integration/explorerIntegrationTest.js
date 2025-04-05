/**
 * Tests d'intégration pour l'Explorateur de Cols
 * Vérifie les performances et la fiabilité sous charge
 */

const axios = require('axios');
const { expect } = require('chai');
const { createCluster } = require('../../config/redis-cluster');
const { setTimeout } = require('timers/promises');
const mongoose = require('mongoose');
const config = require('../../config/config');

// Configuration du redis test
const testRedisCluster = createCluster({
  keyPrefix: 'test:explorer:'
});

// Base URL pour les tests
const API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000/api';

// Points de contrôle pour tests géographiques
const TEST_REGIONS = [
  { name: 'Vosges', lat: 48.0183, lng: 7.0281, radius: 50 },
  { name: 'Alpes', lat: 45.8992, lng: 6.9293, radius: 80 },
  { name: 'Jura', lat: 46.5838, lng: 5.9559, radius: 40 },
  { name: 'Pyrénées', lat: 42.6953, lng: 1.4915, radius: 100 },
  { name: 'Massif Central', lat: 45.7435, lng: 2.9626, radius: 70 }
];

// Paramètres des tests
const TEST_ITERATIONS = 5;
const MAX_RESPONSE_TIME = 500; // ms
const CONCURRENT_REQUESTS = 10;
const CACHE_WARM_UP_WAIT = 1000; // ms

describe('Explorateur de Cols - Tests d\'intégration', function() {
  this.timeout(30000); // 30 secondes pour tous les tests

  before(async function() {
    // Se connecter à la base de test
    await mongoose.connect(config.db.testUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connecté à la base de données de test');
    
    // Préparer les données de test si nécessaire
    await prepareTestData();
    
    // Vider le cache de test
    await clearTestCache();
  });

  after(async function() {
    // Nettoyage final
    await clearTestCache();
    await mongoose.connection.close();
    console.log('Déconnecté de la base de données de test');
  });

  describe('Performance des requêtes de cols par région', function() {
    it('devrait répondre en moins de 500ms pour chaque région', async function() {
      for (const region of TEST_REGIONS) {
        const responseTimes = [];
        
        // Faire plusieurs requêtes pour obtenir une moyenne
        for (let i = 0; i < TEST_ITERATIONS; i++) {
          const startTime = Date.now();
          
          const response = await axios.get(`${API_BASE_URL}/explorer/cols-in-region`, {
            params: {
              lat: region.lat,
              lng: region.lng,
              radius: region.radius
            }
          });
          
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          responseTimes.push(responseTime);
          
          expect(response.status).to.equal(200);
          expect(response.data).to.be.an('object');
          expect(response.data.cols).to.be.an('array');
          
          // Pause pour ne pas surcharger
          await setTimeout(200);
        }
        
        // Calculer et vérifier le temps moyen de réponse
        const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
        console.log(`Temps moyen de réponse pour la région ${region.name}: ${avgResponseTime.toFixed(2)}ms`);
        
        expect(avgResponseTime).to.be.below(MAX_RESPONSE_TIME, 
          `Les requêtes pour la région ${region.name} sont trop lentes (${avgResponseTime.toFixed(2)}ms)`);
      }
    });
    
    it('devrait répondre plus rapidement après mise en cache', async function() {
      for (const region of TEST_REGIONS) {
        // Première requête pour remplir le cache
        await axios.get(`${API_BASE_URL}/explorer/cols-in-region`, {
          params: {
            lat: region.lat,
            lng: region.lng,
            radius: region.radius
          }
        });
        
        // Attendre que le cache soit correctement mis en place
        await setTimeout(CACHE_WARM_UP_WAIT);
        
        // Deuxième série de requêtes, devrait être plus rapide
        const responseTimes = [];
        
        for (let i = 0; i < TEST_ITERATIONS; i++) {
          const startTime = Date.now();
          
          const response = await axios.get(`${API_BASE_URL}/explorer/cols-in-region`, {
            params: {
              lat: region.lat,
              lng: region.lng,
              radius: region.radius
            }
          });
          
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          responseTimes.push(responseTime);
          
          expect(response.status).to.equal(200);
          
          // Pause pour ne pas surcharger
          await setTimeout(200);
        }
        
        // Vérifier l'amélioration des temps de réponse
        const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
        console.log(`Temps moyen de réponse après cache pour la région ${region.name}: ${avgResponseTime.toFixed(2)}ms`);
        
        expect(avgResponseTime).to.be.below(MAX_RESPONSE_TIME / 2, 
          `Les requêtes mises en cache pour ${region.name} ne sont pas assez rapides (${avgResponseTime.toFixed(2)}ms)`);
      }
    });
  });

  describe('Performance des requêtes de détails de col', function() {
    let testColIds = [];
    
    before(async function() {
      // Récupérer quelques IDs de cols pour les tests
      const response = await axios.get(`${API_BASE_URL}/explorer/cols-in-region`, {
        params: {
          lat: TEST_REGIONS[0].lat,
          lng: TEST_REGIONS[0].lng,
          radius: TEST_REGIONS[0].radius
        }
      });
      
      testColIds = response.data.cols.slice(0, 5).map(col => col._id);
      console.log(`Utilisation de ${testColIds.length} cols pour les tests`);
    });
    
    it('devrait récupérer les détails d\'un col en moins de 300ms', async function() {
      for (const colId of testColIds) {
        const responseTimes = [];
        
        for (let i = 0; i < TEST_ITERATIONS; i++) {
          const startTime = Date.now();
          
          const response = await axios.get(`${API_BASE_URL}/explorer/col/${colId}`);
          
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          responseTimes.push(responseTime);
          
          expect(response.status).to.equal(200);
          expect(response.data).to.be.an('object');
          expect(response.data._id).to.equal(colId);
          
          await setTimeout(200);
        }
        
        const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
        console.log(`Temps moyen de réponse pour les détails du col ${colId}: ${avgResponseTime.toFixed(2)}ms`);
        
        expect(avgResponseTime).to.be.below(300, 
          `Les requêtes de détails pour le col ${colId} sont trop lentes (${avgResponseTime.toFixed(2)}ms)`);
      }
    });
    
    it('devrait être mis en cache correctement après la première requête', async function() {
      for (const colId of testColIds) {
        // Vérifier le cache avant
        const cacheKeyBefore = `test:explorer:col:${colId}:details`;
        const cachedBefore = await testRedisCluster.get(cacheKeyBefore);
        
        // Faire la requête
        await axios.get(`${API_BASE_URL}/explorer/col/${colId}`);
        
        // Attendre que le cache soit mis à jour
        await setTimeout(500);
        
        // Vérifier que le cache contient maintenant les données
        const cacheKeyAfter = `test:explorer:col:${colId}:details`;
        const cachedAfter = await testRedisCluster.get(cacheKeyAfter);
        
        expect(cachedAfter).to.exist;
      }
    });
  });

  describe('Performance des données d\'élévation', function() {
    it('devrait récupérer les données d\'élévation pour un parcours', async function() {
      // Simuler un parcours (ligne droite entre deux points)
      const startPoint = { lat: 48.0183, lng: 7.0281 };
      const endPoint = { lat: 48.1183, lng: 7.1281 };
      
      // Générer des points intermédiaires
      const points = [];
      const steps = 10;
      
      for (let i = 0; i <= steps; i++) {
        const lat = startPoint.lat + (endPoint.lat - startPoint.lat) * (i / steps);
        const lng = startPoint.lng + (endPoint.lng - startPoint.lng) * (i / steps);
        points.push({ lat, lng });
      }
      
      const startTime = Date.now();
      
      const response = await axios.post(`${API_BASE_URL}/explorer/elevation-data`, {
        points
      });
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status).to.equal(200);
      expect(response.data).to.be.an('array');
      expect(response.data.length).to.equal(points.length);
      expect(response.data[0]).to.have.property('elevation');
      
      console.log(`Temps de réponse pour les données d'élévation: ${responseTime}ms`);
      expect(responseTime).to.be.below(1000);
    });
  });

  describe('Tests de résilience et charge', function() {
    it('devrait gérer 10 requêtes concurrentes', async function() {
      const region = TEST_REGIONS[0]; // Utiliser la première région pour les tests de charge
      
      const requests = [];
      for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
        requests.push(axios.get(`${API_BASE_URL}/explorer/cols-in-region`, {
          params: {
            lat: region.lat,
            lng: region.lng,
            radius: region.radius
          }
        }));
      }
      
      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;
      
      console.log(`Temps total pour ${CONCURRENT_REQUESTS} requêtes concurrentes: ${totalTime}ms`);
      console.log(`Temps moyen par requête: ${(totalTime / CONCURRENT_REQUESTS).toFixed(2)}ms`);
      
      // Vérifier que toutes les requêtes ont réussi
      for (const response of responses) {
        expect(response.status).to.equal(200);
        expect(response.data.cols).to.be.an('array');
      }
      
      // Le temps moyen par requête devrait être acceptable
      expect(totalTime / CONCURRENT_REQUESTS).to.be.below(MAX_RESPONSE_TIME);
    });
    
    it('devrait récupérer les conditions météo sur les cols', async function() {
      // Récupérer quelques IDs de cols
      const response = await axios.get(`${API_BASE_URL}/explorer/cols-in-region`, {
        params: {
          lat: TEST_REGIONS[0].lat,
          lng: TEST_REGIONS[0].lng,
          radius: TEST_REGIONS[0].radius
        }
      });
      
      const testCols = response.data.cols.slice(0, 3);
      
      for (const col of testCols) {
        const startTime = Date.now();
        
        const weatherResponse = await axios.get(`${API_BASE_URL}/explorer/col-weather/${col._id}`);
        
        const responseTime = Date.now() - startTime;
        
        expect(weatherResponse.status).to.equal(200);
        expect(weatherResponse.data).to.be.an('object');
        expect(weatherResponse.data).to.have.property('weather');
        
        console.log(`Temps de réponse pour la météo du col ${col.name}: ${responseTime}ms`);
        expect(responseTime).to.be.below(1000); // La météo peut être plus lente car dépend d'API externe
      }
    });
  });
});

/**
 * Préparation des données de test
 */
async function prepareTestData() {
  // Cette fonction peut être utilisée pour initialiser des données de test
  // Par exemple, créer des cols fictifs pour les tests
  console.log('Préparation des données de test...');
}

/**
 * Nettoyer le cache de test
 */
async function clearTestCache() {
  console.log('Nettoyage du cache Redis de test...');
  // Effacer toutes les clés du préfixe de test
  const keys = await scanAllKeys(testRedisCluster, 'test:explorer:*');
  
  if (keys.length > 0) {
    await testRedisCluster.del(...keys);
    console.log(`${keys.length} clés supprimées du cache de test`);
  } else {
    console.log('Aucune clé à supprimer dans le cache de test');
  }
}

/**
 * Scanner toutes les clés dans Redis correspondant à un pattern
 * @param {Object} redisClient - Client Redis
 * @param {string} pattern - Pattern de recherche
 * @returns {Promise<Array<string>>} - Liste des clés trouvées
 */
async function scanAllKeys(redisClient, pattern) {
  let cursor = '0';
  const keys = [];
  
  do {
    const [nextCursor, matchedKeys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = nextCursor;
    keys.push(...matchedKeys);
  } while (cursor !== '0');
  
  return keys;
}
