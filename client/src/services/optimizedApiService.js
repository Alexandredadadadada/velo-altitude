/**
 * Service API optimisé pour Velo-Altitude
 * Implémente des stratégies avancées de cache et de gestion des erreurs
 * Compatible avec le système de cache Redis backend
 */

import axios from 'axios';
import { ErrorMessagesService } from './ErrorMessagesService';
import { apiErrorInterceptor } from './apiErrorInterceptor';
import clientFingerprintService from './clientFingerprintService';

class OptimizedApiService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || '/api';
    this.localCache = new Map();
    this.pendingRequests = new Map();

    // Configuration de base pour axios
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 20000,
      headers: {
        'Content-Type': 'application/json',
        'X-Client-Id': clientFingerprintService.getFingerprint()
      }
    });

    // Intercepteurs pour la gestion des erreurs
    this.client.interceptors.response.use(
      response => response,
      error => apiErrorInterceptor(error)
    );
  }

  /**
   * Exécute une requête API avec stratégies de cache optimisées
   * @param {string} endpoint - Point d'entrée API
   * @param {Object} options - Options de requête
   * @param {Object} cacheOptions - Options de cache
   */
  async request(endpoint, options = {}, cacheOptions = {}) {
    const {
      method = 'GET',
      params = {},
      data = null,
      headers = {}
    } = options;

    const {
      useCache = true,
      cacheTTL = 300000, // 5 minutes par défaut
      forceRefresh = false,
      cacheKey = null
    } = cacheOptions;

    // Générer une clé de cache unique
    const key = cacheKey || this._generateCacheKey(endpoint, method, params, data);

    // Stratégie 1: Retourner depuis le cache si valide
    if (method === 'GET' && useCache && !forceRefresh) {
      const cachedItem = this.localCache.get(key);
      if (cachedItem && cachedItem.expires > Date.now()) {
        console.log(`[OptimizedApiService] Cache hit: ${endpoint}`);
        return Promise.resolve(cachedItem.data);
      }
    }

    // Stratégie 2: Requêtes en cours de déduplications
    if (method === 'GET' && this.pendingRequests.has(key)) {
      console.log(`[OptimizedApiService] Request deduplication: ${endpoint}`);
      return this.pendingRequests.get(key);
    }

    // Préparer la requête
    const request = this.client({
      url: endpoint,
      method,
      params,
      data,
      headers: {
        ...headers,
        'Cache-Control': forceRefresh ? 'no-cache' : undefined
      }
    })
      .then(response => {
        // Mettre en cache le résultat si c'est un GET
        if (method === 'GET' && useCache) {
          this.localCache.set(key, {
            data: response.data,
            expires: Date.now() + cacheTTL
          });
        }
        
        // Nettoyer des requêtes en cours
        if (method === 'GET') {
          this.pendingRequests.delete(key);
        }
        
        return response.data;
      })
      .catch(error => {
        // Nettoyer des requêtes en cours
        if (method === 'GET') {
          this.pendingRequests.delete(key);
        }
        
        // Logique avancée de gestion des erreurs
        const errorMessage = ErrorMessagesService.getMessageForError(error);
        console.error(`[OptimizedApiService] Request failed: ${endpoint}`, error);
        
        throw error;
      });

    // Enregistrer la requête en cours
    if (method === 'GET') {
      this.pendingRequests.set(key, request);
    }

    return request;
  }

  /**
   * Génère une clé de cache unique pour une requête
   */
  _generateCacheKey(endpoint, method, params, data) {
    const paramsString = params ? JSON.stringify(params) : '';
    const dataString = data ? JSON.stringify(data) : '';
    return `${method}:${endpoint}:${paramsString}:${dataString}`;
  }

  /**
   * Vide le cache complet ou pour un endpoint spécifique
   */
  clearCache(endpoint = null, params = null) {
    if (!endpoint) {
      console.log('[OptimizedApiService] Clearing entire cache');
      this.localCache.clear();
      return;
    }

    // Supprimer les entrées spécifiques
    const prefix = endpoint;
    const paramsString = params ? JSON.stringify(params) : '';
    
    for (const key of this.localCache.keys()) {
      if (key.startsWith(`GET:${prefix}`) && 
          (params === null || key.includes(paramsString))) {
        this.localCache.delete(key);
      }
    }
    
    console.log(`[OptimizedApiService] Cache cleared for: ${endpoint}`);
  }

  // Méthodes d'utilité pour les requêtes communes
  get(endpoint, params = {}, cacheOptions = {}) {
    return this.request(endpoint, { method: 'GET', params }, cacheOptions);
  }

  post(endpoint, data = {}, options = {}) {
    return this.request(endpoint, { method: 'POST', data, ...options }, { useCache: false });
  }

  put(endpoint, data = {}, options = {}) {
    return this.request(endpoint, { method: 'PUT', data, ...options }, { useCache: false });
  }

  delete(endpoint, params = {}, options = {}) {
    return this.request(endpoint, { method: 'DELETE', params, ...options }, { useCache: false });
  }
}

// Exporter une instance singleton
export default new OptimizedApiService();
