/**
 * Service de cache avancé pour les données météo
 * Implémente un système de cache à plusieurs niveaux avec TTL dynamique
 */

const NodeCache = require('node-cache');
const mongoose = require('mongoose');
const { logger } = require('../utils/logger');
const geoClusteringService = require('./geo-clustering.service');

// Schéma MongoDB pour les données de cache météo persistantes
const weatherCacheSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    index: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      index: '2dsphere'
    }
  },
  radius: {
    type: Number,
    default: 0 // Rayon de validité en km
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // TTL de 24h par défaut, ajusté dynamiquement
  },
  expiresAt: {
    type: Date,
    required: true
  },
  accessCount: {
    type: Number,
    default: 0
  },
  dataType: {
    type: String,
    enum: ['current', 'forecast', 'hourly', 'uv', 'air', 'alert'],
    required: true
  },
  dataHash: {
    type: String // Hash des données pour vérifier les changements
  }
}, { 
  timestamps: true 
});

// Index géospatial pour les recherches par localisation
weatherCacheSchema.index({ location: '2dsphere' });

// Modèle pour le cache persistant
let WeatherCacheModel;
try {
  WeatherCacheModel = mongoose.model('WeatherCache');
} catch (error) {
  WeatherCacheModel = mongoose.model('WeatherCache', weatherCacheSchema);
}

class WeatherCacheService {
  constructor() {
    // Cache en mémoire (premier niveau, rapide)
    this.memoryCache = new NodeCache({
      stdTTL: 600, // 10 minutes par défaut
      checkperiod: 60, // Vérification chaque minute
      useClones: false, // Pour économiser de la mémoire
      deleteOnExpire: true
    });

    // Configuration
    this.config = {
      // TTL dynamique basé sur le type de données (en secondes)
      ttl: {
        current: {
          base: 900, // 15 minutes de base pour les données actuelles
          night: 1800, // 30 minutes la nuit
          cloudy: 1200, // 20 minutes par temps couvert
          rainy: 600, // 10 minutes par temps pluvieux
          clear: 1500 // 25 minutes par temps clair
        },
        forecast: {
          base: 3600, // 1 heure de base pour les prévisions
          night: 7200, // 2 heures la nuit
          shortTerm: 1800, // 30 minutes pour les prévisions à court terme
          longTerm: 10800 // 3 heures pour les prévisions à long terme
        },
        hourly: {
          base: 1800, // 30 minutes de base pour les données horaires
          night: 3600 // 1 heure la nuit
        },
        uv: {
          base: 3600, // 1 heure de base pour l'indice UV
          night: 7200 // 2 heures la nuit
        },
        air: {
          base: 3600, // 1 heure de base pour la pollution de l'air
          night: 7200 // 2 heures la nuit
        },
        alert: {
          base: 300, // 5 minutes pour les alertes
          severe: 60 // 1 minute pour les alertes sévères
        }
      },
      // Distance maximale (en km) pour la réutilisation des données
      reuseDistance: {
        current: 5,
        forecast: 10,
        hourly: 8,
        uv: 20,
        air: 15,
        alert: 3
      },
      // Stratégies de persistance
      persistThreshold: 3, // Nombre d'accès avant de persister en base de données
      // Taux de changement au-delà duquel une mise à jour est nécessaire
      changeThreshold: 0.15 // 15% de changement
    };

    logger.info('Service de cache météo avancé initialisé');
  }

