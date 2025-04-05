/**
 * Service de gestion des sessions Redis
 * 
 * Ce service implémente un système de stockage des sessions utilisateur dans Redis,
 * permettant une scalabilité horizontale et une meilleure gestion de la mémoire.
 * 
 * @module services/redis-session
 */

const Redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Classe gérant le stockage des sessions dans Redis
 */
class RedisSessionStore {
  /**
   * Crée une nouvelle instance du gestionnaire de sessions Redis
   * @param {Object} options - Options de configuration
   * @param {Object} options.redisOptions - Options de connexion Redis
   * @param {string} options.prefix - Préfixe pour les clés Redis (défaut: 'session:')
   * @param {number} options.ttl - Durée de vie des sessions en secondes (défaut: 24h)
   * @param {number} options.idleTimeout - Durée d'inactivité avant expiration (défaut: 2h)
   */
  constructor(options = {}) {
    this.options = {
      redisOptions: options.redisOptions || {
        host: config.redis.host || 'localhost',
        port: config.redis.port || 6379,
        password: config.redis.password,
        db: config.redis.db || 0,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      },
      prefix: options.prefix || 'session:',
      ttl: options.ttl || 86400, // 24 heures par défaut
      idleTimeout: options.idleTimeout || 7200, // 2 heures d'inactivité par défaut
      scanCount: options.scanCount || 100,
      cleanupInterval: options.cleanupInterval || 300, // 5 minutes
    };

    // Connexion principale pour les opérations de lecture/écriture
    this.redis = new Redis(this.options.redisOptions);
    
    // Connexion secondaire pour les opérations de maintenance (pour éviter de bloquer les opérations principales)
    this.maintenanceRedis = new Redis(this.options.redisOptions);

    // Statistiques
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      expirations: 0
    };

    // Démarrer le nettoyage périodique si activé
    if (this.options.cleanupInterval > 0) {
      this._startPeriodicCleanup();
    }

    // Écouter les événements de connexion
    this._setupEventListeners();

