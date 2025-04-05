/**
 * Service de validation de tokens avec sharding
 * 
 * Ce service implémente un système de sharding pour la validation des tokens JWT,
 * permettant une meilleure distribution de la charge et une scalabilité horizontale.
 * 
 * @module services/token-validation-shard
 */

const jwt = require('jsonwebtoken');
const Redis = require('ioredis');
const crypto = require('crypto');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Classe représentant un shard de validation de tokens
 */
class TokenValidationShard {
  /**
   * Crée une nouvelle instance d'un shard de validation
   * @param {Object} options - Options de configuration
   * @param {number} options.id - Identifiant du shard
   * @param {Object} options.redisOptions - Options de connexion Redis
   * @param {number} options.cacheTTL - Durée de vie du cache en secondes (défaut: 5min)
   * @param {string} options.keyPrefix - Préfixe pour les clés Redis (défaut: 'token:valid:')
   */
  constructor(options = {}) {
    this.id = options.id || 0;
    this.options = {
      redisOptions: options.redisOptions || {
        host: config.redis.host || 'localhost',
        port: config.redis.port || 6379,
        password: config.redis.password,
        db: config.redis.db || 0,
        keyPrefix: `shard:${this.id}:`,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      },
      cacheTTL: options.cacheTTL || 300, // 5 minutes par défaut
      keyPrefix: options.keyPrefix || 'token:valid:',
      jwtSecret: options.jwtSecret || config.jwt.secret,
      jwtOptions: options.jwtOptions || config.jwt.options
    };

    // Connexion Redis pour le cache de validation
    this.redis = new Redis(this.options.redisOptions);

    // Statistiques
    this.stats = {
      validations: 0,
      cacheHits: 0,
      cacheMisses: 0,
      invalidTokens: 0,
      errors: 0
    };

    // Écouter les événements de connexion
    this._setupEventListeners();

    logger.info(`TokenValidationShard #${this.id} initialisé avec cacheTTL=${this.options.cacheTTL}s`);
  }

  /**
   * Configure les écouteurs d'événements pour la connexion Redis
   * @private
   */
  _setupEventListeners() {
    this.redis.on('connect', () => {
      logger.info(`TokenValidationShard #${this.id} connecté au serveur Redis`);
    });

    this.redis.on('error', (err) => {
      logger.error(`Erreur de connexion Redis pour le shard #${this.id}: ${err.message}`, err);
    });

    this.redis.on('reconnecting', (delay) => {
      logger.warn(`Tentative de reconnexion à Redis pour le shard #${this.id} dans ${delay}ms`);
    });
  }

  /**
   * Génère une empreinte unique pour un token
   * @param {string} token - Token JWT
   * @returns {string} Empreinte du token
   * @private
   */
  _generateTokenFingerprint(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Valide un token JWT
   * @param {string} token - Token JWT à valider
   * @param {Object} options - Options de validation
   * @param {boolean} options.useCache - Utiliser le cache Redis (défaut: true)
   * @returns {Promise<Object>} Payload du token si valide
   * @throws {Error} Si le token est invalide
   */
  async validateToken(token, options = {}) {
    const useCache = options.useCache !== false;
    this.stats.validations++;

    try {
      // Vérifier si le token est dans le format attendu
      if (!token || typeof token !== 'string' || !token.includes('.')) {
        this.stats.invalidTokens++;
        throw new Error('Format de token invalide');
      }

      // Générer l'empreinte du token pour le cache
      const tokenFingerprint = this._generateTokenFingerprint(token);
      const cacheKey = this.options.keyPrefix + tokenFingerprint;

      // Vérifier dans le cache si activé
      if (useCache) {
        const cachedResult = await this.redis.get(cacheKey);
        if (cachedResult) {
          this.stats.cacheHits++;
          // Si le token est marqué comme révoqué dans le cache
          if (cachedResult === 'REVOKED') {
            this.stats.invalidTokens++;
            throw new Error('Token révoqué');
          }
          // Sinon, retourner le payload mis en cache
          return JSON.parse(cachedResult);
        }
        this.stats.cacheMisses++;
      }

      // Vérifier si le token est dans la liste de révocation
      const isRevoked = await this._checkRevocationList(token);
      if (isRevoked) {
        // Mettre en cache le résultat de révocation
        if (useCache) {
          await this.redis.set(cacheKey, 'REVOKED', 'EX', this.options.cacheTTL);
        }
        this.stats.invalidTokens++;
        throw new Error('Token révoqué');
      }

      // Valider le token avec jwt.verify
      const payload = jwt.verify(token, this.options.jwtSecret, this.options.jwtOptions);

      // Vérifier les claims supplémentaires si nécessaire
      this._validateAdditionalClaims(payload);

      // Mettre en cache le résultat de validation
      if (useCache) {
        await this.redis.set(cacheKey, JSON.stringify(payload), 'EX', this.options.cacheTTL);
      }

      return payload;
    } catch (err) {
      // Gérer les différents types d'erreurs JWT
      if (err.name === 'JsonWebTokenError') {
        this.stats.invalidTokens++;
        throw new Error(`Token invalide: ${err.message}`);
      } else if (err.name === 'TokenExpiredError') {
        this.stats.invalidTokens++;
        throw new Error('Token expiré');
      } else if (err.name === 'NotBeforeError') {
        this.stats.invalidTokens++;
        throw new Error('Token pas encore valide');
      } else {
        this.stats.errors++;
        throw err;
      }
    }
  }

  /**
   * Vérifie si un token est dans la liste de révocation
   * @param {string} token - Token JWT
   * @returns {Promise<boolean>} true si révoqué, false sinon
   * @private
   */
  async _checkRevocationList(token) {
    try {
      // Décoder le token sans vérification pour obtenir le jti
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.jti) return false;

      // Vérifier si le jti est dans la liste de révocation
      const revocationKey = `revoked:${decoded.jti}`;
      const isRevoked = await this.redis.exists(revocationKey);
      
      return isRevoked === 1;
    } catch (err) {
      logger.error(`Erreur lors de la vérification de révocation: ${err.message}`, err);
      return false;
    }
  }

