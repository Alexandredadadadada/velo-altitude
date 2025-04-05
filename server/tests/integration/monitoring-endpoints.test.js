/**
 * Tests d'intégration pour les endpoints de monitoring des API
 * Ces tests vérifient que les endpoints de monitoring fonctionnent correctement
 * et retournent les données attendues dans le format approprié.
 */

const chai = require('chai');
const chaiHttp = require('chai-http');
const { expect } = chai;
const sinon = require('sinon');

// Importer les modules nécessaires
let app;
try {
  // Tenter d'importer le serveur Express
  app = require('../../server');
} catch (error) {
  // Si l'import direct ne fonctionne pas, créer une instance d'application Express de test
  console.warn('Impossible de charger le serveur directement, création d\'une instance de test');
  const express = require('express');
  const monitoringRoutes = require('../../routes/api-monitoring.routes');
  
  app = express();
  app.use('/api/monitoring', monitoringRoutes);
}

const apiManager = require('../../services/api-manager.service');
const { initializeServices } = require('../../services/initServices');

chai.use(chaiHttp);

describe('Tests d\'intégration - Endpoints de monitoring API', () => {
  let sandbox;
  let authMiddlewareStub;
  
  before(() => {
    // Initialiser les services avant les tests
    initializeServices();
    
    // Générer des métriques fictives pour les tests
    generateTestMetrics();
    
    // Créer un stub pour le middleware d'authentification afin de ne pas bloquer les tests
    sandbox = sinon.createSandbox();
    authMiddlewareStub = sandbox.stub().callsFake((req, res, next) => next());
    
    // Appliquer le stub aux middlewares d'authentification si nécessaire
    if (app._router) {
      const routes = app._router.stack
        .filter(layer => layer.route && layer.route.path.startsWith('/api/monitoring'));
      
      routes.forEach(route => {
        route.route.stack.forEach(layer => {
          if (layer.name === 'isAuthenticated' || layer.name === 'isAdmin') {
            layer.handle = authMiddlewareStub;
          }
        });
      });
    }
  });
  
  after(() => {
    // Nettoyer les stubs après tous les tests
    sandbox.restore();
  });
  
  /**
   * Génère des métriques de test pour les services API
   */
  function generateTestMetrics() {
    // Générer des métriques pour 'weather'
    for (let i = 0; i < 10; i++) {
      apiManager.updateMetrics('weather', 'getForecast', {
        success: i < 8, // 80% de succès
        responseTime: i < 8 ? 100 + i * 10 : 0,
        cached: i % 3 === 0
      });
    }
    
    // Générer des métriques pour 'strava'
    for (let i = 0; i < 15; i++) {
      apiManager.updateMetrics('strava', 'getActivities', {
        success: i < 13, // ~87% de succès
        responseTime: i < 13 ? 150 + i * 5 : 0,
        cached: i % 4 === 0
      });
    }
    
    // Générer des métriques pour 'openroute'
    for (let i = 0; i < 8; i++) {
      apiManager.updateMetrics('openroute', 'getRoute', {
        success: i < 7, // ~88% de succès
        responseTime: i < 7 ? 200 + i * 15 : 0,
        cached: i % 2 === 0
      });
    }
  }
  
  it('GET /api/monitoring/api-metrics devrait retourner les métriques pour tous les services', (done) => {
    chai.request(app)
      .get('/api/monitoring/api-metrics')
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property('timestamp');
        expect(res.body).to.have.property('metrics');
        
        const { metrics } = res.body;
        
        // Vérifier les services
        expect(metrics).to.have.property('weather');
        expect(metrics).to.have.property('strava');
        expect(metrics).to.have.property('openroute');
        
        // Vérifier la structure des métriques
        ['weather', 'strava', 'openroute'].forEach(service => {
          const serviceMetrics = metrics[service];
          expect(serviceMetrics).to.have.property('totalRequests').that.is.a('number');
          expect(serviceMetrics).to.have.property('successfulRequests').that.is.a('number');
          expect(serviceMetrics).to.have.property('failedRequests').that.is.a('number');
          expect(serviceMetrics).to.have.property('cacheHits').that.is.a('number');
          expect(serviceMetrics).to.have.property('averageResponseTime').that.is.a('number');
          expect(serviceMetrics).to.have.property('successRate').that.is.a('number');
        });
        
        // Vérifier les valeurs spécifiques
        expect(metrics.weather.totalRequests).to.equal(10);
        expect(metrics.weather.successfulRequests).to.equal(8);
        expect(metrics.weather.failedRequests).to.equal(2);
        
        expect(metrics.strava.totalRequests).to.equal(15);
        expect(metrics.strava.successfulRequests).to.equal(13);
        expect(metrics.strava.failedRequests).to.equal(2);
        
        expect(metrics.openroute.totalRequests).to.equal(8);
        expect(metrics.openroute.successfulRequests).to.equal(7);
        expect(metrics.openroute.failedRequests).to.equal(1);
        
        done();
      });
  });
  
  it('GET /api/monitoring/api-metrics/:serviceName devrait retourner les métriques pour un service spécifique', (done) => {
    const testService = 'weather';
    
    chai.request(app)
      .get(`/api/monitoring/api-metrics/${testService}`)
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property('timestamp');
        expect(res.body).to.have.property('serviceName', testService);
        expect(res.body).to.have.property('metrics');
        
        const { metrics } = res.body;
        
        // Vérifier la structure des métriques
        expect(metrics).to.have.property('totalRequests', 10);
        expect(metrics).to.have.property('successfulRequests', 8);
        expect(metrics).to.have.property('failedRequests', 2);
        expect(metrics).to.have.property('cacheHits');
        expect(metrics).to.have.property('averageResponseTime');
        expect(metrics).to.have.property('successRate', 80); // 8/10 * 100
        
        done();
      });
  });
  
  it('GET /api/monitoring/api-metrics/:serviceName devrait retourner 404 pour un service inexistant', (done) => {
    chai.request(app)
      .get('/api/monitoring/api-metrics/service-inexistant')
      .end((err, res) => {
        expect(res).to.have.status(404);
        expect(res.body).to.have.property('error');
        expect(res.body.error).to.equal('Service introuvable');
        done();
      });
  });
  
  it('POST /api/monitoring/reset-metrics devrait réinitialiser toutes les métriques', (done) => {
    chai.request(app)
      .post('/api/monitoring/reset-metrics')
      .send({})
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property('message').that.includes('réinitialisées');
        
        // Vérifier que les métriques ont été réinitialisées
        chai.request(app)
          .get('/api/monitoring/api-metrics')
          .end((err2, res2) => {
            expect(err2).to.be.null;
            
            const { metrics } = res2.body;
            
            // Vérifier que les compteurs sont à zéro
            Object.keys(metrics).forEach(service => {
              expect(metrics[service].totalRequests).to.equal(0);
              expect(metrics[service].successfulRequests).to.equal(0);
              expect(metrics[service].failedRequests).to.equal(0);
              expect(metrics[service].cacheHits).to.equal(0);
            });
            
            done();
          });
      });
  });
  
  it('POST /api/monitoring/reset-metrics avec serviceName devrait réinitialiser uniquement ce service', (done) => {
    // D'abord générer à nouveau des métriques
    generateTestMetrics();
    
    const testService = 'weather';
    
    chai.request(app)
      .post('/api/monitoring/reset-metrics')
      .send({ serviceName: testService })
      .end((err, res) => {
        expect(err).to.be.null;
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('success', true);
        expect(res.body).to.have.property('message').that.includes(testService);
        
        // Vérifier que seules les métriques du service spécifié ont été réinitialisées
        chai.request(app)
          .get('/api/monitoring/api-metrics')
          .end((err2, res2) => {
            expect(err2).to.be.null;
            
            const { metrics } = res2.body;
            
            // Le service réinitialisé devrait avoir tous ses compteurs à zéro
            expect(metrics[testService].totalRequests).to.equal(0);
            expect(metrics[testService].successfulRequests).to.equal(0);
            expect(metrics[testService].failedRequests).to.equal(0);
            
            // Les autres services ne devraient pas être affectés
            expect(metrics.strava.totalRequests).to.equal(15);
            expect(metrics.openroute.totalRequests).to.equal(8);
            
            done();
          });
      });
  });
});
