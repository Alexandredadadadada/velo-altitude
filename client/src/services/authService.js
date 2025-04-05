/**
 * Service d'authentification
 * Gère les tokens JWT, leur stockage, et leur rafraîchissement automatique
 */
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import clientFingerprintService from './clientFingerprintService';

class AuthService {
  constructor() {
    this.tokenKey = 'auth_token';
    this.refreshTokenKey = 'refresh_token';
    this.tokenExpiryKey = 'token_expiry';
    
    // Correspondances des codes d'erreur
    this.errorCodes = {
      'AUTH_EXPIRED': 'Votre session a expiré. Veuillez vous reconnecter.',
      'AUTH_INVALID': 'Session invalide. Veuillez vous reconnecter.',
      'AUTH_REQUIRED': 'Authentification requise pour accéder à cette ressource.',
      'AUTH_FORBIDDEN': 'Vous n\'avez pas les droits suffisants pour accéder à cette ressource.',
      'AUTH_DEVICE_CHANGED': 'Connexion depuis un nouvel appareil détectée. Veuillez vous authentifier à nouveau.',
      'AUTH_TOO_MANY_DEVICES': 'Trop d\'appareils connectés à ce compte. Veuillez vous déconnecter d\'un autre appareil.',
      'AUTH_BLOCKED': 'Ce compte a été temporairement bloqué pour des raisons de sécurité.'
    };
    
    // Vérifier et rafraîchir le token au démarrage
    this.checkAndRefreshToken();
    
    // Configurer l'intercepteur pour les requêtes
    this.setupAxiosInterceptor();
  }
  
  /**
   * Configure l'intercepteur pour ajouter le token à chaque requête
   * et rafraîchir automatiquement si nécessaire
   */
  setupAxiosInterceptor() {
    axios.interceptors.request.use(async (config) => {
      // Ne pas ajouter le token pour les requêtes de connexion/rafraîchissement
      if (config.url.includes('/auth/login') || config.url.includes('/auth/refresh-token')) {
        return config;
      }
      
      // Vérifier si le token est sur le point d'expirer
      if (this.isTokenExpiringSoon()) {
        try {
          await this.refreshToken();
        } catch (error) {
          // Si le rafraîchissement échoue, rediriger vers la connexion
          console.error('Erreur lors du rafraîchissement automatique du token:', error);
          this.logout();
          return Promise.reject(error);
        }
      }
      
      const token = this.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        
        // Ajouter l'empreinte client aux en-têtes pour l'audit de sécurité
        const fingerprint = clientFingerprintService.getFingerprintId();
        if (fingerprint) {
          config.headers['X-Client-ID'] = fingerprint;
        }
      }
      
      return config;
    }, (error) => {
      return Promise.reject(error);
    });
    
    // Intercepter les réponses d'erreur 401 (non autorisé) et 403 (interdit)
    axios.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        
        // Si l'erreur est 401 et que ce n'est pas déjà une tentative de rafraîchissement
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          // Vérifier si l'erreur contient un code spécifique pour personnaliser le message
          const errorCode = error.response?.data?.code;
          if (errorCode && errorCode === 'AUTH_DEVICE_CHANGED') {
            // Cas spécial: appareil différent détecté
            this.logout();
            // Stocker le message d'erreur pour l'afficher sur la page de connexion
            sessionStorage.setItem('auth_error', this.getErrorMessage(errorCode));
            return Promise.reject(error);
          }
          
