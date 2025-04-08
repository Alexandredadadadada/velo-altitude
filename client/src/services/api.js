/**
 * Service de configuration centrale pour les API
 * Ce fichier configure axios pour toutes les requêtes API
 */
import axios from 'axios';
import config from '../config'; // Importer la configuration centralisée

// Récupérer l'URL de base depuis la configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Création d'une instance axios avec la configuration de base
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // Ajouter un timeout par défaut pour éviter les requêtes bloquées indéfiniment
  timeout: 30000, // 30 secondes
  // Activer les credentials pour les cookies
  withCredentials: true
});

// Intercepteur pour ajouter le token d'authentification JWT à chaque requête
api.interceptors.request.use(
  (config) => {
    // Récupérer le token depuis les cookies ou localStorage
    // Note: Les cookies httpOnly ne sont pas accessibles via JavaScript
    // mais le token peut être stocké dans localStorage pour la compatibilité
    const token = localStorage.getItem('authToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Ajouter un timestamp pour éviter la mise en cache des requêtes GET
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les réponses et les erreurs
api.interceptors.response.use(
  (response) => {
    // Vérifier si la réponse contient un nouveau token d'accès
    const newToken = response.headers['x-new-access-token'];
    if (newToken) {
      // Mettre à jour le token dans localStorage
      localStorage.setItem('authToken', newToken);
    }
    
    return response;
  },
  (error) => {
    // Gérer les erreurs d'authentification (401)
    if (error.response && error.response.status === 401) {
      // Vérifier si l'erreur est due à un token expiré
      const isTokenExpired = 
        error.response.data?.error?.type === 'auth_token_expired' ||
        error.response.data?.message?.includes('expired');
      
      // Si le token est expiré, tenter de le rafraîchir automatiquement
      // Cette logique sera gérée par le service d'authentification
      
      // Pour l'instant, déconnecter l'utilisateur
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Rediriger vers la page de connexion si nécessaire
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=true';
      }
    }
    
    // Gérer les erreurs de timeout
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      error.response = {
        data: {
          error: {
            type: 'timeout_error',
            message: 'La requête a pris trop de temps à s\'exécuter',
            severity: 'warning'
          }
        }
      };
    }
    
    // Gérer les erreurs réseau
    if (!error.response) {
      error.response = {
        data: {
          error: {
            type: 'network_error',
            message: 'Impossible de se connecter au serveur',
            severity: 'warning',
            details: error.message
          }
        }
      };
    }
    
    return Promise.reject(error);
  }
);

/**
 * Fonction utilitaire pour créer des requêtes avec gestion de cache
 * @param {string} url - URL de la requête
 * @param {Object} options - Options de la requête
 * @returns {Promise} Promesse avec les données de la réponse
 */
const createCachedRequest = (url, options = {}) => {
  const { cacheDuration = 5 * 60 * 1000, forceRefresh = false } = options;
  
  // Clé de cache unique pour cette requête
  const cacheKey = `api_cache_${url}`;
  
  // Vérifier si les données sont en cache et toujours valides
  const cachedData = localStorage.getItem(cacheKey);
  if (cachedData && !forceRefresh) {
    try {
      const { data, timestamp } = JSON.parse(cachedData);
      const isValid = Date.now() - timestamp < cacheDuration;
      
      if (isValid) {
        return Promise.resolve(data);
      }
    } catch (error) {
      // Ignorer les erreurs de parsing et continuer avec la requête
      console.warn('Erreur lors de la lecture du cache:', error);
    }
  }
  
  // Effectuer la requête API
  return api.get(url)
    .then(response => {
      // Mettre en cache les données
      localStorage.setItem(cacheKey, JSON.stringify({
        data: response.data,
        timestamp: Date.now()
      }));
      
      return response.data;
    });
};

export { api, createCachedRequest };
export default api;
