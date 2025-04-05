/**
 * Tests d'intégration pour vérifier la communication entre le dashboard de monitoring et le backend
 * Ce fichier teste spécifiquement la récupération des métriques API et l'affichage dans le dashboard
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;
const sinon = require('sinon');
const { JSDOM } = require('jsdom');

// Charger l'application express pour les tests
const app = require('../../server'); // Assurez-vous que server.js exporte l'app Express
const apiManager = require('../../services/api-manager.service');
const { initializeServices } = require('../../services/initServices');

chai.use(chaiHttp);

describe('Intégration Dashboard Monitoring - API Backend', () => {
  let sandbox;
  
  // Configuration initiale avant tous les tests
  before(() => {
    // Initialiser les services pour les tests
    initializeServices();
    
    // Simuler quelques métriques pour les tests
    generateTestMetrics();
  });
  
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  
  afterEach(() => {
    sandbox.restore();
  });
  
  /**
   * Génère des métriques de test pour simuler l'activité des API
   */
  function generateTestMetrics() {
    // Simuler diverses requêtes pour générer des métriques
    const services = ['weather', 'strava', 'openroute'];
    const methods = ['getWeather', 'getActivities', 'getRoute'];
    
    services.forEach((service, sIndex) => {
      const method = methods[sIndex % methods.length];
      
      // Générer un mélange de succès, échecs et cache hits
      for (let i = 0; i < 10; i++) {
        const isSuccess = Math.random() > 0.2; // 80% de succès
        const isCached = isSuccess && Math.random() > 0.5; // 50% des succès depuis le cache
        
        apiManager.updateMetrics(service, method, {
          success: isSuccess,
          responseTime: isSuccess ? Math.floor(Math.random() * 500) + 50 : 0,
          cached: isCached,
          error: !isSuccess ? new Error(`Test error for ${service}`) : null
        });
      }
    });
  }
  
  it('devrait récupérer les métriques de tous les services via l\'API', (done) => {
    chai.request(app)
      .get('/api/monitoring/api-metrics')
      .set('Authorization', 'Bearer test-token') // Simuler l'authentification
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property('metrics');
        expect(res.body.metrics).to.have.property('weather');
        expect(res.body.metrics).to.have.property('strava');
        expect(res.body.metrics).to.have.property('openroute');
        
        // Vérifier la structure des métriques pour chaque service
        Object.keys(res.body.metrics).forEach(service => {
          const serviceMetrics = res.body.metrics[service];
          expect(serviceMetrics).to.have.property('totalRequests');
          expect(serviceMetrics).to.have.property('successfulRequests');
          expect(serviceMetrics).to.have.property('failedRequests');
          expect(serviceMetrics).to.have.property('cacheHits');
          expect(serviceMetrics).to.have.property('averageResponseTime');
          expect(serviceMetrics).to.have.property('successRate');
        });
        
        done();
      });
  });
  
  it('devrait récupérer les métriques pour un service spécifique', (done) => {
    const testService = 'weather';
    
    chai.request(app)
      .get(`/api/monitoring/api-metrics/${testService}`)
      .set('Authorization', 'Bearer test-token')
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property('serviceName', testService);
        expect(res.body).to.have.property('metrics');
        
        // Vérifier les détails des métriques
        const metrics = res.body.metrics;
        expect(metrics.totalRequests).to.be.at.least(10); // Nous avons généré au moins 10 requêtes
        expect(metrics.successRate).to.be.a('number');
        expect(metrics.averageResponseTime).to.be.a('number');
        
        done();
      });
  });
  
  it('devrait réinitialiser les métriques via l\'API', (done) => {
    chai.request(app)
      .post('/api/monitoring/reset-metrics')
      .set('Authorization', 'Bearer test-token')
      .send({})
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property('message').that.includes('réinitialisées');
        
        // Vérifier que les métriques ont été réinitialisées
        chai.request(app)
          .get('/api/monitoring/api-metrics')
          .set('Authorization', 'Bearer test-token')
          .end((err2, res2) => {
            expect(err2).to.be.null;
            
            // Vérifier que les compteurs sont à zéro
            Object.keys(res2.body.metrics).forEach(service => {
              const serviceMetrics = res2.body.metrics[service];
              expect(serviceMetrics.totalRequests).to.equal(0);
              expect(serviceMetrics.successfulRequests).to.equal(0);
              expect(serviceMetrics.failedRequests).to.equal(0);
              expect(serviceMetrics.cacheHits).to.equal(0);
            });
            
            done();
          });
      });
  });
  
  it('devrait simuler des erreurs d\'API et vérifier le fonctionnement des stratégies de fallback', async () => {
    // Créer un stub pour simuler une erreur dans le service météo
    const weatherService = apiManager.services.weather.service;
    const originalMethod = weatherService.getForecast;
    
    // Remplacer temporairement la méthode par une version qui génère une erreur
    sandbox.stub(weatherService, 'getForecast').callsFake(async () => {
      throw new Error('API Weather temporairement indisponible');
    });
    
    try {
      // Exécuter une requête qui devrait déclencher la stratégie de fallback
      const result = await apiManager.execute('weather', 'getForecast', { lat: 48.5, lon: 7.75 });
      
      // La stratégie de fallback devrait avoir fourni un résultat, même en cas d'erreur
      expect(result).to.not.be.undefined;
      expect(result).to.have.property('source', 'fallback');
    } catch (error) {
      // Si nous arrivons ici, c'est que la stratégie de fallback a échoué
      expect.fail('La stratégie de fallback n\'a pas fonctionné');
    } finally {
      // Restaurer la méthode originale
      weatherService.getForecast = originalMethod;
    }
    
    // Vérifier que l'erreur a été enregistrée dans les métriques
    const metrics = apiManager.getServiceMetrics('weather');
    expect(metrics.failedRequests).to.be.at.least(1);
  });
});

