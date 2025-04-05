/**
 * Intercepteur d'erreurs API
 * Standardise la gestion des erreurs dans toutes les requêtes API
 */

import axios from 'axios';
import enhancedAuthClient from './enhancedAuthClient';

// Mapping des codes d'erreur HTTP vers des messages utilisateur
const HTTP_ERROR_MESSAGES = {
  400: 'La requête contient des données invalides.',
  401: 'Vous devez être connecté pour accéder à cette ressource.',
  403: 'Vous n\'avez pas les droits nécessaires pour accéder à cette ressource.',
  404: 'La ressource demandée n\'existe pas.',
  409: 'Un conflit est survenu avec l\'état actuel de la ressource.',
  422: 'Les données fournies sont invalides ou incomplètes.',
  429: 'Trop de requêtes. Veuillez réessayer plus tard.',
  500: 'Une erreur est survenue sur le serveur.',
  502: 'Le serveur est temporairement indisponible.',
  503: 'Le service est temporairement indisponible.',
  504: 'Le serveur a mis trop de temps à répondre.'
};

// Mapping des codes d'erreur d'authentification
const AUTH_ERROR_CODES = {
  'token_expired': 'Votre session a expiré.',
  'token_invalid': 'Votre session est invalide.',
  'token_revoked': 'Votre session a été révoquée.',
  'refresh_token_expired': 'Votre session a expiré.',
  'refresh_token_invalid': 'Impossible de renouveler votre session.',
  'device_changed': 'Connexion depuis un nouvel appareil détectée.',
  'too_many_devices': 'Trop d\'appareils connectés à ce compte.',
  'account_locked': 'Votre compte a été temporairement verrouillé.'
};

/**
 * Classe d'erreur API standardisée
 */
export class ApiError extends Error {
  constructor(message, status, code, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.isApiError = true;
  }
  
  // Méthode utilitaire pour vérifier si l'erreur est liée à l'authentification
  isAuthError() {
    return this.status === 401 || this.status === 403 || 
           Object.keys(AUTH_ERROR_CODES).includes(this.code);
  }
  
  // Méthode utilitaire pour vérifier si l'erreur est liée au réseau
  isNetworkError() {
    return this.status === 0 || this.code === 'NETWORK_ERROR';
  }
  
  // Méthode utilitaire pour vérifier si l'erreur est liée à une validation
  isValidationError() {
    return this.status === 422 || this.status === 400;
  }
  
  // Retourne un message utilisateur lisible
  getUserMessage() {
    if (this.isAuthError() && AUTH_ERROR_CODES[this.code]) {
      return AUTH_ERROR_CODES[this.code];
    }
    
    if (this.isNetworkError()) {
      return 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
    }
    
    return HTTP_ERROR_MESSAGES[this.status] || this.message;
  }
}

/**
 * Configure les intercepteurs Axios pour standardiser la gestion des erreurs
 */
export function setupApiErrorInterceptors() {
  // Intercepteur de réponse pour transformer les erreurs en format standard
  axios.interceptors.response.use(
    response => response,
    error => {
      let apiError;
      
      if (error.response) {
        // Le serveur a répondu avec un code d'erreur
        const { status, data } = error.response;
        const message = data?.message || HTTP_ERROR_MESSAGES[status] || 'Une erreur est survenue.';
        const code = data?.code || `HTTP_${status}`;
        const details = data?.details || null;
        
        apiError = new ApiError(message, status, code, details);
        
        // Traitement spécial pour les erreurs d'authentification
        if (apiError.isAuthError()) {
          handleAuthError(apiError);
        }
      } 
      else if (error.request) {
        // La requête a été envoyée mais aucune réponse n'a été reçue
        apiError = new ApiError(
          'Aucune réponse du serveur. Vérifiez votre connexion internet.',
          0,
          'NETWORK_ERROR'
        );
      } 
      else {
        // Erreur lors de la configuration de la requête
        apiError = new ApiError(
          error.message || 'Une erreur est survenue lors de la préparation de la requête.',
          0,
          'REQUEST_SETUP_ERROR'
        );
      }
      
      // Enregistrer l'erreur dans les logs (en mode développement)
      if (process.env.NODE_ENV !== 'production') {
        console.error('API Error:', {
          message: apiError.message,
          status: apiError.status,
          code: apiError.code,
          details: apiError.details,
          originalError: error
        });
      }
      
      return Promise.reject(apiError);
    }
  );
  
  // Intercepteur de requête pour ajouter des en-têtes communs
  axios.interceptors.request.use(
    async config => {
      // Ajouter l'en-tête d'acceptation JSON par défaut
      config.headers = config.headers || {};
      config.headers['Accept'] = 'application/json';
      
      return config;
    },
    error => Promise.reject(error)
  );
}

