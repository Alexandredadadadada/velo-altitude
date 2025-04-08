/**
 * Tests unitaires pour les intercepteurs d'authentification dans apiConfig.js
 * 
 * Ces tests vérifient que les intercepteurs ajoutent correctement les tokens
 * d'authentification aux requêtes et gèrent les cas d'erreur appropriés.
 */

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { api, setupInterceptors } from '../../../config/apiConfig';
import * as authUtils from '../../../auth/authUtils';

// Mock authUtils
jest.mock('../../../auth/authUtils', () => ({
  getAccessToken: jest.fn(),
  isAuthenticated: jest.fn()
}));

describe('API Config & Interceptors', () => {
  let mockAxios;
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockAxios = new MockAdapter(api);
    
    // Configuration par défaut des mocks
    authUtils.getAccessToken.mockResolvedValue('valid-access-token');
    authUtils.isAuthenticated.mockResolvedValue(true);
  });
  
  afterEach(() => {
    mockAxios.restore();
  });
  
  describe('Request Interceptor', () => {
    it('devrait ajouter le token d\'authentification aux en-têtes des requêtes', async () => {
      // Arrange
      mockAxios.onGet('/api/test').reply(config => {
        // Vérifier que le token a été ajouté aux en-têtes
        if (config.headers.Authorization === 'Bearer valid-access-token') {
          return [200, { success: true }];
        }
        return [401, { error: 'Token manquant' }];
      });
      
      // Act
      const response = await api.get('/api/test');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ success: true });
      expect(authUtils.getAccessToken).toHaveBeenCalledTimes(1);
    });
    
    it('devrait gérer les erreurs lors de la récupération du token', async () => {
      // Arrange
      authUtils.getAccessToken.mockRejectedValue(new Error('Échec de récupération du token'));
      mockAxios.onGet('/api/test').reply(200);
      
      // Act & Assert
      await expect(api.get('/api/test')).rejects.toThrow('Échec de récupération du token');
    });
    
    it('ne devrait pas ajouter de token pour les requêtes publiques', async () => {
      // Arrange
      mockAxios.onGet('/api/public/test').reply(config => {
        // Vérifier qu'aucun token n'a été ajouté
        if (!config.headers.Authorization) {
          return [200, { success: true }];
        }
        return [400, { error: 'Token non requis' }];
      });
      
      // Act
      const response = await api.get('/api/public/test');
      
      // Assert
      expect(response.status).toBe(200);
      expect(authUtils.getAccessToken).not.toHaveBeenCalled();
    });
  });
  
  describe('Response Interceptor', () => {
    it('devrait gérer les erreurs 401 en actualisant le token et en réessayant la requête', async () => {
      // Arrange
      let attemptCount = 0;
      
      mockAxios.onGet('/api/protected').reply(() => {
        attemptCount++;
        // Première tentative : échec avec 401
        if (attemptCount === 1) {
          return [401, { error: 'Token expiré' }];
        }
        // Deuxième tentative : succès avec 200
        return [200, { success: true }];
      });
      
      // Act
      const response = await api.get('/api/protected');
      
      // Assert
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ success: true });
      // getAccessToken est appelé deux fois : une fois pour la requête initiale, une fois pour la réessayer
      expect(authUtils.getAccessToken).toHaveBeenCalledTimes(2);
      expect(attemptCount).toBe(2);
    });
    
    it('devrait ne pas réessayer plus d\'une fois pour éviter les boucles infinies', async () => {
      // Arrange
      mockAxios.onGet('/api/always-401').reply(401, { error: 'Toujours non autorisé' });
      
      // Act & Assert
      await expect(api.get('/api/always-401')).rejects.toMatchObject({
        response: { status: 401 }
      });
      
      // getAccessToken est appelé deux fois au maximum
      expect(authUtils.getAccessToken).toHaveBeenCalledTimes(2);
    });
    
    it('devrait transmettre les autres erreurs sans les intercepter', async () => {
      // Arrange
      mockAxios.onGet('/api/server-error').reply(500, { error: 'Erreur serveur' });
      
      // Act & Assert
      await expect(api.get('/api/server-error')).rejects.toMatchObject({
        response: { status: 500 }
      });
      
      // getAccessToken est appelé une seule fois pour la requête initiale
      expect(authUtils.getAccessToken).toHaveBeenCalledTimes(1);
    });
  });
});
