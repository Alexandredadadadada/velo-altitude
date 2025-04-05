/**
 * Tests pour le client d'authentification amélioré
 */

import { EnhancedAuthClient, AuthError, LocalStorageTokenStore } from '../services/enhancedAuthClient';

// Mock de fetch
global.fetch = jest.fn();

// Mock de localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    length: 0,
    key: () => null
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock de window.dispatchEvent
window.dispatchEvent = jest.fn();

// Réinitialiser les mocks avant chaque test
beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
  fetch.mockReset();
});

// Fonction utilitaire pour créer un token JWT valide
function createMockJwt(payload, expiresIn = 3600) {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + expiresIn;
  const mockPayload = { ...payload, exp };
  
  // Créer un faux JWT (pas une implémentation réelle)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const encodedPayload = btoa(JSON.stringify(mockPayload));
  const signature = 'mock-signature';
  
  return `${header}.${encodedPayload}.${signature}`;
}

describe('EnhancedAuthClient', () => {
  let client;
  
  beforeEach(() => {
    // Créer une nouvelle instance de client pour chaque test
    client = new EnhancedAuthClient({
      baseUrl: '/api/auth',
      refreshThreshold: 300,
      refreshCheckInterval: 1
    });
    
    // Remplacer la méthode _decodeToken par une version de test
    client._decodeToken = jest.fn(token => {
      try {
        // Simuler le décodage du token
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        
        const payload = JSON.parse(atob(parts[1]));
        return payload;
      } catch (e) {
        return null;
      }
    });
  });
  
  afterEach(() => {
    // Nettoyer après chaque test
    client.dispose();
  });
  
  describe('login', () => {
    test('should login successfully and store tokens', async () => {
      // Préparer la réponse de fetch
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          user: { id: '123', name: 'Test User' }
        })
      });
      
      // Appeler login
      const credentials = { email: 'test@example.com', password: 'password123' };
      const user = await client.login(credentials);
      
      // Vérifier que fetch a été appelé correctement
      expect(fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      // Vérifier que les tokens ont été stockés
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_access_token', 'mock-access-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_refresh_token', 'mock-refresh-token');
      
      // Vérifier que la fonction retourne l'utilisateur
      expect(user).toEqual({ id: '123', name: 'Test User' });
    });
    
    test('should throw error when login fails', async () => {
      // Préparer la réponse d'erreur
      fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          message: 'Invalid credentials',
          code: 'auth/invalid-credentials'
        })
      });
      
      // Vérifier que login lance une erreur
      const credentials = { email: 'test@example.com', password: 'wrong-password' };
      await expect(client.login(credentials)).rejects.toThrow(AuthError);
      
      // Vérifier que les tokens n'ont pas été stockés
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
  });
  
  describe('logout', () => {
    test('should clear tokens and call API', async () => {
      // Configurer les tokens dans le localStorage
      localStorageMock.setItem('auth_access_token', 'mock-access-token');
      localStorageMock.setItem('auth_refresh_token', 'mock-refresh-token');
      
      // Préparer la réponse de fetch
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
      
      // Appeler logout
      await client.logout();
      
      // Vérifier que fetch a été appelé correctement
      expect(fetch).toHaveBeenCalledWith('/api/auth/logout', expect.any(Object));
      
      // Vérifier que les tokens ont été supprimés
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_access_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_refresh_token');
    });
    
    test('should clear tokens even if API call fails', async () => {
      // Configurer les tokens dans le localStorage
      localStorageMock.setItem('auth_access_token', 'mock-access-token');
      localStorageMock.setItem('auth_refresh_token', 'mock-refresh-token');
      
      // Simuler une erreur de réseau
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      // Appeler logout
      await client.logout();
      
      // Vérifier que les tokens ont été supprimés malgré l'erreur
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_access_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_refresh_token');
    });
  });
  
  describe('refreshToken', () => {
    test('should refresh tokens successfully', async () => {
      // Configurer le token de rafraîchissement dans le localStorage
      localStorageMock.setItem('auth_refresh_token', 'old-refresh-token');
      
      // Préparer la réponse de fetch
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token'
        })
      });
      
      // Appeler refreshToken
      const newToken = await client.refreshToken();
      
      // Vérifier que fetch a été appelé correctement
      expect(fetch).toHaveBeenCalledWith('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('old-refresh-token')
      });
      
      // Vérifier que les nouveaux tokens ont été stockés
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_access_token', 'new-access-token');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_refresh_token', 'new-refresh-token');
      
      // Vérifier que la fonction retourne le nouveau token d'accès
      expect(newToken).toBe('new-access-token');
    });
    
    test('should throw error when refresh fails', async () => {
      // Configurer le token de rafraîchissement dans le localStorage
      localStorageMock.setItem('auth_refresh_token', 'expired-refresh-token');
      
      // Préparer la réponse d'erreur
      fetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          message: 'Invalid refresh token',
          code: 'invalid_refresh_token'
        })
      });
      
      // Vérifier que refreshToken lance une erreur
      await expect(client.refreshToken()).rejects.toThrow(AuthError);
      
      // Vérifier que l'événement session-expired a été dispatché
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'auth:session-expired' })
      );
      
      // Vérifier que les tokens ont été supprimés
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_access_token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_refresh_token');
    });
  });
  
  describe('getAuthenticatedFetch', () => {
    test('should return a fetch function with auth headers', async () => {
      // Configurer le token d'accès dans le localStorage
      localStorageMock.setItem('auth_access_token', 'test-access-token');
      
      // Obtenir la fonction fetch authentifiée
      const authFetch = await client.getAuthenticatedFetch();
      
      // Préparer la réponse de fetch
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: 'test' })
      });
      
      // Utiliser la fonction fetch authentifiée
      const response = await authFetch('/api/protected-resource');
      
      // Vérifier que fetch a été appelé avec les headers d'auth
      expect(fetch).toHaveBeenCalledWith('/api/protected-resource', 
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-access-token'
          })
        })
      );
    });
    
    test('should refresh token and retry on 401 with token_expired', async () => {
      // Configurer les tokens dans le localStorage
      localStorageMock.setItem('auth_access_token', 'expired-access-token');
      localStorageMock.setItem('auth_refresh_token', 'valid-refresh-token');
      
      // Préparer d'abord une réponse 401
      fetch.mockResolvedValueOnce({
        status: 401,
        json: () => Promise.resolve({
          message: 'Token expired',
          code: 'token_expired'
        })
      });
      
      // Puis préparer une réponse de rafraîchissement réussie
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token'
        })
      });
      
      // Enfin, préparer une réponse réussie pour la requête répétée
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'protected-data' })
      });
      
      // Obtenir la fonction fetch authentifiée
      const authFetch = await client.getAuthenticatedFetch();
      
      // Utiliser la fonction fetch authentifiée
      await authFetch('/api/protected-resource');
      
      // Vérifier que fetch a été appelé 3 fois (401, refresh, retry)
      expect(fetch).toHaveBeenCalledTimes(3);
      
      // Vérifier que le dernier appel utilisait le nouveau token
      expect(fetch.mock.calls[2][0]).toBe('/api/protected-resource');
      expect(fetch.mock.calls[2][1].headers.Authorization).toBe('Bearer new-access-token');
    });
  });
  
  describe('checkAndRefreshToken', () => {
    test('should refresh token when close to expiration', async () => {
      // Créer un token qui expire dans 4 minutes (240 secondes)
      const expiringToken = createMockJwt({ user: { id: '123' } }, 240);
      localStorageMock.setItem('auth_access_token', expiringToken);
      localStorageMock.setItem('auth_refresh_token', 'valid-refresh-token');
      
      // Préparer la réponse de rafraîchissement
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token'
        })
      });
      
      // Vérifier le token et le rafraîchir si nécessaire
      await client.checkAndRefreshToken();
      
      // Comme refreshThreshold est à 300 (5 minutes), le token devrait être rafraîchi
      expect(fetch).toHaveBeenCalledWith('/api/auth/refresh', expect.any(Object));
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_access_token', 'new-access-token');
    });
    
    test('should not refresh token when far from expiration', async () => {
      // Créer un token qui expire dans 10 minutes (600 secondes)
      const validToken = createMockJwt({ user: { id: '123' } }, 600);
      localStorageMock.setItem('auth_access_token', validToken);
      
      // Vérifier le token et le rafraîchir si nécessaire
      await client.checkAndRefreshToken();
      
      // Comme le token est encore valide pour plus de 5 minutes, pas de rafraîchissement
      expect(fetch).not.toHaveBeenCalled();
    });
  });
  
  describe('isAuthenticated', () => {
    test('should return true for valid token', async () => {
      // Créer un token valide qui expire dans 1 heure
      const validToken = createMockJwt({ user: { id: '123' } }, 3600);
      localStorageMock.setItem('auth_access_token', validToken);
      
      // Vérifier l'authentification
      const isAuth = await client.isAuthenticated();
      
      // Le résultat devrait être true
      expect(isAuth).toBe(true);
    });
    
    test('should return false for expired token', async () => {
      // Créer un token qui a expiré il y a 1 heure
      const expiredToken = createMockJwt({ user: { id: '123' } }, -3600);
      localStorageMock.setItem('auth_access_token', expiredToken);
      
      // Vérifier l'authentification
      const isAuth = await client.isAuthenticated();
      
      // Le résultat devrait être false
      expect(isAuth).toBe(false);
    });
    
    test('should return false when no token exists', async () => {
      // Pas de token dans le localStorage
      
      // Vérifier l'authentification
      const isAuth = await client.isAuthenticated();
      
      // Le résultat devrait être false
      expect(isAuth).toBe(false);
    });
  });
  
  describe('getUserInfo', () => {
    test('should return user info from token', async () => {
      // Créer un token avec des infos utilisateur
      const token = createMockJwt({ 
        user: { id: '123', name: 'Test User', email: 'test@example.com' } 
      });
      localStorageMock.setItem('auth_access_token', token);
      
      // Récupérer les infos utilisateur
      const userInfo = await client.getUserInfo();
      
      // Vérifier les infos
      expect(userInfo).toEqual({ 
        id: '123', 
        name: 'Test User', 
        email: 'test@example.com' 
      });
    });
    
    test('should return null when no token exists', async () => {
      // Pas de token dans le localStorage
      
      // Récupérer les infos utilisateur
      const userInfo = await client.getUserInfo();
      
      // Le résultat devrait être null
      expect(userInfo).toBeNull();
    });
  });
});

