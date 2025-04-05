/**
 * Gestionnaire de shards pour la validation des tokens
 * 
 * Ce service coordonne plusieurs shards de validation de tokens pour distribuer
 * la charge et améliorer la scalabilité horizontale.
 * 
 * @module services/token-shard-manager
 */

const TokenValidationShard = require('./token-validation-shard.service');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Classe gérant la distribution des validations de tokens sur plusieurs shards
 */
class TokenShardManager {
  /**
   * Crée une nouvelle instance du gestionnaire de shards
   * @param {Object} options - Options de configuration
   * @param {number} options.shardCount - Nombre de shards (défaut: 4)
   * @param {Object} options.shardOptions - Options pour les shards individuels
   * @param {Function} options.hashFunction - Fonction de hachage pour la distribution (défaut: interne)
   */
  constructor(options = {}) {
    this.options = {
      shardCount: options.shardCount || 4,
      shardOptions: options.shardOptions || {},
      hashFunction: options.hashFunction || this._defaultHashFunction.bind(this)
    };

    // Initialiser les shards
    this.shards = new Array(this.options.shardCount).fill(0).map((_, i) => 
      new TokenValidationShard({ 
        id: i, 
        ...this.options.shardOptions 
      })
    );

    // Statistiques globales
    this.stats = {
      validations: 0,
      errors: 0,
      distribution: new Array(this.options.shardCount).fill(0)
    };

    logger.info(`TokenShardManager initialisé avec ${this.options.shardCount} shards`);
  }

  /**
   * Fonction de hachage par défaut pour la distribution
   * @param {string} userId - ID utilisateur
   * @returns {number} Valeur de hachage
   * @private
   */
  _defaultHashFunction(userId) {
    // Simple fonction de hachage pour la distribution
    return userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  }

  /**
   * Décode un token JWT sans validation pour extraire le payload
   * @param {string} token - Token JWT
   * @returns {Object|null} Payload décodé ou null si erreur
   * @private
   */
  _decodeTokenWithoutValidation(token) {
    try {
      if (!token || typeof token !== 'string' || !token.includes('.')) {
        return null;
      }

      const base64Payload = token.split('.')[1];
      if (!base64Payload) return null;

      // Décoder le payload Base64
      const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
      return payload;
    } catch (err) {
      logger.error(`Erreur lors du décodage du token: ${err.message}`, err);
      return null;
    }
  }

  /**
   * Obtient le shard approprié pour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {TokenValidationShard} Instance du shard
   */
  getShard(userId) {
    const hash = this.options.hashFunction(userId);
    const shardIndex = hash % this.options.shardCount;
    
    // Mettre à jour les statistiques de distribution
    this.stats.distribution[shardIndex]++;
    
    return this.shards[shardIndex];
  }

  /**
   * Valide un token JWT
   * @param {string} token - Token JWT à valider
   * @param {Object} options - Options de validation
   * @returns {Promise<Object>} Payload du token si valide
   * @throws {Error} Si le token est invalide
   */
  async validateToken(token, options = {}) {
    this.stats.validations++;

    try {
      // Décoder le token sans validation pour obtenir l'ID utilisateur
      const payload = this._decodeTokenWithoutValidation(token);
      if (!payload || !payload.sub) {
        throw new Error('Format de token invalide ou sub manquant');
      }

      // Obtenir le shard approprié pour cet utilisateur
      const shard = this.getShard(payload.sub);
      
      // Déléguer la validation au shard
      return await shard.validateToken(token, options);
    } catch (err) {
      this.stats.errors++;
      throw err;
    }
  }

  /**
   * Révoque un token spécifique sur tous les shards
   * @param {string} token - Token JWT à révoquer
   * @param {Object} options - Options de révocation
   * @returns {Promise<boolean>} true si révoqué avec succès
   */
  async revokeToken(token, options = {}) {
    try {
      // Décoder le token sans validation
      const payload = this._decodeTokenWithoutValidation(token);
      if (!payload || !payload.sub || !payload.jti) {
        throw new Error('Token invalide ou informations manquantes');
      }

      // Révoquer sur le shard spécifique de l'utilisateur
      const shard = this.getShard(payload.sub);
      const result = await shard.revokeToken(token, options);
      
      return result;
    } catch (err) {
      logger.error(`Erreur lors de la révocation du token: ${err.message}`, err);
      return false;
    }
  }

  /**
   * Révoque tous les tokens d'un utilisateur sur tous les shards
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} options - Options de révocation
   * @returns {Promise<boolean>} true si l'opération a réussi
   */
  async revokeAllUserTokens(userId, options = {}) {
    try {
      // Révoquer sur le shard spécifique de l'utilisateur
      const shard = this.getShard(userId);
      const result = await shard.revokeAllUserTokens(userId, options);
      
      return result;
    } catch (err) {
      logger.error(`Erreur lors de la révocation des tokens utilisateur: ${err.message}`, err);
      return false;
    }
  }

  /**
   * Récupère les statistiques globales et par shard
   * @returns {Object} Statistiques
   */
  getStats() {
    // Récupérer les statistiques de chaque shard
    const shardStats = this.shards.map(shard => shard.getStats());
    
    // Calculer la distribution en pourcentage
    const totalDistribution = this.stats.distribution.reduce((sum, count) => sum + count, 0) || 1;
    const distributionPercentage = this.stats.distribution.map(count => 
      ((count / totalDistribution) * 100).toFixed(2) + '%'
    );

    return {
      global: {
        ...this.stats,
        distributionPercentage
      },
      shards: shardStats
    };
  }

  /**
   * Vérifie la santé de tous les shards
   * @returns {Promise<Object>} État de santé
   */
  async healthCheck() {
    const shardHealth = await Promise.all(
      this.shards.map(async (shard, index) => {
        try {
          // Vérifier la connexion Redis du shard
          const isRedisConnected = shard.redis.status === 'ready';
          
          return {
            shardId: index,
            healthy: isRedisConnected,
            status: isRedisConnected ? 'ready' : 'error',
            lastError: isRedisConnected ? null : 'Redis connection issue'
          };
        } catch (err) {
          return {
            shardId: index,
            healthy: false,
            status: 'error',
            lastError: err.message
          };
        }
      })
    );

    const allHealthy = shardHealth.every(status => status.healthy);

    return {
      healthy: allHealthy,
      timestamp: new Date().toISOString(),
      shards: shardHealth
    };
  }

  /**
   * Ferme tous les shards et nettoie les ressources
   */
  async close() {
    await Promise.all(this.shards.map(shard => shard.close()));
    logger.info('TokenShardManager fermé');
  }
}

module.exports = TokenShardManager;
