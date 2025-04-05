import axios from 'axios';
import { StravaService } from '../stravaService';
import MockAdapter from 'axios-mock-adapter';

// Créer une instance mock d'axios
const mockAxios = new MockAdapter(axios);

describe('StravaService', () => {
  // Réinitialiser les mocks entre les tests
  afterEach(() => {
    mockAxios.reset();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('getUserActivities', () => {
    test('récupère les activités de l\'utilisateur correctement', async () => {
      // Données de test
      const mockActivities = [
        {
          id: '12345',
          name: 'Sortie matinale',
          type: 'Ride',
          distance: 35000, // en mètres
          moving_time: 5400, // en secondes
          total_elevation_gain: 450, // en mètres
          start_date: '2023-06-15T08:30:00Z',
          map: {
            summary_polyline: 'abc123...' // Ligne encodée en polyline
          }
        },
        {
          id: '67890',
          name: 'Ascension du col',
          type: 'Ride',
          distance: 60000,
          moving_time: 10800,
          total_elevation_gain: 1200,
          start_date: '2023-06-12T09:00:00Z',
          map: {
            summary_polyline: 'def456...'
          }
        }
      ];

      // Configurer le mock pour la requête API
      mockAxios.onGet('/api/strava/activities').reply(200, mockActivities);

      // Appeler la méthode à tester
      const activities = await StravaService.getUserActivities();

      // Vérifier les résultats
      expect(activities).toEqual(mockActivities);
      expect(activities.length).toBe(2);
      expect(activities[0].name).toBe('Sortie matinale');
      expect(activities[1].name).toBe('Ascension du col');
    });

    test('gère les erreurs correctement', async () => {
      // Configurer le mock pour simuler une erreur
      mockAxios.onGet('/api/strava/activities').reply(401, { message: 'Non autorisé' });

      // Vérifier que l'erreur est correctement propagée
      await expect(StravaService.getUserActivities()).rejects.toThrow();
    });
  });

  describe('importActivity', () => {
    test('importe une activité Strava en tant qu\'itinéraire', async () => {
      // Données de test
      const activityId = '12345';
      const mockResponse = {
        success: true,
        route: {
          id: 'route-123',
          name: 'Sortie matinale',
          description: 'Importé depuis Strava',
          distance: 35,
          elevation_gain: 450
        }
      };

      // Configurer le mock
      mockAxios.onPost(`/api/strava/import/${activityId}`).reply(200, mockResponse);

      // Appeler la méthode à tester
      const result = await StravaService.importActivity(activityId);

      // Vérifier les résultats
      expect(result).toEqual(mockResponse);
      expect(result.success).toBe(true);
      expect(result.route.id).toBe('route-123');
    });
  });

  describe('isAuthenticated', () => {
    test('détecte correctement l\'authentification Strava', async () => {
      // Configurer le mock
      mockAxios.onGet('/api/strava/auth/status').reply(200, { authenticated: true });

      // Appeler la méthode à tester
      const isAuth = await StravaService.isAuthenticated();

      // Vérifier le résultat
      expect(isAuth).toBe(true);
    });

    test('détecte correctement l\'absence d\'authentification', async () => {
      // Configurer le mock
      mockAxios.onGet('/api/strava/auth/status').reply(200, { authenticated: false });

      // Appeler la méthode à tester
      const isAuth = await StravaService.isAuthenticated();

      // Vérifier le résultat
      expect(isAuth).toBe(false);
    });
  });

  describe('getAuthUrl', () => {
    test('retourne l\'URL d\'authentification correcte', () => {
      // Configurer l'environnement
      process.env.REACT_APP_BASE_URL = 'http://localhost:3000';
      
      // Appeler la méthode à tester
      const authUrl = StravaService.getAuthUrl();
      
      // Vérifier que l'URL contient les éléments nécessaires
      expect(authUrl).toContain('/api/strava/auth');
      expect(authUrl).toContain('redirect_uri=http://localhost:3000');
    });
  });

  describe('exchangeToken', () => {
    test('échange le code d\'autorisation contre un token', async () => {
      // Données de test
      const code = 'auth_code_123';
      const mockResponse = {
        access_token: 'acc_token_123',
        refresh_token: 'ref_token_456',
        expires_at: Date.now() + 3600000 // Dans 1 heure
      };
      
      // Configurer le mock
      mockAxios.onPost('/api/strava/auth/exchange').reply(200, mockResponse);
      
      // Appeler la méthode à tester
      const result = await StravaService.exchangeToken(code);
      
      // Vérifier les résultats
      expect(result).toEqual(mockResponse);
      expect(result.access_token).toBe('acc_token_123');
    });
  });
});
