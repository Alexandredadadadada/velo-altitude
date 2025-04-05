/**
 * Utilitaire de mise en cache des données météo
 * Optimise les performances en évitant les requêtes répétées pour les mêmes données
 * Utilise localStorage pour la persistance entre les sessions
 */

// Durée de validité du cache en millisecondes (1 heure)
const CACHE_DURATION = 60 * 60 * 1000;

// Durée maximale avant purge forcée (24 heures)
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

// Clé utilisée dans localStorage
const STORAGE_KEY = 'grand-est-cyclisme:weather-cache';

// Structure de cache
const weatherCache = {
  data: new Map(),
  
  /**
   * Initialise le cache au démarrage, charge les données depuis localStorage
   */
  init() {
    try {
      const storedCache = localStorage.getItem(STORAGE_KEY);
      if (storedCache) {
        const parsedCache = JSON.parse(storedCache);
        
        // Convertir l'objet en Map
        this.data = new Map();
        Object.keys(parsedCache).forEach(key => {
          this.data.set(key, parsedCache[key]);
        });
        
        console.log(`[WeatherCache] Chargement du cache depuis localStorage: ${this.data.size} entrées`);
        
        // Purger les entrées trop anciennes
        this.purgeExpiredEntries();
      }
    } catch (error) {
      console.error('[WeatherCache] Erreur lors du chargement du cache:', error);
      this.data = new Map();
    }
    
    // Planifier une purge automatique toutes les heures
    setInterval(() => this.purgeExpiredEntries(), 60 * 60 * 1000);
  },
  
  /**
   * Sauvegarde le cache dans localStorage
   */
  saveToLocalStorage() {
    try {
      // Convertir Map en objet pour stockage
      const cacheObject = {};
      this.data.forEach((value, key) => {
        cacheObject[key] = value;
      });
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheObject));
      console.log(`[WeatherCache] Cache sauvegardé dans localStorage: ${this.data.size} entrées`);
    } catch (error) {
      console.error('[WeatherCache] Erreur lors de la sauvegarde du cache:', error);
    }
  },
  
  /**
   * Supprime les entrées expirées du cache
   */
  purgeExpiredEntries() {
    const now = Date.now();
    let purgedCount = 0;
    
    this.data.forEach((value, key) => {
      if (now - value.timestamp > CACHE_MAX_AGE) {
        this.data.delete(key);
        purgedCount++;
      }
    });
    
    if (purgedCount > 0) {
      console.log(`[WeatherCache] Purge automatique: ${purgedCount} entrées supprimées`);
      this.saveToLocalStorage();
    }
    
    return purgedCount;
  },
  
  /**
   * Récupère les données météo depuis le cache ou via l'API
   * @param {string} latitude - Latitude de la position
   * @param {string} longitude - Longitude de la position
   * @param {Function} fetchFunction - Fonction de récupération des données depuis l'API
   * @returns {Promise<Object>} Données météo
   */
  async getWeatherData(latitude, longitude, fetchFunction) {
    const cacheKey = `${latitude},${longitude}`;
    const cachedData = this.data.get(cacheKey);
    
    // Vérifier si les données sont dans le cache et toujours valides
    if (cachedData && (Date.now() - cachedData.timestamp < CACHE_DURATION)) {
      console.log(`[WeatherCache] ✅ Utilisation des données météo en cache pour ${cacheKey}`);
      return cachedData.data;
    }
    
    try {
      // Récupérer de nouvelles données
      console.log(`[WeatherCache] 🔄 Récupération de nouvelles données météo pour ${cacheKey}`);
      const weatherData = await fetchFunction(latitude, longitude);
      
      // Stocker dans le cache
      this.data.set(cacheKey, {
        data: weatherData,
        timestamp: Date.now()
      });
      
      // Sauvegarder dans localStorage
      this.saveToLocalStorage();
      
      return weatherData;
    } catch (error) {
      console.error(`[WeatherCache] ❌ Erreur lors de la récupération des données météo pour ${cacheKey}:`, error);
      
      // En cas d'erreur, utiliser les données en cache même si elles sont expirées
      if (cachedData) {
        console.log(`[WeatherCache] ⚠️ Utilisation des données en cache expirées pour ${cacheKey}`);
        return cachedData.data;
      }
      
      // Si pas de données en cache, renvoyer des données par défaut
      console.log(`[WeatherCache] ⚠️ Utilisation des données météo par défaut pour ${cacheKey}`);
      return this.getDefaultWeatherData();
    }
  },
  
  /**
   * Fournit des données météo par défaut en cas d'échec de récupération
   * @returns {Object} Données météo par défaut
   */
  getDefaultWeatherData() {
    return {
      current: {
        temp: 15,
        weather: [
          {
            main: 'Clouds',
            description: 'Information météo non disponible',
            icon: 'unknown'
          }
        ],
        humidity: 50,
        wind_speed: 10,
        visibility: 10000,
        pressure: 1013
      },
      daily: Array(5).fill().map((_, i) => ({
        dt: Date.now() / 1000 + i * 86400,
        temp: {
          min: 10,
          max: 20
        },
        weather: [
          {
            main: 'Clouds',
            description: 'Information prévision non disponible',
            icon: 'unknown'
          }
        ]
      }))
    };
  },
  
  /**
   * Vide le cache complet
   */
  clearCache() {
    this.data.clear();
    localStorage.removeItem(STORAGE_KEY);
    console.log('[WeatherCache] 🧹 Cache entièrement vidé');
  },
  
  /**
   * Obtient des statistiques sur l'état du cache
   * @returns {Object} Statistiques du cache
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    
    this.data.forEach((value) => {
      if (now - value.timestamp < CACHE_DURATION) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    });
    
    return {
      totalEntries: this.data.size,
      validEntries,
      expiredEntries,
      oldestEntryAge: this.getOldestEntryAge()
    };
  },
  
  /**
   * Obtient l'âge de l'entrée la plus ancienne en minutes
   * @returns {number} Âge en minutes
   */
  getOldestEntryAge() {
    let oldestTimestamp = Date.now();
    
    this.data.forEach((value) => {
      if (value.timestamp < oldestTimestamp) {
        oldestTimestamp = value.timestamp;
      }
    });
    
    return Math.round((Date.now() - oldestTimestamp) / (60 * 1000));
  }
};

// Initialiser le cache au chargement du module
weatherCache.init();

export default weatherCache;
