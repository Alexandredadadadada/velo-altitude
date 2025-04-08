/**
 * @file Configuration Axios pour les appels API de Velo-Altitude
 * @description Définit et configure une instance Axios avec les intercepteurs nécessaires pour
 * la gestion des tokens d'authentification, le rafraîchissement automatique, et la gestion des erreurs.
 * Utilise le système d'authentification Auth0 pour une intégration optimale.
 * 
 * @module apiConfig
 * @version 2.1.0
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import authUtils from '../auth/authUtils';
import { ApiError } from '../types/api';
import authMonitoring, { AuthEventType } from '../services/authMonitoring';

/**
 * Configuration de base pour l'instance Axios
 * @const {AxiosRequestConfig} baseConfig
 */
const baseConfig: AxiosRequestConfig = {
  baseURL: process.env.REACT_APP_API_BASE_URL || '/api',
  timeout: 30000, // 30 secondes
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

/**
 * Instance Axios configurée pour toutes les requêtes API de l'application
 * @const {AxiosInstance} api
 */
export const api: AxiosInstance = axios.create(baseConfig);

/**
 * Intercepteur de requête pour ajouter automatiquement le token d'authentification
 * Utilise getAccessToken du module authUtils pour récupérer le token
 */
api.interceptors.request.use(
  async (config) => {
    try {
      // Utiliser getAccessToken qui utilise le SDK Auth0
      const token = await authUtils.getAccessToken();
      if (token && config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('[API] Erreur lors de la récupération du token:', error);
      
      // Record authentication error for monitoring
      const userId = await authUtils.getUserId();
      authMonitoring.recordAuthEvent(
        AuthEventType.TOKEN_REFRESH_FAILURE, 
        { url: config.url },
        userId || undefined,
        error instanceof Error ? error : new Error(String(error))
      );
      
      return config; // Continue sans token, le serveur gérera l'erreur d'authentification
    }
  },
  (error) => {
    console.error('[API] Erreur lors de la préparation de la requête:', error);
    return Promise.reject(error);
  }
);

/**
 * Variables pour éviter les appels multiples de rafraîchissement du token
 * et gérer la file d'attente des requêtes à réessayer après rafraîchissement
 */
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

/**
 * Fonction pour rafraîchir le token d'authentification
 * en utilisant le SDK Auth0 via authUtils
 */
const refreshToken = async (): Promise<string | null> => {
  try {
    // Forcer l'obtention d'un nouveau token via authUtils
    return await authUtils.getAccessToken();
  } catch (error) {
    console.error('[API] Erreur lors du rafraîchissement du token:', error);
    return null;
  }
};

/**
 * Intercepteur de réponse pour gérer automatiquement les erreurs d'authentification
 * et réessayer les requêtes après rafraîchissement du token
 */
api.interceptors.response.use(
  (response) => response,
  async (error: any) => {
    // Si la requête a été annulée, ne pas tenter de la rafraîchir
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    // Vérifier si l'erreur dispose d'une configuration (c'est bien une AxiosError)
    if (!error.config) {
      return Promise.reject(error);
    }

    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Si l'erreur est 401 (non autorisé) et que nous n'avons pas déjà essayé de rafraîchir
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Record unauthorized access for monitoring
      const userId = await authUtils.getUserId();
      authMonitoring.recordAuthEvent(
        AuthEventType.UNAUTHORIZED_ACCESS_ATTEMPT,
        { 
          url: originalRequest.url,
          method: originalRequest.method 
        },
        userId || undefined
      );
      
      if (isRefreshing) {
        // Si un rafraîchissement est déjà en cours, mettre la requête en file d'attente
        try {
          const token = await new Promise<string>((resolve, reject) => {
            refreshSubscribers.push((token: string) => {
              resolve(token);
            });
          });
          
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
          }
          
          return api(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      // Marquer comme étant en cours de rafraîchissement
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Tenter de rafraîchir le token via Auth0
        const newToken = await refreshToken();
        
        if (!newToken) {
          throw new Error('Impossible de rafraîchir le token');
        }
        
        // Record successful token refresh for monitoring
        const userId = await authUtils.getUserId();
        authMonitoring.recordAuthEvent(
          AuthEventType.TOKEN_REFRESH_SUCCESS,
          { url: originalRequest.url },
          userId || undefined
        );
        
        // Reset token refresh failure count if successful
        if (userId) {
          authMonitoring.resetTokenRefreshFailures(userId);
        }
        
        // Mettre à jour les requêtes en attente
        refreshSubscribers.forEach(callback => callback(newToken));
        refreshSubscribers = [];
        
        // Mettre à jour l'en-tête de la requête originale
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        }
        
        // Réessayer la requête originale
        return api(originalRequest);
      } catch (refreshError) {
        console.error('[API] Erreur lors du rafraîchissement du token:', refreshError);
        
        // Record token refresh failure for monitoring
        const userId = await authUtils.getUserId();
        if (userId) {
          authMonitoring.recordTokenRefreshFailure(userId);
          
          // Check for suspicious pattern
          if (authMonitoring.isSuspiciousTokenRefreshPattern(userId)) {
            authMonitoring.recordAuthEvent(
              AuthEventType.SUSPICIOUS_ACTIVITY,
              { reason: 'token_refresh_pattern' },
              userId
            );
          }
        }
        
        // En cas d'échec, déconnecter l'utilisateur
        await authUtils.logout();
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Convertir l'erreur Axios en ApiError pour une meilleure gestion
    const apiError: ApiError = {
      status: error.response?.status || 500,
      message: error.message || 'Une erreur inconnue est survenue',
      code: error.code || 'UNKNOWN_ERROR'
    };

    // Pour les autres erreurs, les rejeter normalement
    return Promise.reject(apiError);
  }
);

export default api;
