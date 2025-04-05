/**
 * Service de mise en cache des itinéraires OpenRouteService
 * Optimise la consommation de l'API en stockant les résultats fréquemment demandés
 * Inclut la persistance locale et un mécanisme de purge automatique
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('./logger');

class RouteCache {
  constructor() {
    // Paramètres de configuration
    this.CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 jours en millisecondes
    this.CACHE_CHECK_INTERVAL = 60 * 60 * 1000;    // Vérification toutes les heures
    this.CACHE_DIRECTORY = path.join(__dirname, '../data/cache/routes');
    this.MAX_CACHE_SIZE = 500;                     // Nombre maximum d'itinéraires en cache
    
    // Durées de cache adaptatives selon l'importance
    this.CACHE_DURATIONS = {
      HIGH: 30 * 24 * 60 * 60 * 1000,  // 30 jours pour les itinéraires très importants
      MEDIUM: 14 * 24 * 60 * 60 * 1000, // 14 jours pour les itinéraires moyennement importants
      LOW: 7 * 24 * 60 * 60 * 1000,    // 7 jours pour les itinéraires peu importants
      TEMPORARY: 24 * 60 * 60 * 1000   // 24 heures pour les itinéraires temporaires
    };
    
    // Initialisation du cache en mémoire
    this.data = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      saved: 0,
      errors: 0,
      lastPurge: null,
      adaptiveHits: 0,      // Nombre de fois où la stratégie adaptative a été utilisée
      cacheEfficiency: 0    // Ratio hits/(hits+misses)
    };
    
    // Métriques d'utilisation pour la stratégie adaptative
    this.usageMetrics = new Map();
    
    // Créer le répertoire de cache s'il n'existe pas
    this._ensureCacheDirectoryExists();
    
    // Charger le cache depuis le stockage local
    this._loadCacheFromDisk();
    
    // Configurer la purge périodique
    this.purgeInterval = setInterval(() => this._purgeExpiredData(), this.CACHE_CHECK_INTERVAL);
    
    // Configurer l'analyse périodique des métriques d'utilisation
    this.metricsInterval = setInterval(() => this._analyzeUsageMetrics(), 12 * 60 * 60 * 1000); // Toutes les 12 heures
    
    logger.info('Service de cache d\'itinéraires initialisé avec stratégie adaptative');
  }
  
  /**
   * Récupère un itinéraire du cache ou le génère via la fonction fournie
   * @param {string} startCoords Coordonnées de départ (format: "lat,lng")
   * @param {string} endCoords Coordonnées d'arrivée (format: "lat,lng")
   * @param {Array<string>} waypointCoords Points intermédiaires (format: ["lat,lng", "lat,lng"])
   * @param {string} profile Profil d'itinéraire (cycling, foot, etc.)
   * @param {Object} options Options supplémentaires pour le calcul d'itinéraire
   * @param {Function} fetchFunction Fonction asynchrone pour récupérer les données si non présentes en cache
   * @returns {Promise<Object>} Données d'itinéraire
   */
  async getRouteData(startCoords, endCoords, waypointCoords = [], profile = 'cycling-road', options = {}, fetchFunction) {
    try {
      // Générer une clé de cache unique basée sur les paramètres
      const cacheKey = this._generateCacheKey(startCoords, endCoords, waypointCoords, profile, options);
      
      // Mettre à jour les métriques d'utilisation
      this._updateUsageMetrics(cacheKey);
      
      // Vérifier si les données sont en cache et valides
      const cachedData = this.data.get(cacheKey);
      
      if (cachedData && this._isCacheValid(cachedData.timestamp, cachedData.importance)) {
        this.stats.hits++;
        logger.debug(`Cache hit pour l'itinéraire: ${startCoords} → ${endCoords} [${profile}]`);
        return cachedData.data;
      }
      
      // Données non trouvées en cache ou expirées
      this.stats.misses++;
      logger.debug(`Cache miss pour l'itinéraire: ${startCoords} → ${endCoords} [${profile}]`);
      
      // Récupérer les données via la fonction fournie
      const routeData = await fetchFunction();
      
      // Déterminer l'importance de l'itinéraire pour la stratégie de cache
      const importance = this._determineRouteImportance(startCoords, endCoords, waypointCoords, options);
      
      // Stocker les données dans le cache avec l'importance déterminée
      this._storeInCache(cacheKey, routeData, importance);
      
      return routeData;
    } catch (error) {
      this.stats.errors++;
      logger.error(`Erreur lors de la récupération des données d'itinéraire: ${error.message}`);
      // Retourner les données en cache même si expirées en cas d'erreur
      const cachedData = this.data.get(this._generateCacheKey(startCoords, endCoords, waypointCoords, profile, options));
      if (cachedData) {
        logger.info(`Utilisation des données d'itinéraire en cache (potentiellement expirées) suite à une erreur`);
        return cachedData.data;
      }
      
      // Si pas de données en cache, propager l'erreur
      throw error;
    }
  }
  
  /**
   * Vérifie si les données en cache sont encore valides
   * @param {number} timestamp Timestamp de mise en cache
   * @param {string} importance Niveau d'importance de l'itinéraire
   * @returns {boolean} True si les données sont valides
   * @private
   */
  _isCacheValid(timestamp, importance = 'LOW') {
    const now = Date.now();
    const cacheDuration = this.CACHE_DURATIONS[importance] || this.CACHE_DURATION;
    return (now - timestamp) < cacheDuration;
  }
  
  /**
   * Stocke les données dans le cache en mémoire et sur le disque
   * @param {string} key Clé de cache
   * @param {Object} data Données à mettre en cache
   * @param {string} importance Niveau d'importance ('HIGH', 'MEDIUM', 'LOW', 'TEMPORARY')
   * @private
   */
  _storeInCache(key, data, importance = 'LOW') {
    // Vérifier si le cache est plein
    if (this.data.size >= this.MAX_CACHE_SIZE && !this.data.has(key)) {
      // Si le cache est plein, supprimer l'entrée la moins importante ou la plus ancienne
      this._removeOldestOrLeastImportant();
    }
    
    // Stocker les données avec timestamp et importance
    this.data.set(key, {
      data,
      timestamp: Date.now(),
      importance,
      accessCount: 0
    });
    
    this.stats.saved++;
    
    // Sauvegarder périodiquement sur le disque (pas à chaque mise à jour)
    if (this.stats.saved % 10 === 0) {
      this._saveCacheToDisk();
    }
  }
  
  /**
   * Supprime l'entrée la plus ancienne ou la moins importante du cache
   * @private
   */
  _removeOldestOrLeastImportant() {
    // Priorité: TEMPORARY > LOW > MEDIUM > HIGH
    const importancePriority = {
      'TEMPORARY': 0,
      'LOW': 1,
      'MEDIUM': 2,
      'HIGH': 3
    };
    
    let oldestKey = null;
    let oldestTimestamp = Infinity;
    let lowestImportance = Infinity;
    
    // Parcourir toutes les entrées pour trouver la moins importante ou la plus ancienne
    for (const [key, entry] of this.data.entries()) {
      const entryImportance = importancePriority[entry.importance] || 1;
      
      // Si on trouve une entrée moins importante, la sélectionner
      if (entryImportance < lowestImportance) {
        lowestImportance = entryImportance;
        oldestKey = key;
        oldestTimestamp = entry.timestamp;
      } 
      // Si même importance, prendre la plus ancienne
      else if (entryImportance === lowestImportance && entry.timestamp < oldestTimestamp) {
        oldestKey = key;
        oldestTimestamp = entry.timestamp;
      }
    }
    
    // Supprimer l'entrée sélectionnée
    if (oldestKey) {
      this.data.delete(oldestKey);
      logger.debug(`Cache plein: suppression de l'entrée la moins importante/plus ancienne: ${oldestKey}`);
    }
  }
  
  /**
   * Purge les données expirées du cache
   * @private
   */
  _purgeExpiredData() {
    const now = Date.now();
    let purgedCount = 0;
    
    for (const [key, entry] of this.data.entries()) {
      // Vérifier si l'entrée est expirée en fonction de son importance
      if (!this._isCacheValid(entry.timestamp, entry.importance)) {
        this.data.delete(key);
        purgedCount++;
      }
    }
    
    if (purgedCount > 0) {
      logger.info(`Purge du cache d'itinéraires: ${purgedCount} entrées expirées supprimées`);
      this._saveCacheToDisk();
    }
    
    this.stats.lastPurge = now;
    
    // Mettre à jour l'efficacité du cache
    const total = this.stats.hits + this.stats.misses;
    this.stats.cacheEfficiency = total > 0 ? Math.round((this.stats.hits / total) * 100) : 0;
    
    return purgedCount;
  }
  
  /**
   * Met à jour les métriques d'utilisation pour une clé de cache
   * @param {string} key Clé de cache
   * @private
   */
  _updateUsageMetrics(key) {
    // Récupérer ou initialiser les métriques pour cette clé
    const metrics = this.usageMetrics.get(key) || {
      accessCount: 0,
      lastAccess: 0,
      firstAccess: Date.now()
    };
    
    // Mettre à jour les métriques
    metrics.accessCount++;
    metrics.lastAccess = Date.now();
    
    // Mettre à jour également le compteur d'accès dans l'entrée de cache si elle existe
    const cacheEntry = this.data.get(key);
    if (cacheEntry) {
      cacheEntry.accessCount = (cacheEntry.accessCount || 0) + 1;
    }
    
    // Stocker les métriques mises à jour
    this.usageMetrics.set(key, metrics);
  }
  
  /**
   * Analyse les métriques d'utilisation pour ajuster les stratégies de cache
   * @private
   */
  _analyzeUsageMetrics() {
    const now = Date.now();
    const recentThreshold = now - (7 * 24 * 60 * 60 * 1000); // 7 derniers jours
    
    // Identifier les itinéraires fréquemment utilisés
    for (const [key, metrics] of this.usageMetrics.entries()) {
      // Ignorer les métriques trop anciennes
      if (metrics.lastAccess < recentThreshold) {
        continue;
      }
      
      const cacheEntry = this.data.get(key);
      if (!cacheEntry) {
        continue;
      }
      
      // Déterminer la nouvelle importance basée sur la fréquence d'utilisation
      let newImportance = 'LOW';
      
      if (metrics.accessCount >= 10) {
        newImportance = 'HIGH';
      } else if (metrics.accessCount >= 5) {
        newImportance = 'MEDIUM';
      }
      
      // Mettre à jour l'importance si nécessaire
      if (newImportance !== cacheEntry.importance) {
        cacheEntry.importance = newImportance;
        this.stats.adaptiveHits++;
        logger.debug(`Importance de l'itinéraire ajustée: ${key} → ${newImportance} (${metrics.accessCount} accès)`);
      }
    }
    
    // Nettoyer les métriques trop anciennes
    for (const [key, metrics] of this.usageMetrics.entries()) {
      if (metrics.lastAccess < recentThreshold) {
        this.usageMetrics.delete(key);
      }
    }
    
    logger.info(`Analyse des métriques d'utilisation terminée: ${this.usageMetrics.size} itinéraires analysés`);
  }
  
  /**
   * Détermine l'importance d'un itinéraire pour la stratégie de cache
   * @param {string} startCoords Coordonnées de départ
   * @param {string} endCoords Coordonnées d'arrivée
   * @param {Array<string>} waypointCoords Points intermédiaires
   * @param {Object} options Options de l'itinéraire
   * @returns {string} Niveau d'importance ('HIGH', 'MEDIUM', 'LOW', 'TEMPORARY')
   * @private
   */
  _determineRouteImportance(startCoords, endCoords, waypointCoords = [], options = {}) {
    // Vérifier si c'est un itinéraire populaire (à définir selon vos critères)
    const isPopularRoute = this._isPopularRoute(startCoords, endCoords);
    
    // Vérifier si c'est un itinéraire touristique (basé sur les options ou autres critères)
    const isTouristicRoute = options.touristic === true || options.scenic === true;
    
    // Vérifier si c'est un itinéraire complexe (avec plusieurs waypoints)
    const isComplexRoute = waypointCoords.length >= 3;
    
    // Vérifier si c'est un itinéraire temporaire (par exemple, pour un événement)
    const isTemporaryRoute = options.temporary === true || options.event === true;
    
    // Déterminer l'importance
    if (isTemporaryRoute) {
      return 'TEMPORARY';
    } else if (isPopularRoute) {
      return 'HIGH';
    } else if (isTouristicRoute || isComplexRoute) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }
  
  /**
   * Vérifie si un itinéraire est considéré comme populaire
   * @param {string} startCoords Coordonnées de départ
   * @param {string} endCoords Coordonnées d'arrivée
   * @returns {boolean} True si l'itinéraire est populaire
   * @private
   */
  _isPopularRoute(startCoords, endCoords) {
    // Liste des coordonnées de points populaires (à adapter selon vos données)
    const popularLocations = [
      // Exemples de lieux populaires dans le Grand Est
      "48.5734053,7.7521113", // Strasbourg
      "49.1193089,6.1757156", // Metz
      "48.6937223,6.1834097", // Nancy
      "49.2577886,4.0346222", // Reims
      "48.3242699,4.1634642", // Troyes
      "48.9575329,8.1446319", // Wissembourg
      "47.7467599,7.3389679"  // Mulhouse
    ];
    
    // Vérifier si le départ ou l'arrivée est un lieu populaire
    const isPopularStart = popularLocations.some(loc => {
      // Comparer les 5 premiers chiffres pour une correspondance approximative
      return startCoords.substring(0, 7) === loc.substring(0, 7);
    });
    
    const isPopularEnd = popularLocations.some(loc => {
      return endCoords.substring(0, 7) === loc.substring(0, 7);
    });
    
    // Un itinéraire est populaire si le départ ET l'arrivée sont des lieux populaires
    return isPopularStart && isPopularEnd;
  }
  
  /**
   * Retourne les statistiques du cache
   * @returns {Object} Statistiques du cache
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.data.size,
      cacheLimit: this.MAX_CACHE_SIZE,
      cacheDuration: `${this.CACHE_DURATION / (24 * 60 * 60 * 1000)} jours`,
      adaptiveStats: {
        highImportanceCount: this._countByImportance('HIGH'),
        mediumImportanceCount: this._countByImportance('MEDIUM'),
        lowImportanceCount: this._countByImportance('LOW'),
        temporaryCount: this._countByImportance('TEMPORARY')
      }
    };
  }
  
  /**
   * Compte le nombre d'entrées de cache par niveau d'importance
   * @param {string} importance Niveau d'importance
   * @returns {number} Nombre d'entrées
   * @private
   */
  _countByImportance(importance) {
    let count = 0;
    for (const entry of this.data.values()) {
      if (entry.importance === importance) {
        count++;
      }
    }
    return count;
  }
  
  /**
   * Arrête le service de cache (nettoyage)
   */
  shutdown() {
    if (this.purgeInterval) {
      clearInterval(this.purgeInterval);
    }
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    this._saveCacheToDisk();
    logger.info('Service de cache d\'itinéraires arrêté');
  }
  
  // ... Reste du code inchangé ...
}

// Créer une instance singleton
const routeCache = new RouteCache();

module.exports = routeCache;
