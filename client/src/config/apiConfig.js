/**
 * Configuration de l'API pour Velo-Altitude
 * Inclut les paramètres de base, l'URL et les options de gestion des erreurs
 */
import axios from 'axios';
import { getAccessToken } from '../auth';
import apiErrorHandler from '../services/errorHandling/apiErrorHandler';

// Déterminer l'URL de base en fonction de l'environnement
const getBaseUrl = () => {
  // Priorité à la variable d'environnement
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Fallback pour le développement
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:5000/api';
  }
  
  // Défaut pour la production
  return 'https://api.velo-altitude.com/api';
};

// Création de l'instance Axios
const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000, // 30 secondes
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Ajouter un identifiant pour MSW
// Cela permet à MSW de savoir que ces requêtes doivent être interceptées
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_ENABLE_MSW === 'true') {
  apiClient.defaults.headers.common['x-msw-intercept'] = 'true';
  console.log('[API Config] MSW interception enabled');
}

// Intercepteur de requête pour ajouter le token d'authentification
apiClient.interceptors.request.use(
  async (config) => {
    try {
      // Utiliser la nouvelle méthode asynchrone pour obtenir le token
      const token = await getAccessToken();
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Ajout d'un identifiant unique pour chaque requête (pour le suivi)
      config.requestId = Date.now().toString(36) + Math.random().toString(36).substring(2);
      
      return config;
    } catch (error) {
      // Log de l'erreur
      console.error('[API Config] Error getting access token:', error);
      return config; // Continuer sans token
    }
  },
  error => {
    // Log de l'erreur
    console.error('[API Config] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Intercepteur de réponse pour gérer automatiquement les erreurs
apiClient.interceptors.response.use(
  // Cas de succès
  response => {
    return response;
  },
  // Cas d'erreur
  async error => {
    const originalRequest = error.config;
    
    // Vérifier si l'erreur est due à un token expiré (401) et qu'on n'a pas déjà tenté de rafraîchir
    if (error.response && 
        error.response.status === 401 && 
        !originalRequest._retry) {
      
      originalRequest._retry = true;
      
      try {
        // Tenter d'obtenir un nouveau token (Auth0 le rafraîchira automatiquement)
        const newToken = await getAccessToken();
        
        if (newToken) {
          // Mettre à jour le header d'autorisation pour la requête originale
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          // Réessayer la requête d'origine avec le nouveau token
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Échec du rafraîchissement du token, rediriger vers la page de connexion
        console.error('[API Config] Token refresh failed:', refreshError);
        
        // Rediriger vers la page de connexion si on est en mode navigateur
        if (typeof window !== 'undefined') {
          window.location.href = '/login?session=expired';
        }
      }
    }
    
    // Utiliser notre gestionnaire centralisé d'erreurs API
    return apiErrorHandler.handleError(error);
  }
);

// Méthodes API simplifiées avec gestion des erreurs intégrée
export const api = {
  get: async (endpoint, params = {}, options = {}) => {
    try {
      const response = await apiClient.get(endpoint, { params, ...options });
      return response.data;
    } catch (error) {
      // apiErrorHandler est déjà utilisé dans l'intercepteur
      throw error;
    }
  },
  
  post: async (endpoint, data = {}, options = {}) => {
    try {
      const response = await apiClient.post(endpoint, data, options);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  put: async (endpoint, data = {}, options = {}) => {
    try {
      const response = await apiClient.put(endpoint, data, options);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  patch: async (endpoint, data = {}, options = {}) => {
    try {
      const response = await apiClient.patch(endpoint, data, options);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  delete: async (endpoint, options = {}) => {
    try {
      const response = await apiClient.delete(endpoint, options);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Configuration des timeouts par type de requête
export const timeouts = {
  default: 30000, // 30s
  long: 60000,    // 1min
  short: 10000    // 10s
};

// Méthode pour définir des timeouts différents selon le type de requête
export const setRequestTimeout = (requestType) => {
  switch (requestType) {
    case 'long':
      apiClient.defaults.timeout = timeouts.long;
      break;
    case 'short':
      apiClient.defaults.timeout = timeouts.short;
      break;
    default:
      apiClient.defaults.timeout = timeouts.default;
  }
};

// Configuration exportée pour être utilisée dans toute l'application
export const apiConfig = {
  baseUrl: getBaseUrl(),
  timeouts,
  setRequestTimeout,
  apiClient
};

export default apiConfig;