describe('LocalStorageTokenStore', () => {
  let tokenStore;
  
  beforeEach(() => {
    // Réinitialiser localStorage et créer un nouveau store
    localStorageMock.clear();
    tokenStore = new LocalStorageTokenStore('test_');
  });
  
  test('should store and retrieve tokens', async () => {
    // Stocker des tokens
    await tokenStore.setTokens('access-123', 'refresh-456');
    
    // Vérifier qu'ils ont été stockés dans localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test_access_token', 'access-123');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test_refresh_token', 'refresh-456');
    
    // Récupérer les tokens
    const accessToken = await tokenStore.getAccessToken();
    const refreshToken = await tokenStore.getRefreshToken();
    
    // Vérifier les valeurs
    expect(accessToken).toBe('access-123');
    expect(refreshToken).toBe('refresh-456');
  });
  
  test('should clear tokens', async () => {
    // Stocker des tokens d'abord
    await tokenStore.setTokens('access-123', 'refresh-456');
    
    // Effacer les tokens
    await tokenStore.clearTokens();
    
    // Vérifier qu'ils ont été supprimés
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('test_access_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('test_refresh_token');
    
    // Vérifier que les getters retournent null
    expect(await tokenStore.getAccessToken()).toBeNull();
    expect(await tokenStore.getRefreshToken()).toBeNull();
  });
});
