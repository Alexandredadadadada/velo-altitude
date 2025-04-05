/**
 * Client d'authentification amélioré
 * Gère la rotation des tokens JWT, les périodes de grâce et la révocation sélective des tokens
 */

import { jwtDecode } from 'jwt-decode';
import clientFingerprintService from './clientFingerprintService';

export class AuthError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

export class LocalStorageTokenStore {
  constructor(prefix = 'auth_') {
    this.prefix = prefix;
  }

  async getAccessToken() {
    return localStorage.getItem(`${this.prefix}access_token`);
  }

  async getRefreshToken() {
    return localStorage.getItem(`${this.prefix}refresh_token`);
  }

  async setTokens(accessToken, refreshToken) {
    localStorage.setItem(`${this.prefix}access_token`, accessToken);
    localStorage.setItem(`${this.prefix}refresh_token`, refreshToken);
  }

  async clearTokens() {
    localStorage.removeItem(`${this.prefix}access_token`);
    localStorage.removeItem(`${this.prefix}refresh_token`);
  }
}

export class EnhancedAuthClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || '/api/auth';
    this.tokenStorage = options.tokenStorage || new LocalStorageTokenStore();
    this.refreshThreshold = options.refreshThreshold || 300; // 5 minutes in seconds
    this.graceEnabled = options.graceEnabled !== false; // Enable grace period by default
    this.onSessionExpired = options.onSessionExpired || (() => {
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
    });
    this.onTokenRevoked = options.onTokenRevoked || (() => {
      window.dispatchEvent(new CustomEvent('auth:token-revoked'));
    });
    
    // Setup token refresh interval
    this.refreshInterval = setInterval(() => {
      this.checkAndRefreshToken();
    }, (options.refreshCheckInterval || 60) * 1000); // Check every minute by default
  }

  /**
   * Connecte l'utilisateur
   * @param {Object} credentials Identifiants de connexion (email, password)
   * @returns {Promise<Object>} Informations utilisateur
   */
  async login(credentials) {
    try {
      // Ajouter l'empreinte client aux données de connexion
      const clientFingerprint = clientFingerprintService.getAuthFingerprint();
      const loginData = {
        ...credentials,
        clientFingerprint
      };

      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new AuthError(error.message, error.code);
      }
      
      const data = await response.json();
      await this.tokenStorage.setTokens(data.accessToken, data.refreshToken);
      return data.user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Déconnecte l'utilisateur
   * @param {boolean} revokeAll Si true, révoque tous les tokens de l'utilisateur sur tous les appareils
   * @returns {Promise<void>}
   */
  async logout(revokeAll = false) {
    try {
      const refreshToken = await this.tokenStorage.getRefreshToken();
      if (refreshToken) {
        // Révoquer le token sur le serveur
        await fetch(`${this.baseUrl}/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await this.tokenStorage.getAccessToken()}`
          },
          body: JSON.stringify({ 
            refreshToken,
            revokeAll,
            clientFingerprint: clientFingerprintService.getFingerprintId()
          })
        });
      }
    } catch (error) {
      console.warn('Error during logout:', error);
    } finally {
      // Supprimer les tokens localement indépendamment de la réponse du serveur
      await this.tokenStorage.clearTokens();
      clearInterval(this.refreshInterval);
    }
  }

  /**
   * Fournit une fonction fetch authentifiée
   * @returns {Promise<Function>} Une fonction fetch avec authentification
   */
  async getAuthenticatedFetch() {
    const accessToken = await this.tokenStorage.getAccessToken();
    if (!accessToken) {
      throw new AuthError('No access token available', 'no_token');
    }
    
    return async (url, options = {}) => {
      // Cloner les options pour éviter de modifier l'original
      const fetchOptions = { ...options };
      
      // Ajouter l'en-tête d'autorisation
      fetchOptions.headers = {
        ...fetchOptions.headers,
        'Authorization': `Bearer ${accessToken}`
      };
      
      // Ajouter l'empreinte client aux en-têtes
      const fingerprint = clientFingerprintService.getFingerprintId();
      if (fingerprint) {
        fetchOptions.headers['X-Client-ID'] = fingerprint;
      }
      
      try {
        const response = await fetch(url, fetchOptions);
        
        // Gérer les erreurs d'authentification
        if (response.status === 401 || response.status === 403) {
          let errorData;
          try {
            errorData = await response.json();
          } catch (e) {
            errorData = { message: 'Authentication error', code: 'auth_error' };
          }
          
          // Si le token est expiré mais dans la période de grâce, essayer de le rafraîchir
          if (errorData.code === 'token_expired' && this.graceEnabled) {
            try {
              const newToken = await this.refreshToken();
              if (newToken) {
                // Réessayer avec le nouveau token
                fetchOptions.headers['Authorization'] = `Bearer ${newToken}`;
                return fetch(url, fetchOptions);
              }
            } catch (refreshError) {
              console.error('Failed to refresh token during grace period:', refreshError);
            }
          }
          
          throw new AuthError(errorData.message, errorData.code);
        }
        
        return response;
      } catch (error) {
        if (error instanceof AuthError) {
          // Gérer les erreurs d'authentification spécifiques
          if (error.code === 'token_revoked') {
            await this.tokenStorage.clearTokens();
            this.onTokenRevoked();
          } else if (error.code === 'session_expired' || error.code === 'invalid_token') {
            await this.tokenStorage.clearTokens();
            this.onSessionExpired();
          }
        }
        throw error;
      }
    };
  }

  /**
   * Rafraîchit le token d'accès
   * @returns {Promise<string>} Nouveau token d'accès
   */
  async refreshToken() {
    try {
      const refreshToken = await this.tokenStorage.getRefreshToken();
      if (!refreshToken) {
        throw new AuthError('No refresh token available', 'no_refresh_token');
      }
      
      // Inclure l'empreinte client dans la demande de rafraîchissement
      const fingerprint = clientFingerprintService.getAuthFingerprint();
      
      const response = await fetch(`${this.baseUrl}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          refreshToken,
          clientFingerprint: fingerprint
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new AuthError(error.message, error.code);
      }
      
      const data = await response.json();
      await this.tokenStorage.setTokens(data.accessToken, data.refreshToken);
      return data.accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      if (error.code === 'invalid_refresh_token' || error.code === 'refresh_token_expired') {
        await this.tokenStorage.clearTokens();
        this.onSessionExpired();
      }
      throw error;
    }
  }

  /**
   * Vérifie si le token est sur le point d'expirer et le rafraîchit si nécessaire
   * @returns {Promise<void>}
   */
  async checkAndRefreshToken() {
    try {
      const accessToken = await this.tokenStorage.getAccessToken();
      if (!accessToken) return;
      
      // Décoder le token sans vérification pour vérifier l'expiration
      const payload = this._decodeToken(accessToken);
      if (!payload || !payload.exp) return;
      
      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = payload.exp - now;
      
      // Rafraîchir si le token est sur le point d'expirer
      if (timeUntilExpiry < this.refreshThreshold) {
        await this.refreshToken();
      }
    } catch (error) {
      console.warn('Error checking token expiration:', error);
    }
  }

  /**
   * Décode un token JWT sans vérification de signature
   * @private
   * @param {string} token Token JWT
   * @returns {Object|null} Contenu décodé du token
   */
  _decodeToken(token) {
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   * @returns {Promise<boolean>} Statut d'authentification
   */
  async isAuthenticated() {
    const accessToken = await this.tokenStorage.getAccessToken();
    if (!accessToken) return false;
    
    const payload = this._decodeToken(accessToken);
    if (!payload || !payload.exp) return false;
    
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  }

  /**
   * Récupère les informations utilisateur du token
   * @returns {Promise<Object|null>} Informations utilisateur
   */
  async getUserInfo() {
    const accessToken = await this.tokenStorage.getAccessToken();
    if (!accessToken) return null;
    
    const payload = this._decodeToken(accessToken);
    return payload ? payload.user : null;
  }

  /**
   * Nettoie les ressources utilisées par le client
   */
  dispose() {
    clearInterval(this.refreshInterval);
  }
}

// Export d'une instance singleton avec les paramètres par défaut
const enhancedAuthClient = new EnhancedAuthClient();
export default enhancedAuthClient;
