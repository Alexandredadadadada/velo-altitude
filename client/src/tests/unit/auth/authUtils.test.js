/**
 * Tests unitaires pour authUtils.ts
 * 
 * Ces tests vérifient les fonctionnalités principales des utilitaires d'authentification
 * en utilisant des mocks pour simuler le SDK Auth0.
 */

import { Auth0Client } from '@auth0/auth0-spa-js';
import * as authUtils from '../../../auth/authUtils';

// Mock du SDK Auth0
jest.mock('@auth0/auth0-spa-js', () => {
  return {
    Auth0Client: jest.fn().mockImplementation(() => ({
      getTokenSilently: jest.fn(),
      isAuthenticated: jest.fn(),
      getUser: jest.fn(),
      loginWithRedirect: jest.fn(),
      logout: jest.fn(),
      handleRedirectCallback: jest.fn()
    }))
  };
});

describe('authUtils', () => {
  let auth0ClientMock;
  
  beforeEach(() => {
    // Réinitialiser les mocks avant chaque test
    jest.clearAllMocks();
    
    // Récupérer l'instance mockée d'Auth0Client
    auth0ClientMock = new Auth0Client({});
    
    // Injecter manuellement notre mock dans le singleton de authUtils
    // Note: Ceci est nécessaire car le singleton est créé à l'importation
    authUtils.setAuth0ClientForTesting(auth0ClientMock);
  });
  
  describe('getAccessToken', () => {
    it('devrait retourner un token valide lorsque getTokenSilently réussit', async () => {
      // Arrange
      const expectedToken = 'valid-access-token';
      auth0ClientMock.getTokenSilently.mockResolvedValue(expectedToken);
      
      // Act
      const result = await authUtils.getAccessToken();
      
      // Assert
      expect(result).toBe(expectedToken);
      expect(auth0ClientMock.getTokenSilently).toHaveBeenCalledTimes(1);
    });
    
    it('devrait lancer une erreur quand getTokenSilently échoue', async () => {
      // Arrange
      const expectedError = new Error('Failed to get token');
      auth0ClientMock.getTokenSilently.mockRejectedValue(expectedError);
      
      // Act & Assert
      await expect(authUtils.getAccessToken()).rejects.toThrow('Failed to get token');
      expect(auth0ClientMock.getTokenSilently).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('isAuthenticated', () => {
    it('devrait retourner true si l\'utilisateur est authentifié', async () => {
      // Arrange
      auth0ClientMock.isAuthenticated.mockResolvedValue(true);
      
      // Act
      const result = await authUtils.isAuthenticated();
      
      // Assert
      expect(result).toBe(true);
      expect(auth0ClientMock.isAuthenticated).toHaveBeenCalledTimes(1);
    });
    
    it('devrait retourner false si l\'utilisateur n\'est pas authentifié', async () => {
      // Arrange
      auth0ClientMock.isAuthenticated.mockResolvedValue(false);
      
      // Act
      const result = await authUtils.isAuthenticated();
      
      // Assert
      expect(result).toBe(false);
      expect(auth0ClientMock.isAuthenticated).toHaveBeenCalledTimes(1);
    });
    
    it('devrait retourner false en cas d\'erreur', async () => {
      // Arrange
      auth0ClientMock.isAuthenticated.mockRejectedValue(new Error('Auth error'));
      
      // Act
      const result = await authUtils.isAuthenticated();
      
      // Assert
      expect(result).toBe(false);
      expect(auth0ClientMock.isAuthenticated).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('getUserId', () => {
    it('devrait retourner l\'ID utilisateur quand getUser réussit', async () => {
      // Arrange
      const mockUser = { sub: 'auth0|123456789' };
      auth0ClientMock.getUser.mockResolvedValue(mockUser);
      
      // Act
      const result = await authUtils.getUserId();
      
      // Assert
      expect(result).toBe('auth0|123456789');
      expect(auth0ClientMock.getUser).toHaveBeenCalledTimes(1);
    });
    
    it('devrait retourner null quand l\'utilisateur n\'a pas de sub', async () => {
      // Arrange
      const mockUser = { name: 'Test User' }; // Pas de sub
      auth0ClientMock.getUser.mockResolvedValue(mockUser);
      
      // Act
      const result = await authUtils.getUserId();
      
      // Assert
      expect(result).toBeNull();
      expect(auth0ClientMock.getUser).toHaveBeenCalledTimes(1);
    });
    
    it('devrait retourner null quand getUser échoue', async () => {
      // Arrange
      auth0ClientMock.getUser.mockRejectedValue(new Error('Failed to get user'));
      
      // Act
      const result = await authUtils.getUserId();
      
      // Assert
      expect(result).toBeNull();
      expect(auth0ClientMock.getUser).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('hasRole', () => {
    it('devrait retourner true quand l\'utilisateur a le rôle demandé', async () => {
      // Arrange
      const mockUser = { 
        'https://velo-altitude.com/roles': ['admin', 'user']
      };
      auth0ClientMock.getUser.mockResolvedValue(mockUser);
      
      // Act
      const result = await authUtils.hasRole('admin');
      
      // Assert
      expect(result).toBe(true);
      expect(auth0ClientMock.getUser).toHaveBeenCalledTimes(1);
    });
    
    it('devrait retourner false quand l\'utilisateur n\'a pas le rôle demandé', async () => {
      // Arrange
      const mockUser = { 
        'https://velo-altitude.com/roles': ['user']
      };
      auth0ClientMock.getUser.mockResolvedValue(mockUser);
      
      // Act
      const result = await authUtils.hasRole('admin');
      
      // Assert
      expect(result).toBe(false);
      expect(auth0ClientMock.getUser).toHaveBeenCalledTimes(1);
    });
    
    it('devrait gérer le fallback sur email pour le rôle admin', async () => {
      // Arrange
      const mockUser = { 
        email: 'admin@velo-altitude.com',
        'https://velo-altitude.com/roles': []
      };
      auth0ClientMock.getUser.mockResolvedValue(mockUser);
      
      // Act
      const result = await authUtils.hasRole('admin');
      
      // Assert
      expect(result).toBe(true);
      expect(auth0ClientMock.getUser).toHaveBeenCalledTimes(1);
    });
    
    it('devrait retourner false quand getUser échoue', async () => {
      // Arrange
      auth0ClientMock.getUser.mockRejectedValue(new Error('Failed to get user'));
      
      // Act
      const result = await authUtils.hasRole('admin');
      
      // Assert
      expect(result).toBe(false);
      expect(auth0ClientMock.getUser).toHaveBeenCalledTimes(1);
    });
  });
});