/**
 * Gère les erreurs d'authentification
 * @param {ApiError} error Erreur API
 */
function handleAuthError(error) {
  // Déclencher l'événement d'erreur d'authentification
  const event = new CustomEvent('auth:error', { 
    detail: { 
      code: error.code,
      message: error.message,
      status: error.status
    } 
  });
  window.dispatchEvent(event);
  
  // Actions spécifiques selon le code d'erreur
  switch (error.code) {
    case 'token_expired':
      // Pour les tokens expirés, on laisse le client d'authentification gérer le rafraîchissement
      break;
      
    case 'token_revoked':
    case 'refresh_token_expired':
    case 'refresh_token_invalid':
      // Pour ces erreurs, on déconnecte l'utilisateur
      enhancedAuthClient.logout();
      break;
      
    case 'device_changed':
      // Pour les changements d'appareil, on redirige vers la page de connexion
      enhancedAuthClient.logout();
      break;
      
    case 'too_many_devices':
      // Pour trop d'appareils, on redirige vers la page de gestion des appareils
      window.location.href = '/account/devices';
      break;
      
    case 'account_locked':
      // Pour les comptes verrouillés, on redirige vers la page de récupération
      window.location.href = '/account/recovery';
      break;
  }
}

/**
 * Crée une instance Axios avec les intercepteurs configurés
 * @param {Object} config Configuration Axios
 * @returns {AxiosInstance} Instance Axios configurée
 */
export function createApiClient(config = {}) {
  const client = axios.create(config);
  
  // Configurer les mêmes intercepteurs sur cette instance
  client.interceptors.response.use(
    response => response,
    error => {
      // Même logique que l'intercepteur global
      let apiError;
      
      if (error.response) {
        const { status, data } = error.response;
        const message = data?.message || HTTP_ERROR_MESSAGES[status] || 'Une erreur est survenue.';
        const code = data?.code || `HTTP_${status}`;
        const details = data?.details || null;
        
        apiError = new ApiError(message, status, code, details);
        
        if (apiError.isAuthError()) {
          handleAuthError(apiError);
        }
      } 
      else if (error.request) {
        apiError = new ApiError(
          'Aucune réponse du serveur. Vérifiez votre connexion internet.',
          0,
          'NETWORK_ERROR'
        );
      } 
      else {
        apiError = new ApiError(
          error.message || 'Une erreur est survenue lors de la préparation de la requête.',
          0,
          'REQUEST_SETUP_ERROR'
        );
      }
      
      return Promise.reject(apiError);
    }
  );
  
  return client;
}

// Exporter une fonction pour décorer les requêtes API avec la gestion d'erreurs
export async function apiRequest(requestPromise) {
  try {
    const response = await requestPromise;
    return response.data;
  } catch (error) {
    // Si c'est déjà une ApiError, la propager
    if (error.isApiError) {
      throw error;
    }
    
    // Sinon, convertir en ApiError
    let apiError;
    
    if (error.response) {
      const { status, data } = error.response;
      apiError = new ApiError(
        data?.message || HTTP_ERROR_MESSAGES[status] || 'Une erreur est survenue.',
        status,
        data?.code || `HTTP_${status}`,
        data?.details || null
      );
    } else {
      apiError = new ApiError(
        error.message || 'Une erreur inattendue est survenue.',
        0,
        'UNEXPECTED_ERROR'
      );
    }
    
    throw apiError;
  }
}

// Installer les intercepteurs au chargement du module
setupApiErrorInterceptors();