    logger.info(`RedisSessionStore initialisé avec TTL=${this.options.ttl}s, IdleTimeout=${this.options.idleTimeout}s`);
  }

  /**
   * Configure les écouteurs d'événements pour la connexion Redis
   * @private
   */
  _setupEventListeners() {
    this.redis.on('connect', () => {
      logger.info('RedisSessionStore connecté au serveur Redis');
    });

    this.redis.on('error', (err) => {
      logger.error(`Erreur de connexion Redis: ${err.message}`, err);
    });

    this.redis.on('reconnecting', (delay) => {
      logger.warn(`Tentative de reconnexion à Redis dans ${delay}ms`);
    });
  }

  /**
   * Démarre le processus de nettoyage périodique des sessions expirées
   * @private
   */
  _startPeriodicCleanup() {
    this.cleanupInterval = setInterval(() => {
      this._cleanupExpiredSessions()
        .catch(err => logger.error(`Erreur lors du nettoyage des sessions: ${err.message}`, err));
    }, this.options.cleanupInterval * 1000);

    // S'assurer que l'intervalle ne bloque pas la fin du processus
    this.cleanupInterval.unref();
    
    logger.debug(`Nettoyage périodique des sessions configuré (intervalle: ${this.options.cleanupInterval}s)`);
  }

  /**
   * Nettoie les sessions expirées basées sur le time-to-idle
   * @private
   * @returns {Promise<number>} Nombre de sessions nettoyées
   */
  async _cleanupExpiredSessions() {
    const now = Date.now();
    let cursor = '0';
    let cleanedCount = 0;
    
    do {
      // Utiliser SCAN pour itérer sur les clés sans bloquer Redis
      const [nextCursor, keys] = await this.maintenanceRedis.scan(
        cursor, 
        'MATCH', 
        `${this.options.prefix}*`, 
        'COUNT', 
        this.options.scanCount
      );
      
      cursor = nextCursor;
      
      if (keys.length === 0) continue;
      
      // Pour chaque clé, vérifier le lastAccess
      for (const key of keys) {
        try {
          const data = await this.maintenanceRedis.get(key);
          if (!data) continue;
          
          const session = JSON.parse(data);
          
          // Vérifier si la session est inactive depuis trop longtemps
          if (session.lastAccess && (now - session.lastAccess > this.options.idleTimeout * 1000)) {
            await this.maintenanceRedis.del(key);
            cleanedCount++;
            this.stats.expirations++;
          }
        } catch (err) {
          logger.error(`Erreur lors du traitement de la clé ${key}: ${err.message}`);
        }
      }
      
    } while (cursor !== '0');
    
    if (cleanedCount > 0) {
      logger.info(`Nettoyage des sessions: ${cleanedCount} sessions inactives supprimées`);
    }
    
    return cleanedCount;
  }

  /**
   * Crée ou met à jour une session
   * @param {Object} session - Données de session à stocker
   * @param {string} [session.id] - ID de session (généré si non fourni)
   * @returns {Promise<string>} ID de la session
   */
  async set(session) {
    const id = session.id || uuidv4();
    const key = this.options.prefix + id;
    
    // S'assurer que lastAccess est à jour
    const sessionData = {
      ...session,
      id,
      lastAccess: Date.now()
    };
    
    const serialized = JSON.stringify(sessionData);
    
    // Stocker avec TTL
    await this.redis.set(key, serialized, 'EX', this.options.ttl);
    
    this.stats.sets++;
    
    return id;
  }

  /**
   * Récupère une session par son ID
   * @param {string} id - ID de la session
   * @returns {Promise<Object|null>} Données de session ou null si non trouvée
   */
  async get(id) {
    const key = this.options.prefix + id;
    const data = await this.redis.get(key);
    
    if (!data) {
      this.stats.misses++;
      return null;
    }
    
    try {
      const session = JSON.parse(data);
      
      // Mettre à jour lastAccess et prolonger TTL
      session.lastAccess = Date.now();
      await this.redis.set(key, JSON.stringify(session), 'EX', this.options.ttl);
      
      this.stats.hits++;
      return session;
    } catch (err) {
      logger.error(`Erreur lors du parsing de la session ${id}: ${err.message}`, err);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Supprime une session
   * @param {string} id - ID de la session à supprimer
   * @returns {Promise<boolean>} true si supprimée, false sinon
   */
  async delete(id) {
    const key = this.options.prefix + id;
    const result = await this.redis.del(key);
    
    if (result > 0) {
      this.stats.deletes++;
      return true;
    }
    
    return false;
  }

  /**
   * Met à jour le TTL d'une session
   * @param {string} id - ID de la session
   * @returns {Promise<boolean>} true si mise à jour, false sinon
   */
  async touch(id) {
    const key = this.options.prefix + id;
    
    // Vérifier si la clé existe
    const exists = await this.redis.exists(key);
    if (exists === 0) return false;
    
    // Récupérer la session pour mettre à jour lastAccess
    const data = await this.redis.get(key);
    if (!data) return false;
    
    try {
      const session = JSON.parse(data);
      session.lastAccess = Date.now();
      
      // Mettre à jour la session avec le nouveau TTL
      await this.redis.set(key, JSON.stringify(session), 'EX', this.options.ttl);
      return true;
    } catch (err) {
      logger.error(`Erreur lors du touch de la session ${id}: ${err.message}`, err);
      return false;
    }
  }

  /**
   * Récupère toutes les sessions correspondant à un filtre
   * @param {Function} filterFn - Fonction de filtre (session) => boolean
   * @returns {Promise<Array<Object>>} Sessions correspondant au filtre
   */
  async findSessions(filterFn) {
    const sessions = [];
    let cursor = '0';
    
    do {
      const [nextCursor, keys] = await this.redis.scan(
        cursor, 
        'MATCH', 
        `${this.options.prefix}*`, 
        'COUNT', 
        this.options.scanCount
      );
      
      cursor = nextCursor;
      
      if (keys.length === 0) continue;
      
      // Récupérer les données pour chaque clé
      for (const key of keys) {
        try {
          const data = await this.redis.get(key);
          if (!data) continue;
          
          const session = JSON.parse(data);
          
          // Appliquer le filtre
          if (filterFn(session)) {
            sessions.push(session);
          }
        } catch (err) {
          logger.error(`Erreur lors du traitement de la clé ${key}: ${err.message}`);
        }
      }
      
    } while (cursor !== '0');
    
    return sessions;
  }

  /**
   * Récupère les statistiques d'utilisation
   * @returns {Object} Statistiques
   */
  getStats() {
    return {
      ...this.stats,
      hitRatio: this.stats.hits / (this.stats.hits + this.stats.misses || 1)
    };
  }

  /**
   * Ferme les connexions Redis et nettoie les ressources
   */
  async close() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    await this.redis.quit();
    await this.maintenanceRedis.quit();
    
    logger.info('RedisSessionStore fermé');
  }
}

module.exports = RedisSessionStore;