/**
 * Tests pour vérifier que le frontend peut afficher correctement les métriques
 * Ces tests simulent un navigateur pour tester l'intégration frontend-backend
 */
describe('Intégration Frontend Dashboard - Backend API', () => {
  let dom, document, window;
  
  // Préparation du DOM virtuel pour simuler le comportement du frontend
  before(() => {
    // Créer un DOM virtuel avec un contenu HTML minimal pour le dashboard
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Dashboard Monitoring</title>
        </head>
        <body>
          <div id="metrics-container">
            <div id="services-summary"></div>
            <div id="services-details"></div>
          </div>
          <script>
            // Simuler le code JavaScript du dashboard
            window.fetchServiceMetrics = async function() {
              try {
                const response = await fetch('/api/monitoring/api-metrics');
                return await response.json();
              } catch (error) {
                console.error('Erreur lors de la récupération des métriques:', error);
                return { error: true };
              }
            };
            
            window.displayMetrics = function(metrics) {
              const summaryEl = document.getElementById('services-summary');
              const detailsEl = document.getElementById('services-details');
              
              if (metrics.error) {
                summaryEl.innerHTML = '<p>Erreur lors du chargement des métriques</p>';
                return;
              }
              
              // Afficher un résumé des métriques
              let summaryHTML = '<h2>Résumé des services</h2><ul>';
              Object.keys(metrics).forEach(service => {
                const sm = metrics[service];
                summaryHTML += `<li>${service}: ${sm.successRate}% de succès, ${sm.totalRequests} requêtes</li>`;
              });
              summaryHTML += '</ul>';
              summaryEl.innerHTML = summaryHTML;
              
              // Afficher les détails des métriques
              let detailsHTML = '<h2>Détails des services</h2>';
              Object.keys(metrics).forEach(service => {
                const sm = metrics[service];
                detailsHTML += `<div class="service-card">
                  <h3>${service}</h3>
                  <table>
                    <tr><td>Requêtes totales:</td><td>${sm.totalRequests}</td></tr>
                    <tr><td>Requêtes réussies:</td><td>${sm.successfulRequests}</td></tr>
                    <tr><td>Requêtes échouées:</td><td>${sm.failedRequests}</td></tr>
                    <tr><td>Cache hits:</td><td>${sm.cacheHits}</td></tr>
                    <tr><td>Temps moyen:</td><td>${sm.averageResponseTime}ms</td></tr>
                  </table>
                </div>`;
              });
              detailsEl.innerHTML = detailsHTML;
              
              return true;
            };
          </script>
        </body>
      </html>
    `, { runScripts: 'dangerously', resources: 'usable' });
    
    window = dom.window;
    document = window.document;
  });
  
  it('devrait tester l\'intégration frontend-backend en simulant l\'affichage du dashboard', (done) => {
    // Créer un stub pour la méthode fetch du navigateur
    const fetchStub = sinon.stub(window, 'fetch');
    
    // Simuler la réponse de l'API
    const mockResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      metrics: {
        weather: {
          totalRequests: 50,
          successfulRequests: 45,
          failedRequests: 5,
          cacheHits: 20,
          averageResponseTime: 120,
          successRate: 90
        },
        strava: {
          totalRequests: 30,
          successfulRequests: 28,
          failedRequests: 2,
          cacheHits: 15,
          averageResponseTime: 180,
          successRate: 93
        },
        openroute: {
          totalRequests: 25,
          successfulRequests: 22,
          failedRequests: 3,
          cacheHits: 10,
          averageResponseTime: 220,
          successRate: 88
        }
      }
    };
    
    // Configurer le stub pour renvoyer notre réponse simulée
    fetchStub.resolves({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });
    
    // Exécuter le code côté client qui récupère et affiche les métriques
    window.fetchServiceMetrics()
      .then(response => {
        // Vérifier que la réponse est correcte
        expect(response).to.deep.equal(mockResponse);
        
        // Afficher les métriques dans le DOM
        const displayResult = window.displayMetrics(response.metrics);
        expect(displayResult).to.be.true;
        
        // Vérifier que le DOM a été mis à jour correctement
        const summaryEl = document.getElementById('services-summary');
        const detailsEl = document.getElementById('services-details');
        
        // Vérifier que le résumé contient les noms des services
        expect(summaryEl.innerHTML).to.include('weather');
        expect(summaryEl.innerHTML).to.include('strava');
        expect(summaryEl.innerHTML).to.include('openroute');
        
        // Vérifier que les détails contiennent les métriques
        expect(detailsEl.innerHTML).to.include('90');  // Taux de succès weather
        expect(detailsEl.innerHTML).to.include('93');  // Taux de succès strava
        expect(detailsEl.innerHTML).to.include('88');  // Taux de succès openroute
        
        // Vérifier les nombres de requêtes
        expect(detailsEl.innerHTML).to.include('50');  // Total requêtes weather
        expect(detailsEl.innerHTML).to.include('30');  // Total requêtes strava
        expect(detailsEl.innerHTML).to.include('25');  // Total requêtes openroute
        
        done();
      })
      .catch(error => {
        done(error);
      });
  });
  
  afterEach(() => {
    // Restaurer tous les stubs
    if (window.fetch.restore) {
      window.fetch.restore();
    }
  });
});