  /**
   * Obtient les données météo du cache ou les récupère via la fonction fournie
   * @param {string} cacheKey - Clé unique pour le cache
   * @param {Function} fetchDataFn - Fonction pour récupérer les données si non cachées
   * @param {Object} options - Options de cache
   * @returns {Promise<Object>} Données météo
   */
  async getOrFetch(cacheKey, fetchDataFn, options = {}) {
    try {
      // Options par défaut
      const defaultOptions = {
        type: 'current', // Type de données: current, forecast, hourly, uv, air, alert
        lat: null,
        lon: null,
        forceRefresh: false,
        timeFrame: null, // Pour les prévisions: short, medium, long
        persistToDb: true,
        weatherCondition: null // cloudy, rainy, clear, etc.
      };

      const opts = { ...defaultOptions, ...options };
      
      // Vérifier le cache mémoire en premier
      let cachedData = this.memoryCache.get(cacheKey);
      let source = 'memory';
      
      // Si les données ne sont pas dans le cache mémoire, vérifier le cache persistant
      if (!cachedData && opts.persistToDb && opts.lat && opts.lon) {
        cachedData = await this._getFromPersistentCache(cacheKey, opts);
        source = 'db';
      }
      
      // Vérifier la validité du cache et si un rafraîchissement est nécessaire
      if (cachedData && !opts.forceRefresh && !this._needsRefresh(cachedData, opts)) {
        logger.debug(`Utilisation du cache ${source} pour ${cacheKey}`);
        
        // Incrémenter le compteur d'accès
        this._incrementAccessCount(cacheKey, cachedData, source);
        
        return cachedData.data;
      }
      
      // Si nous arrivons ici, nous devons récupérer les données fraîches
      const freshData = await fetchDataFn();
      
      // Mettre en cache les nouvelles données
      await this._cacheData(cacheKey, freshData, opts);
      
      return freshData;
    } catch (error) {
      logger.error(`Erreur dans le cache météo pour ${cacheKey}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Obtient les données du cache persistant
   * @private
   * @param {string} key - Clé de cache
   * @param {Object} options - Options de recherche
   * @returns {Promise<Object>} Données en cache ou null
   */
  async _getFromPersistentCache(key, options) {
    try {
      // Cas 1: Recherche par clé exacte
      let cacheEntry = await WeatherCacheModel.findOne({ key });
      
      // Cas 2: Si pas trouvé et coordonnées fournies, recherche par proximité géographique
      if (!cacheEntry && options.lat && options.lon) {
        const maxDistance = this.config.reuseDistance[options.type] || 10;
        
        cacheEntry = await WeatherCacheModel.findOne({
          dataType: options.type,
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [options.lon, options.lat]
              },
              $maxDistance: maxDistance * 1000 // Conversion en mètres
            }
          },
          expiresAt: { $gt: new Date() }
        }).sort({ createdAt: -1 });
      }
      
      if (cacheEntry) {
        // Vérifier si l'entrée est encore valide
        if (new Date() < new Date(cacheEntry.expiresAt)) {
          // Mettre à jour le compteur d'accès
          cacheEntry.accessCount += 1;
          await cacheEntry.save();
          
          // Mettre également en cache mémoire pour accès plus rapide
          this._setMemoryCache(key, cacheEntry.data, options);
          
          return {
            data: cacheEntry.data,
            timestamp: cacheEntry.createdAt,
            expiresAt: cacheEntry.expiresAt,
            accessCount: cacheEntry.accessCount,
            dataHash: cacheEntry.dataHash
          };
        }
      }
      
      return null;
    } catch (error) {
      logger.error(`Erreur lors de la récupération du cache persistant: ${error.message}`);
      return null; // En cas d'erreur, on procède comme si le cache n'existait pas
    }
  }

  /**
   * Met les données en cache (mémoire et potentiellement base de données)
   * @private
   * @param {string} key - Clé de cache
   * @param {Object} data - Données à mettre en cache
   * @param {Object} options - Options de mise en cache
   * @returns {Promise<void>}
   */
  async _cacheData(key, data, options) {
    try {
      // Déterminer le TTL dynamique
      const ttl = this._calculateDynamicTTL(options);
      
      // Mettre en cache mémoire
      this._setMemoryCache(key, data, { ...options, ttl });
      
      // Persister en base de données si nécessaire
      if (options.persistToDb && options.lat && options.lon) {
        await this._persistToDatabase(key, data, options, ttl);
      }
    } catch (error) {
      logger.error(`Erreur lors de la mise en cache des données: ${error.message}`);
      // Continuer malgré l'erreur, le cache n'est pas critique
    }
  }

  /**
   * Stocke les données dans le cache mémoire
   * @private
   * @param {string} key - Clé de cache
   * @param {Object} data - Données à mettre en cache
   * @param {Object} options - Options de mise en cache
   */
  _setMemoryCache(key, data, options) {
    const ttl = options.ttl || this.config.ttl[options.type]?.base || 600;
    
    this.memoryCache.set(key, {
      data,
      timestamp: new Date(),
      expiresAt: new Date(Date.now() + ttl * 1000),
      accessCount: 0,
      dataHash: this._calculateDataHash(data)
    }, ttl);
  }

  /**
   * Persiste les données en base de données
   * @private
   * @param {string} key - Clé de cache
   * @param {Object} data - Données à mettre en cache
   * @param {Object} options - Options de mise en cache
   * @param {number} ttl - Durée de vie en secondes
   * @returns {Promise<void>}
   */
  async _persistToDatabase(key, data, options, ttl) {
    try {
      const dataHash = this._calculateDataHash(data);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + ttl * 1000);
      
      // Vérifier si une entrée existe déjà
      let cacheEntry = await WeatherCacheModel.findOne({ key });
      
      if (cacheEntry) {
        // Mettre à jour l'entrée existante
        cacheEntry.data = data;
        cacheEntry.expiresAt = expiresAt;
        cacheEntry.dataHash = dataHash;
        if (options.lat && options.lon) {
          cacheEntry.location = {
            type: 'Point',
            coordinates: [options.lon, options.lat]
          };
        }
        await cacheEntry.save();
      } else {
        // Créer une nouvelle entrée
        cacheEntry = new WeatherCacheModel({
          key,
          data,
          dataType: options.type,
          expiresAt,
          dataHash,
          location: options.lat && options.lon ? {
            type: 'Point',
            coordinates: [options.lon, options.lat]
          } : undefined,
          radius: this.config.reuseDistance[options.type] || 0
        });
        await cacheEntry.save();
      }
    } catch (error) {
      logger.error(`Erreur lors de la persistance en base de données: ${error.message}`);
    }
  }

  /**
   * Calcule un TTL dynamique basé sur différents facteurs
   * @private
   * @param {Object} options - Options pour calculer le TTL
   * @returns {number} TTL en secondes
   */
  _calculateDynamicTTL(options) {
    const config = this.config.ttl[options.type] || { base: 600 };
    let ttl = config.base;
    
    // Ajuster en fonction de l'heure du jour
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour > 21;
    if (isNight && config.night) {
      ttl = config.night;
    }
    
    // Ajuster en fonction des conditions météo
    if (options.weatherCondition && config[options.weatherCondition]) {
      ttl = config[options.weatherCondition];
    }
    
    // Ajuster en fonction de l'horizon des prévisions
    if (options.type === 'forecast' && options.timeFrame) {
      if (options.timeFrame === 'short' && config.shortTerm) {
        ttl = config.shortTerm;
      } else if (options.timeFrame === 'long' && config.longTerm) {
        ttl = config.longTerm;
      }
    }
    
    // Ajuster en fonction de la sévérité des alertes
    if (options.type === 'alert' && options.severity === 'severe' && config.severe) {
      ttl = config.severe;
    }
    
    return ttl;
  }

  /**
   * Détermine si les données mises en cache doivent être rafraîchies
   * @private
   * @param {Object} cachedData - Données en cache
   * @param {Object} options - Options de cache
   * @returns {boolean} Vrai si un rafraîchissement est nécessaire
   */
  _needsRefresh(cachedData, options) {
    // Si la date d'expiration est dépassée
    if (new Date() > new Date(cachedData.expiresAt)) {
      return true;
    }
    
    return false;
  }

  /**
   * Incrémente le compteur d'accès et potentiellement persiste en base de données
   * @private
   * @param {string} key - Clé de cache
   * @param {Object} cachedData - Données en cache
   * @param {string} source - Source du cache (memory ou db)
   */
  _incrementAccessCount(key, cachedData, source) {
    // Incrémenter le compteur en mémoire
    if (source === 'memory') {
      cachedData.accessCount += 1;
      
      // Si le seuil est atteint et pas encore en base de données, persister
      if (cachedData.accessCount >= this.config.persistThreshold) {
        this._persistPopularData(key, cachedData);
      }
    }
  }

  /**
   * Persiste les données populaires en base de données
   * @private
   * @param {string} key - Clé de cache
   * @param {Object} cachedData - Données en cache
   */
  async _persistPopularData(key, cachedData) {
    try {
      // Vérifier si les données sont déjà en base de données
      const exists = await WeatherCacheModel.exists({ key });
      
      if (!exists) {
        // Extraire les coordonnées de la clé si possible
        const coords = this._extractCoordsFromKey(key);
        
        if (coords) {
          await this._persistToDatabase(
            key, 
            cachedData.data, 
            { 
              lat: coords.lat, 
              lon: coords.lon,
              type: this._extractTypeFromKey(key) || 'current'
            },
            Math.ceil((new Date(cachedData.expiresAt) - new Date()) / 1000)
          );
        }
      }
    } catch (error) {
      logger.error(`Erreur lors de la persistance des données populaires: ${error.message}`);
    }
  }

  /**
   * Calcule un hachage simplifié des données pour détecter les changements
   * @private
   * @param {Object} data - Données à hacher
   * @returns {string} Hachage des données
   */
  _calculateDataHash(data) {
    try {
      // Fonction simplifiée pour générer un hash rapide
      // Dans une implémentation plus robuste, utiliser crypto.createHash
      let hash = 0;
      const str = JSON.stringify(data);
      
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Conversion en 32bit integer
      }
      
      return hash.toString(16);
    } catch (error) {
      logger.error(`Erreur lors du calcul du hash: ${error.message}`);
      return Date.now().toString(16); // Fallback
    }
  }

  /**
   * Extrait les coordonnées de la clé de cache si possible
   * @private
   * @param {string} key - Clé de cache
   * @returns {Object|null} Coordonnées {lat, lon} ou null
   */
  _extractCoordsFromKey(key) {
    // Supposons que les clés contiennent lat et lon sous forme lat_123.45_lon_67.89
    const latMatch = key.match(/lat_([-\d.]+)/);
    const lonMatch = key.match(/lon_([-\d.]+)/);
    
    if (latMatch && lonMatch) {
      return {
        lat: parseFloat(latMatch[1]),
        lon: parseFloat(lonMatch[1])
      };
    }
    
    return null;
  }

  /**
   * Extrait le type de données de la clé de cache si possible
   * @private
   * @param {string} key - Clé de cache
   * @returns {string|null} Type de données ou null
   */
  _extractTypeFromKey(key) {
    const typeMatch = key.match(/^([a-z]+)_/);
    
    if (typeMatch && ['current', 'forecast', 'hourly', 'uv', 'air', 'alert'].includes(typeMatch[1])) {
      return typeMatch[1];
    }
    
    return null;
  }

  /**
   * Nettoie les entrées de cache expirées (utile pour les tests)
   * @returns {Promise<number>} Nombre d'entrées supprimées
   */
  async cleanExpiredEntries() {
    try {
      const result = await WeatherCacheModel.deleteMany({
        expiresAt: { $lt: new Date() }
      });
      
      logger.info(`Nettoyage du cache météo: ${result.deletedCount} entrées supprimées`);
      return result.deletedCount;
    } catch (error) {
      logger.error(`Erreur lors du nettoyage du cache: ${error.message}`);
      return 0;
    }
  }

  /**
   * Supprime toutes les entrées de cache (utile pour les tests)
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async clearAllCache() {
    try {
      // Vider le cache mémoire
      this.memoryCache.flushAll();
      
      // Vider le cache persistant
      await WeatherCacheModel.deleteMany({});
      
      logger.info('Cache météo entièrement vidé');
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la suppression du cache: ${error.message}`);
      return false;
    }
  }
}

// Singleton
const weatherCacheService = new WeatherCacheService();
module.exports = weatherCacheService;
