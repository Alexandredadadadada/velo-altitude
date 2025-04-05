/**
 * Tests d'intégration pour le gestionnaire d'API et résolution des dépendances circulaires
 * Ces tests vérifient que l'initialisation des services fonctionne correctement
 * et que les dépendances circulaires sont bien résolues.
 */

const { expect } = require('chai');
const sinon = require('sinon');
const { initializeServices } = require('../../services/initServices');
const apiManager = require('../../services/api-manager.service');

describe('API Manager et Initialisation des Services', () => {
  let sandbox;
  
  beforeEach(() => {
    // Créer un sandbox pour isoler les tests
    sandbox = sinon.createSandbox();
    
    // Réinitialiser les métriques entre les tests
    apiManager.resetAllMetrics();
  });
  
  afterEach(() => {
    // Restaurer les stubs après chaque test
    sandbox.restore();
  });
  
  it('devrait initialiser tous les services sans erreur', () => {
    // Vérifier que la fonction d'initialisation s'exécute sans erreur
    expect(() => initializeServices()).to.not.throw();
    
    // Vérifier que les services ont été enregistrés
    expect(apiManager.services).to.have.property('weather');
    expect(apiManager.services).to.have.property('strava');
    expect(apiManager.services).to.have.property('openroute');
  });
  
  it('devrait gérer les dépendances circulaires correctement', () => {
    // Vérifier que les services peuvent s'appeler mutuellement
    const weatherService = apiManager.services.weather;
    const stravaService = apiManager.services.strava;
    const openRouteService = apiManager.services.openroute;
    
    // Vérifier que les services peuvent obtenir une référence à l'ApiManager
    expect(weatherService).to.not.be.undefined;
    expect(stravaService).to.not.be.undefined;
    expect(openRouteService).to.not.be.undefined;
    
    // Aucune erreur ne devrait être levée lors de l'accès aux services
    expect(() => {
      const serviceNames = Object.keys(apiManager.services);
      serviceNames.forEach(name => {
        const service = apiManager.services[name].service;
        expect(service).to.not.be.undefined;
      });
    }).to.not.throw();
  });
  
  it('devrait récupérer les métriques de tous les services', () => {
    // Initialiser les services
    initializeServices();
    
    // Simuler l'exécution de quelques requêtes pour générer des métriques
    const mockRequest = {
      success: true,
      responseTime: 150,
      cached: false
    };
    
    // Enregistrer quelques métriques pour le test
    apiManager.updateMetrics('weather', 'getWeather', mockRequest);
    apiManager.updateMetrics('strava', 'getActivities', mockRequest);
    apiManager.updateMetrics('openroute', 'getRoute', mockRequest);
    
    // Récupérer toutes les métriques
    const allMetrics = apiManager.getAllMetrics();
    
    // Vérifier que les métriques sont bien présentes pour chaque service
    expect(allMetrics).to.have.property('weather');
    expect(allMetrics).to.have.property('strava');
    expect(allMetrics).to.have.property('openroute');
    
    // Vérifier les compteurs de requêtes
    expect(allMetrics.weather.totalRequests).to.equal(1);
    expect(allMetrics.strava.totalRequests).to.equal(1);
    expect(allMetrics.openroute.totalRequests).to.equal(1);
  });
  
  it('devrait exécuter des requêtes en parallèle avec le service OpenRoute', async () => {
    // Initialiser les services
    initializeServices();
    
    // Créer un stub pour la méthode getRoute d'OpenRouteService pour éviter les appels réels à l'API
    const openRouteService = apiManager.services.openroute.service;
    const getRouteStub = sandbox.stub(openRouteService, 'getRoute').resolves({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [[4.85, 45.75], [4.86, 45.76], [4.87, 45.77]]
      },
      properties: {
        segments: [{ distance: 5000, duration: 1200 }],
        summary: { distance: 5000, duration: 1200 }
      }
    });
    
    // Préparer des requêtes pour le traitement par lots
    const routeRequests = [
      {
        start: [4.85, 45.75],
        end: [4.87, 45.77],
        options: { profile: 'cycling-road' }
      },
      {
        start: [4.87, 45.77],
        end: [4.89, 45.79],
        options: { profile: 'cycling-road' }
      },
      {
        start: [4.89, 45.79],
        end: [4.91, 45.81],
        options: { profile: 'cycling-road' }
      }
    ];
    
    // Exécuter le traitement par lots
    const result = await openRouteService.getBatchRoutes(routeRequests);
    
    // Vérifier que toutes les requêtes ont été traitées
    expect(result.stats.total).to.equal(routeRequests.length);
    expect(result.stats.successful).to.equal(routeRequests.length);
    
    // Vérifier que getRoute a été appelé pour chaque requête
    expect(getRouteStub.callCount).to.equal(routeRequests.length);
  });
  
  it('devrait récupérer les métriques pour un service spécifique', () => {
    // Initialiser les services
    initializeServices();
    
    // Simuler quelques requêtes réussies et en échec
    const successRequest = { success: true, responseTime: 150, cached: false };
    const failedRequest = { success: false, error: new Error('Test error') };
    const cachedRequest = { success: true, responseTime: 10, cached: true };
    
    // Enregistrer les métriques
    apiManager.updateMetrics('weather', 'getWeather', successRequest);
    apiManager.updateMetrics('weather', 'getWeather', failedRequest);
    apiManager.updateMetrics('weather', 'getWeather', cachedRequest);
    
    // Récupérer les métriques pour le service weather
    const metrics = apiManager.getServiceMetrics('weather');
    
    // Vérifier les compteurs
    expect(metrics.totalRequests).to.equal(3);
    expect(metrics.successfulRequests).to.equal(2);
    expect(metrics.failedRequests).to.equal(1);
    expect(metrics.cacheHits).to.equal(1);
    expect(metrics.averageResponseTime).to.be.a('number');
    
    // Vérifier que le taux de succès est calculé correctement
    expect(metrics.successRate).to.equal(Math.round((2 / 3) * 100));
  });
});
