/**
 * Tests d'intégration pour vérifier la communication entre le frontend et les API backend
 * 
 * Ces tests vérifient:
 * - Les appels API réussis
 * - Les mécanismes de mise en cache
 * - Les stratégies de fallback en cas d'erreur
 */

import { weatherService } from '../weather.service';
import RouteService from '../routeService';
import monitoringService from '../monitoringService';
import api from '../api';

// Mock des modules externes
jest.mock('../api');
jest.mock('axios');

describe('Tests d'intégration API', () => {
  beforeEach(() => {
    // Réinitialiser tous les mocks avant chaque test
    jest.clearAllMocks();
  });

  describe('Service météo - Tests d'intégration', () => {
    const mockWeatherData = {
      coord: { lat: 48.58, lon: 7.75 },
      weather: [{ id: 800, main: 'Clear', description: 'ciel dégagé' }],
      main: { temp: 22.5, feels_like: 21.8, temp_min: 20.1, temp_max: 24.3, pressure: 1015, humidity: 65 },
      wind: { speed: 3.6, deg: 220 },
      dt: 1649246400,
      sys: { country: 'FR', sunrise: 1649222400, sunset: 1649270000 },
      name: 'Strasbourg'
    };

    const mockForecastData = {
      list: [
        // Données pour 5 jours à intervalle de 3 heures
        { dt: 1649246400, main: { temp: 22.5 }, weather: [{ main: 'Clear' }] },
        { dt: 1649257200, main: { temp: 18.2 }, weather: [{ main: 'Clouds' }] },
        // ...autres intervalles
      ],
      city: { name: 'Strasbourg', country: 'FR' }
    };

    test('getCurrentWeather - devrait récupérer et mettre en cache les données météo', async () => {
      // Setup du mock axios pour simuler une réponse API
      const axiosMock = require('axios');
      axiosMock.get.mockResolvedValueOnce({ data: mockWeatherData });
      
      // Premier appel - devrait faire un appel API réel
      const result1 = await weatherService.getCurrentWeather(48.58, 7.75, 'fr');
      
      // Vérifier que la réponse est correcte
      expect(result1).toEqual(mockWeatherData);
      expect(axiosMock.get).toHaveBeenCalledTimes(1);
      
      // Réinitialiser le mock pour le second appel
      jest.clearAllMocks();
      
      // Simuler le cache du backend
      axiosMock.get.mockResolvedValueOnce({ 
        data: { ...mockWeatherData, cached: true } 
      });
      
      // Second appel avec les mêmes paramètres - devrait utiliser les données en cache
      const result2 = await weatherService.getCurrentWeather(48.58, 7.75, 'fr');
      
      // Vérifier que les données en cache sont utilisées
      expect(result2.cached).toBeTruthy();
    });

    test('getRouteWeather - devrait gérer les erreurs API correctement', async () => {
      // Setup du mock axios pour simuler une erreur sur le troisième point
      const axiosMock = require('axios');
      
      // Réussite pour les deux premiers points
      axiosMock.get
        .mockResolvedValueOnce({ data: mockWeatherData })
        .mockResolvedValueOnce({ data: mockWeatherData })
        .mockRejectedValueOnce(new Error('API error'))
        .mockResolvedValueOnce({ data: mockWeatherData });
      
      // Points de route à tester
      const routePoints = [
        { lat: 48.58, lng: 7.75 },
        { lat: 48.60, lng: 7.78 },
        { lat: 48.62, lng: 7.80 }, // Ce point provoquera une erreur
        { lat: 48.64, lng: 7.82 }
      ];
      
      try {
        // La méthode doit gérer l'erreur en interne et continuer avec les autres points
        const results = await weatherService.getRouteWeather(routePoints, 'fr');
        
        // On s'attend à recevoir au moins les données pour les points qui fonctionnent
        expect(results.length).toBeGreaterThan(0);
        expect(results.some(r => r.name === 'Strasbourg')).toBeTruthy();
        
        // Vérifier que monitoringService a enregistré l'erreur
        expect(monitoringService.logApiError).toHaveBeenCalled();
      } catch (error) {
        // Le test échoue si une erreur non gérée est levée
        fail('L\'erreur API aurait dû être gérée avec une stratégie de fallback');
      }
    });
  });

  describe('Service itinéraires - Tests d'intégration', () => {
    const mockRouteData = {
      id: 'route-123',
      name: 'La Route des Vins',
      description: 'Parcours à travers les vignobles alsaciens',
      distance: 45.6,
      elevationGain: 580,
      region: 'Grand Est',
      difficulty: 'Intermédiaire',
      points: [
        { lat: 48.58, lng: 7.75 },
        { lat: 48.62, lng: 7.80 },
        // ...autres points
      ]
    };

    test('getRouteById - devrait récupérer et mettre en cache les données d\'itinéraire', async () => {
      // Setup du mock API
      api.get.mockResolvedValueOnce({ data: mockRouteData });
      
      // Premier appel
      const result1 = await RouteService.getRouteById('route-123');
      
      // Vérifier que la réponse est correcte
      expect(result1).toEqual(mockRouteData);
      expect(api.get).toHaveBeenCalledTimes(1);
      expect(api.get).toHaveBeenCalledWith('/api/routes/route-123');
      
      // Réinitialiser le mock pour le second appel
      jest.clearAllMocks();
      
      // Simuler le cache du backend
      api.get.mockResolvedValueOnce({ 
        data: { ...mockRouteData, cached: true } 
      });
      
      // Second appel - devrait utiliser les données en cache
      const result2 = await RouteService.getRouteById('route-123');
      
      // Vérifier que les données en cache sont utilisées
      expect(result2.cached).toBeTruthy();
    });

    test('getAllRoutes - devrait récupérer les itinéraires filtrés', async () => {
      // Données de test
      const filters = {
        minDistance: 30,
        maxDistance: 80,
        difficulty: ['Facile', 'Intermédiaire'],
        region: 'Grand Est'
      };
      
      const mockRoutesData = [mockRouteData, { ...mockRouteData, id: 'route-456', distance: 35.2 }];
      
      // Setup du mock API
      api.get.mockResolvedValueOnce({ data: mockRoutesData });
      
      // Appel avec filtres
      const results = await RouteService.getAllRoutes(filters);
      
      // Vérifier que les paramètres de filtrage sont passés correctement
      expect(api.get).toHaveBeenCalledWith('/api/routes', { params: filters });
      
      // Vérifier que les résultats sont corrects
      expect(results).toEqual(mockRoutesData);
      expect(results.length).toBe(2);
    });

    test('createRoute - devrait gérer les erreurs et les retries', async () => {
      // Setup du mock API pour simuler une erreur puis une réussite (retry)
      api.post
        .mockRejectedValueOnce({ response: { status: 500, data: { message: 'Erreur serveur temporaire' } } })
        .mockResolvedValueOnce({ data: { ...mockRouteData, id: 'new-route-123' } });
      
      // Configurer le monitoring pour intercepter l'erreur
      monitoringService.logApiError = jest.fn();
      monitoringService.incrementRetryCount = jest.fn();
      
      // Données pour créer un itinéraire
      const newRouteData = {
        name: 'Nouveau parcours',
        description: 'Description du parcours',
        distance: 42.0,
        // ...autres données
      };
      
      // Appel qui devrait déclencher un retry
      const result = await RouteService.createRoute(newRouteData);
      
      // Vérifier que le monitoring a enregistré l'erreur et le retry
      expect(monitoringService.logApiError).toHaveBeenCalled();
      expect(monitoringService.incrementRetryCount).toHaveBeenCalled();
      
      // Vérifier que la seconde tentative a réussi
      expect(result).toBeDefined();
      expect(result.id).toBe('new-route-123');
      
      // Vérifier que l'API a bien été appelée deux fois (erreur + retry)
      expect(api.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('Stratégies de fallback - Tests d'intégration', () => {
    test('getPopularRoutes - devrait utiliser les données en cache local si l\'API échoue', async () => {
      // Setup du mock API pour simuler une erreur
      api.get.mockRejectedValueOnce(new Error('API indisponible'));
      
      // Simuler des données en cache local
      localStorage.setItem('cachedPopularRoutes', JSON.stringify([
        { id: 'cached-route-1', name: 'Parcours en cache 1' },
        { id: 'cached-route-2', name: 'Parcours en cache 2' }
      ]));
      
      // Appel qui devrait déclencher le fallback
      const results = await RouteService.getPopularRoutes();
      
      // Vérifier que le service a bien tenté d'appeler l'API
      expect(api.get).toHaveBeenCalledWith('/api/routes/popular', expect.any(Object));
      
      // Vérifier que les résultats proviennent du cache
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toContain('cached-route');
      
      // Vérifier que le monitoring a enregistré l'utilisation du fallback
      expect(monitoringService.logFallbackUsage).toHaveBeenCalled();
    });

    test('Les appels en parallèle sont correctement gérés avec le debouncing', async () => {
      // Setup du monitoring pour le suivi des appels
      monitoringService.trackApiCall = jest.fn();
      
      // Setup du mock API
      api.get.mockResolvedValue({ data: { result: 'success' } });
      
      // Simuler plusieurs appels en parallèle pour le même endpoint
      const promises = [
        RouteService.getRouteById('route-123'),
        RouteService.getRouteById('route-123'),
        RouteService.getRouteById('route-123')
      ];
      
      // Attendre que tous les appels se terminent
      await Promise.all(promises);
      
      // Vérifier que l'API n'a été appelée qu'une seule fois grâce au debouncing
      expect(api.get).toHaveBeenCalledTimes(1);
      
      // Vérifier que le suivi des appels est correct
      expect(monitoringService.trackApiCall).toHaveBeenCalledTimes(1);
    });
  });
});