          try {
            await this.refreshToken();
            
            // Reconfigurer la requête originale avec le nouveau token
            originalRequest.headers.Authorization = `Bearer ${this.getToken()}`;
            
            // Ajouter l'empreinte client aux en-têtes
            const fingerprint = clientFingerprintService.getFingerprintId();
            if (fingerprint) {
              originalRequest.headers['X-Client-ID'] = fingerprint;
            }
            
            return axios(originalRequest);
          } catch (refreshError) {
            // Si le rafraîchissement échoue, déconnecter l'utilisateur
            this.logout();
            return Promise.reject(refreshError);
          }
        }
        
        // Gérer les erreurs 403 (Forbidden)
        if (error.response?.status === 403) {
          const errorCode = error.response?.data?.code;
          // Stocker le message d'erreur pour l'afficher
          if (errorCode && this.errorCodes[errorCode]) {
            sessionStorage.setItem('auth_error', this.getErrorMessage(errorCode));
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Obtient un message d'erreur lisible à partir d'un code d'erreur
   * @param {string} code - Code d'erreur
   * @returns {string} Message d'erreur
   */
  getErrorMessage(code) {
    return this.errorCodes[code] || 'Une erreur d\'authentification s\'est produite. Veuillez vous reconnecter.';
  }
  
  /**
   * Vérifie si le token expire bientôt (dans les 5 minutes)
   * @returns {boolean} - True si le token expire bientôt
   */
  isTokenExpiringSoon() {
    const expiry = localStorage.getItem(this.tokenExpiryKey);
    if (!expiry) return true;
    
    const expiryTime = new Date(expiry).getTime();
    const currentTime = new Date().getTime();
    const fiveMinutes = 5 * 60 * 1000;
    
    return (expiryTime - currentTime) < fiveMinutes;
  }
  
  /**
   * Rafraîchit le token d'authentification
   * @returns {Promise<string>} - Nouveau token
   */
  async refreshToken() {
    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    if (!refreshToken) {
      throw new Error('Refresh token not found');
    }
    
    try {
      // Inclure l'empreinte client dans la demande de rafraîchissement
      const fingerprint = clientFingerprintService.getAuthFingerprint();
      
      const response = await axios.post('/api/auth/refresh-token', { 
        refreshToken,
        clientFingerprint: fingerprint
      });
      
      this.setToken(response.data.token);
      this.setRefreshToken(response.data.refreshToken);
      this.setTokenExpiry(response.data.expiresAt);
      
      return response.data.token;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error);
      
      // Gérer les différents types d'erreurs
      if (error.response?.data?.code) {
        sessionStorage.setItem('auth_error', this.getErrorMessage(error.response.data.code));
      }
      
      this.logout();
      throw error;
    }
  }
  
  /**
   * Stocke le token d'authentification
   * @param {string} token - Token JWT
   */
  setToken(token) {
    localStorage.setItem(this.tokenKey, token);
    
    // Extraire et stocker la date d'expiration
    const decoded = jwtDecode(token);
    const expiryDate = new Date(decoded.exp * 1000);
    this.setTokenExpiry(expiryDate.toISOString());
  }
  
  /**
   * Stocke le refresh token
   * @param {string} refreshToken - Refresh token
   */
  setRefreshToken(refreshToken) {
    localStorage.setItem(this.refreshTokenKey, refreshToken);
  }
  
  /**
   * Stocke la date d'expiration du token
   * @param {string} expiryDate - Date d'expiration en ISO format
   */
  setTokenExpiry(expiryDate) {
    localStorage.setItem(this.tokenExpiryKey, expiryDate);
  }
  
  /**
   * Récupère le token d'authentification
   * @returns {string|null} - Token JWT ou null si non présent
   */
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }
  
  /**
   * Récupère le refresh token
   * @returns {string|null} - Refresh token ou null si non présent
   */
  getRefreshToken() {
    return localStorage.getItem(this.refreshTokenKey);
  }
  
  /**
   * Vérifie si l'utilisateur est authentifié
   * @returns {boolean} - Statut d'authentification
   */
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;
    
    // Vérifier si le token n'est pas expiré
    const expiry = localStorage.getItem(this.tokenExpiryKey);
    if (!expiry) return false;
    
    const expiryTime = new Date(expiry).getTime();
    const currentTime = new Date().getTime();
    
    return currentTime < expiryTime;
  }
  
  /**
   * Vérifie et rafraîchit le token si nécessaire
   * @returns {Promise<void>}
   */
  async checkAndRefreshToken() {
    if (this.isTokenExpiringSoon() && this.getToken()) {
      try {
        await this.refreshToken();
        console.log('Token rafraîchi avec succès');
      } catch (error) {
        console.error('Erreur lors de la vérification du token:', error);
      }
    }
  }
  
  /**
   * Traite la connexion de l'utilisateur
   * @param {Object} loginData - Données de connexion (token, refreshToken, expiresAt)
   */
  async handleLogin(loginData) {
    const { token, refreshToken, expiresAt } = loginData;
    
    this.setToken(token);
    this.setRefreshToken(refreshToken);
    this.setTokenExpiry(expiresAt);
    
    // Mettre à jour l'empreinte client à chaque connexion réussie
    await clientFingerprintService.updateFingerprint();
    
    // Effacer les messages d'erreur précédents
    sessionStorage.removeItem('auth_error');
  }
  
  /**
   * Déconnecte l'utilisateur
   */
  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.tokenExpiryKey);
    
    // Rediriger vers la page de connexion
    window.location.href = '/login';
  }
  
  /**
   * Récupère les erreurs d'authentification stockées
   * @returns {string|null} Message d'erreur ou null
   */
  getStoredAuthError() {
    return sessionStorage.getItem('auth_error');
  }
  
  /**
   * Efface les erreurs d'authentification stockées
   */
  clearAuthErrors() {
    sessionStorage.removeItem('auth_error');
  }
}

export default new AuthService();