  /**
   * Valide des claims supplémentaires dans le payload
   * @param {Object} payload - Payload du token
   * @throws {Error} Si la validation échoue
   * @private
   */
  _validateAdditionalClaims(payload) {
    // Vérifier que le payload contient les claims requis
    if (!payload.sub) {
      throw new Error('Token invalide: sub manquant');
    }

    // Vérifier le type de token
    if (payload.type !== 'access' && payload.type !== 'refresh') {
      throw new Error(`Type de token invalide: ${payload.type}`);
    }

    // Vérifier la version du token (pour invalidation globale)
    if (payload.v && config.jwt.minVersion && payload.v < config.jwt.minVersion) {
      throw new Error(`Version de token obsolète: ${payload.v}`);
    }

    // Autres validations spécifiques peuvent être ajoutées ici
  }

  /**
   * Révoque un token spécifique
   * @param {string} token - Token JWT à révoquer
   * @param {Object} options - Options de révocation
   * @param {number} options.expiry - Durée de la révocation en secondes (défaut: durée restante du token)
   * @returns {Promise<boolean>} true si révoqué avec succès
   */
  async revokeToken(token, options = {}) {
    try {
      // Décoder le token sans vérification
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.jti || !decoded.exp) {
        throw new Error('Token invalide ou sans jti/exp');
      }

      // Calculer la durée restante du token
      const now = Math.floor(Date.now() / 1000);
      const remainingTime = Math.max(0, decoded.exp - now);
      
      // Utiliser la durée spécifiée ou la durée restante du token
      const expiry = options.expiry || remainingTime;
      
      if (expiry <= 0) {
        // Le token est déjà expiré, pas besoin de le révoquer
        return true;
      }

      // Ajouter à la liste de révocation avec expiration
      const revocationKey = `revoked:${decoded.jti}`;
      await this.redis.set(revocationKey, '1', 'EX', expiry);

      // Invalider le cache
      const tokenFingerprint = this._generateTokenFingerprint(token);
      const cacheKey = this.options.keyPrefix + tokenFingerprint;
      await this.redis.set(cacheKey, 'REVOKED', 'EX', this.options.cacheTTL);

      logger.info(`Token ${decoded.jti} révoqué pour ${expiry} secondes`);
      return true;
    } catch (err) {
      logger.error(`Erreur lors de la révocation du token: ${err.message}`, err);
      return false;
    }
  }

  /**
   * Révoque tous les tokens d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} options - Options de révocation
   * @param {number} options.expiry - Durée de la révocation en secondes (défaut: 24h)
   * @returns {Promise<boolean>} true si l'opération a réussi
   */
  async revokeAllUserTokens(userId, options = {}) {
    try {
      const expiry = options.expiry || 86400; // 24h par défaut
      
      // Ajouter l'utilisateur à la liste de révocation globale
      const userRevocationKey = `revoked:user:${userId}`;
      const timestamp = Date.now();
      
      await this.redis.set(userRevocationKey, timestamp.toString(), 'EX', expiry);
      
      logger.info(`Tous les tokens de l'utilisateur ${userId} révoqués pour ${expiry} secondes`);
      return true;
    } catch (err) {
      logger.error(`Erreur lors de la révocation des tokens utilisateur: ${err.message}`, err);
      return false;
    }
  }

  /**
   * Récupère les statistiques du shard
   * @returns {Object} Statistiques
   */
  getStats() {
    return {
      shardId: this.id,
      ...this.stats,
      cacheHitRatio: this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses || 1)
    };
  }

  /**
   * Ferme les connexions et nettoie les ressources
   */
  async close() {
    await this.redis.quit();
    logger.info(`TokenValidationShard #${this.id} fermé`);
  }
}

module.exports = TokenValidationShard;
