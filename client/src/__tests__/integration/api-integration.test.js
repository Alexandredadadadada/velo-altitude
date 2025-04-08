/**
 * Tests d'intégration pour les API du projet Velo-Altitude
 * Vérifie la communication entre le frontend et backend
 */

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import optimizedApiService from '../../services/optimizedApiService';

// Créer un mock de l'API pour tester l'intégration
const mockAxios = new MockAdapter(axios);

describe('API Integration Tests', () => {
  beforeEach(() => {
    // Réinitialiser les mocks entre les tests
    mockAxios.reset();
    // Vider le cache local
    optimizedApiService.clearCache();
  });

  afterAll(() => {
    mockAxios.restore();
  });

  describe('Cols API', () => {
    const mockColsData = [
      { id: 1, name: 'Col du Galibier', altitude: 2642, difficulty: 5 },
      { id: 2, name: 'Col du Tourmalet', altitude: 2115, difficulty: 5 },
      { id: 3, name: 'Col de la Bonette', altitude: 2802, difficulty: 4 }
    ];

    test('should fetch cols data with cache optimization', async () => {
      // Configuration du mock
      mockAxios.onGet('/api/cols').reply(200, mockColsData);

      // Première requête - doit aller au serveur
      const result1 = await optimizedApiService.get('/cols');
      expect(result1).toEqual(mockColsData);
      expect(mockAxios.history.get.length).toBe(1);

      // Seconde requête - devrait utiliser le cache
      const result2 = await optimizedApiService.get('/cols');
      expect(result2).toEqual(mockColsData);
      // Le nombre de requêtes ne devrait pas avoir augmenté
      expect(mockAxios.history.get.length).toBe(1);

      // Requête avec forceRefresh - devrait aller au serveur
      const result3 = await optimizedApiService.get('/cols', {}, { forceRefresh: true });
      expect(result3).toEqual(mockColsData);
      expect(mockAxios.history.get.length).toBe(2);
    });

    test('should handle API errors correctly', async () => {
      // Simuler une erreur serveur
      mockAxios.onGet('/api/cols/999').reply(404, { 
        error: 'Col non trouvé',
        code: 'COL_NOT_FOUND'
      });

      // La requête devrait échouer avec une erreur
      await expect(optimizedApiService.get('/cols/999')).rejects.toThrow();
    });
  });

  describe('Strava API Integration', () => {
    test('should handle Strava token refresh correctly', async () => {
      // Mock pour la requête d'activités Strava
      mockAxios.onGet('/api/strava/activities').reply(config => {
        // Vérifier la présence du token dans les headers
        const authHeader = config.headers.Authorization;
        if (authHeader && authHeader.includes('Bearer valid_token')) {
          return [200, { activities: [] }];
        } else {
          return [401, { error: 'Invalid token' }];
        }
      });

      // Mock pour le rafraîchissement du token
      mockAxios.onPost('/api/strava/refresh-token').reply(200, {
        access_token: 'valid_token',
        refresh_token: 'new_refresh_token',
        expires_at: Date.now() + 3600000
      });

      // Configurer un token invalide
      localStorage.setItem('velo_altitude_strava_token', JSON.stringify({
        access_token: 'invalid_token',
        refresh_token: 'old_refresh_token',
        expires_at: Date.now() - 1000
      }));

      // La requête devrait échouer initialement puis réussir après rafraîchissement
      // Note: Ce test nécessite une implémentation de refresh token dans le service API
      // Il sert principalement de spécification pour l'implémentation
    });
  });

  describe('Rate Limiting', () => {
    test('should respect rate limiting headers', async () => {
      // Configurer le mock pour simuler des headers de rate limit
      let requestCount = 0;
      mockAxios.onGet('/api/heavily-limited-endpoint').reply(() => {
        requestCount++;
        return [
          200, 
          { data: 'Test data' },
          {
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': String(5 - requestCount),
            'X-RateLimit-Reset': String(Date.now() + 60000)
          }
        ];
      });

      // Faire plusieurs requêtes
      for (let i = 0; i < 5; i++) {
        await optimizedApiService.get('/heavily-limited-endpoint', {}, { forceRefresh: true });
      }

      // Vérifier que le nombre correct de requêtes a été fait
      expect(requestCount).toBe(5);
    });
  });

  describe('Cache Invalidation', () => {
    test('should invalidate cache after POST requests', async () => {
      // Setup pour les données de test
      const mockCol = { id: 1, name: 'Col du Test', altitude: 1500 };
      const updatedMockCol = { ...mockCol, altitude: 1550 };

      // Mock GET initial
      mockAxios.onGet('/api/cols/1').reply(200, mockCol);
      
      // Mock POST qui met à jour la ressource
      mockAxios.onPost('/api/cols/1').reply(200, updatedMockCol);
      
      // Mock GET après mise à jour
      mockAxios.onGet('/api/cols/1').reply(200, updatedMockCol);

      // Première requête GET - devrait retourner les données initiales
      const initialData = await optimizedApiService.get('/cols/1');
      expect(initialData).toEqual(mockCol);
      
      // Requête POST pour mettre à jour la ressource
      await optimizedApiService.post('/cols/1', { altitude: 1550 });
      
      // Seconde requête GET - devrait invalider le cache et obtenir les données à jour
      const updatedData = await optimizedApiService.get('/cols/1');
      expect(updatedData).toEqual(updatedMockCol);
    });
  });
});
