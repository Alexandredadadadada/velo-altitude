// retry.service.js
const axios = require('axios');
const NodeCache = require('node-cache');

// Cache global pour les données API
const apiCache = new NodeCache();

/**
 * Crée un client API avec retry automatique
 * @param {Object} config - Configuration axios
 * @returns {Object} Client axios configuré
 */
const createApiClient = (config) => {
  const maxRetries = config.__maxRetries || 3;
  delete config.__maxRetries;
  
  const client = axios.create(config);
  
  // Intercepteur pour gérer les retries
  client.interceptors.response.use(null, async (error) => {
    const originalRequest = error.config;
    
    // Si la requête a déjà été retentée le nombre maximum de fois
    if (originalRequest.__retryCount >= maxRetries) {
      return Promise.reject(error);
    }
    
    // Initialiser le compteur de retry
    originalRequest.__retryCount = originalRequest.__retryCount || 0;
    originalRequest.__retryCount++;
    
    // Calculer le délai de retry avec backoff exponentiel
    const delay = Math.pow(2, originalRequest.__retryCount) * 1000;
    
    console.log(`Retry ${originalRequest.__retryCount}/${maxRetries} pour ${originalRequest.url} dans ${delay}ms`);
    
    // Attendre avant de réessayer
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Retenter la requête
    return client(originalRequest);
  });
  
  return client;
};

/**
 * Appelle une API avec retry et fallback vers une API alternative
 * @param {Function} primaryFetch - Fonction pour appeler l'API primaire
 * @param {Function} fallbackFetch - Fonction pour appeler l'API de fallback
 * @param {string} cacheKey - Clé pour le cache
 * @param {number} cacheTTL - Durée de vie du cache en secondes
 * @returns {Promise<Object>} Données de l'API
 */
const callApiWithFallback = async (primaryFetch, fallbackFetch, cacheKey, cacheTTL = 3600) => {
  // Vérifier le cache
  const cachedData = apiCache.get(cacheKey);
  if (cachedData) {
    console.log(`Utilisation des données en cache pour ${cacheKey}`);
    return cachedData;
  }
  
  try {
    // Essayer l'API primaire
    console.log(`Appel de l'API primaire pour ${cacheKey}`);
    const data = await primaryFetch();
    
    // Mettre en cache les données
    apiCache.set(cacheKey, data, cacheTTL);
    
    return data;
  } catch (primaryError) {
    console.error(`Erreur API primaire pour ${cacheKey}: ${primaryError.message}`);
    console.log(`Tentative avec l'API de fallback pour ${cacheKey}`);
    
    try {
      // Essayer l'API de fallback
      const fallbackData = await fallbackFetch();
      
      // Mettre en cache les données
      apiCache.set(cacheKey, fallbackData, cacheTTL);
      
      return fallbackData;
    } catch (fallbackError) {
      console.error(`Erreur API de fallback pour ${cacheKey}: ${fallbackError.message}`);
      
      // Si nous avons des données en cache expirées, les utiliser en dernier recours
      const staleData = apiCache.get(cacheKey, true);
      if (staleData) {
        console.log(`Utilisation de données périmées pour ${cacheKey}`);
        return {
          ...staleData,
          stale: true,
          staleReason: 'Échec des API primaire et de fallback'
        };
      }
      
      // Sinon, propager l'erreur
      throw new Error(`Échec des API primaire et de fallback: ${primaryError.message}, ${fallbackError.message}`);
    }
  }
};

module.exports = {
  createApiClient,
  callApiWithFallback
};
