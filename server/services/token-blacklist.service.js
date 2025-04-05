/**
 * Service de liste noire de tokens
 * Gère la révocation des tokens JWT pour les déconnexions et les compromissions
 */

const { logger } = require('../utils/logger');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const config = require('../config/api.config');
const NodeCache = require('node-cache');

// Schéma pour stocker les tokens révoqués
const RevokedTokenSchema = new mongoose.Schema({
  jti: { 
    type: String, 
    required: true, 
    unique: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  reason: { 
    type: String, 
    enum: ['logout', 'security', 'expired', 'rotation', 'version_mismatch'], 
    default: 'logout' 
  },
  expiresAt: { 
    type: Date, 
    required: true,
    index: { expires: 0 } // TTL index pour supprimer automatiquement les tokens expirés
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    index: true // Index pour les requêtes de statistiques
  },
  fingerprint: {
    type: String,
    sparse: true // Index clairsemé pour les empreintes
  }
});

// Ajouter des index composites pour améliorer les performances des requêtes fréquentes
RevokedTokenSchema.index({ userId: 1, createdAt: -1 });
RevokedTokenSchema.index({ reason: 1, createdAt: -1 });

// Modèle pour les tokens révoqués
const RevokedToken = mongoose.model('RevokedToken', RevokedTokenSchema);

class TokenBlacklistService {
  constructor() {
    // Cache en mémoire pour les vérifications rapides avec TTL automatique
    this.cache = new NodeCache({ 
      stdTTL: 3600, // 1 heure par défaut
      checkperiod: 600, // Vérification toutes les 10 minutes
      useClones: false // Pour économiser de la mémoire
    });
    
    // Cache secondaire pour les tokens fréquemment vérifiés
    this.hotCache = new Set();
    this.hotCacheMaxSize = 1000; // Limiter la taille du cache "chaud"
    
    // File d'attente pour les opérations d'écriture
    this.writeQueue = [];
    this.isProcessingQueue = false;
    
    // Statistiques
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      dbQueries: 0,
      revokedTokens: 0,
      lastCleanup: Date.now()
    };
    
    // Démarrer le nettoyage périodique
    this.startCacheCleanup();
    
    // Démarrer le traitement périodique de la file d'attente
    this.startQueueProcessing();
    
    logger.info('Service de liste noire de tokens initialisé avec cache optimisé');
  }

  /**
   * Ajoute un token à la liste noire
   * @param {string} token - Token JWT à révoquer
   * @param {string} reason - Raison de la révocation
   * @param {string} userId - ID de l'utilisateur (optionnel)
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async revokeToken(token, reason = 'logout', userId = null) {
    try {
      // Décoder le token sans vérifier la signature
      const decoded = jwt.decode(token);
      
      if (!decoded || !decoded.exp) {
        logger.warn('Tentative de révocation d\'un token invalide');
        return false;
      }
      
      // Utiliser l'ID du token ou en générer un basé sur le token
      const jti = decoded.jti || this.generateJtiFromToken(token);
      
      // Calculer la date d'expiration
      const expiresAt = new Date(decoded.exp * 1000);
      
      // Extraire l'empreinte du client si présente
      const fingerprint = decoded.fingerprint || null;
      
      // Extraire l'ID utilisateur du token si non fourni
      const tokenUserId = decoded.userId || decoded.sub || null;
      const finalUserId = userId || tokenUserId;
      
      // Ajouter au cache immédiatement
      this.cache.set(jti, {
        expiresAt,
        reason,
        userId: finalUserId,
        fingerprint
      });
      
      // Ajouter au cache "chaud" pour les vérifications fréquentes
      this.hotCache.add(jti);
      
      // Limiter la taille du cache "chaud"
      if (this.hotCache.size > this.hotCacheMaxSize) {
        // Supprimer le premier élément (le plus ancien)
        const firstItem = Array.from(this.hotCache)[0];
        this.hotCache.delete(firstItem);
      }
      
      // Ajouter à la file d'attente pour l'écriture en base de données
      this.enqueueWrite({
        operation: 'revokeToken',
        data: {
          jti,
          userId: finalUserId,
          reason,
          expiresAt,
          fingerprint
        }
      });
      
      // Mettre à jour les statistiques
      this.stats.revokedTokens++;
      
      logger.info(`Token révoqué avec succès: ${jti.substring(0, 8)}... (raison: ${reason})`);
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la révocation du token: ${error.message}`);
      return false;
    }
  }

  /**
   * Vérifie si un token est dans la liste noire
   * @param {string} token - Token JWT à vérifier
   * @returns {Promise<boolean>} - True si le token est révoqué
   */
  async isTokenRevoked(token) {
    try {
      // Décoder le token sans vérifier la signature
      const decoded = jwt.decode(token);
      
      if (!decoded) {
        // Si le token ne peut pas être décodé, le considérer comme révoqué par sécurité
        return true;
      }
      
      // Utiliser l'ID du token ou en générer un basé sur le token
      const jti = decoded.jti || this.generateJtiFromToken(token);
      
      // Vérifier d'abord dans le cache "chaud" (très rapide)
      if (this.hotCache.has(jti)) {
        this.stats.cacheHits++;
        return true;
      }
      
      // Vérifier ensuite dans le cache principal
      if (this.cache.has(jti)) {
        // Ajouter au cache "chaud" pour les futures vérifications
        this.hotCache.add(jti);
        
        // Limiter la taille du cache "chaud"
        if (this.hotCache.size > this.hotCacheMaxSize) {
          const firstItem = Array.from(this.hotCache)[0];
          this.hotCache.delete(firstItem);
        }
        
        this.stats.cacheHits++;
        return true;
      }
      
      // Vérifier dans la base de données
      this.stats.dbQueries++;
      const revokedToken = await RevokedToken.findOne({ jti });
      
      // Si trouvé, ajouter aux caches pour les futures vérifications
      if (revokedToken) {
        this.cache.set(jti, {
          expiresAt: revokedToken.expiresAt,
          reason: revokedToken.reason,
          userId: revokedToken.userId,
          fingerprint: revokedToken.fingerprint
        });
        
        this.hotCache.add(jti);
        
        // Limiter la taille du cache "chaud"
        if (this.hotCache.size > this.hotCacheMaxSize) {
          const firstItem = Array.from(this.hotCache)[0];
          this.hotCache.delete(firstItem);
        }
        
        this.stats.cacheMisses++;
        return true;
      }
      
      this.stats.cacheMisses++;
      return false;
    } catch (error) {
      logger.error(`Erreur lors de la vérification du token: ${error.message}`);
      // En cas d'erreur, considérer le token comme valide
      return false;
    }
  }

  /**
   * Révoque tous les tokens d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} reason - Raison de la révocation
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async revokeAllUserTokens(userId, reason = 'security') {
    try {
      // Ajouter à la file d'attente pour l'écriture en base de données
      this.enqueueWrite({
        operation: 'revokeAllUserTokens',
        data: {
          userId,
          reason
        }
      });
      
      // Trouver tous les tokens de l'utilisateur dans le cache
      const userTokensInCache = [];
      this.cache.keys().forEach(jti => {
        const entry = this.cache.get(jti);
        if (entry && entry.userId && entry.userId.toString() === userId.toString()) {
          userTokensInCache.push(jti);
          entry.reason = reason;
        }
      });
      
      // Mettre à jour le cache "chaud"
      userTokensInCache.forEach(jti => {
        this.hotCache.add(jti);
      });
      
      logger.info(`Tous les tokens de l'utilisateur ${userId} ont été révoqués (raison: ${reason})`);
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la révocation des tokens de l'utilisateur: ${error.message}`);
      return false;
    }
  }

  /**
   * Génère un identifiant unique pour un token
   * @param {string} token - Token JWT
   * @returns {string} - Identifiant unique
   * @private
   */
  generateJtiFromToken(token) {
    // Utiliser les 64 premiers caractères du token comme identifiant
    // C'est suffisamment unique pour notre cas d'utilisation
    return token.substring(0, 64);
  }

  /**
   * Ajoute une opération à la file d'attente d'écriture
   * @param {Object} operation - Opération à effectuer
   * @private
   */
  enqueueWrite(operation) {
    this.writeQueue.push(operation);
    
    // Démarrer le traitement de la file d'attente si ce n'est pas déjà en cours
    if (!this.isProcessingQueue) {
      this.processWriteQueue();
    }
  }

  /**
   * Traite la file d'attente d'écriture
   * @private
   */
  async processWriteQueue() {
    if (this.isProcessingQueue || this.writeQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    try {
      // Traiter les opérations par lots pour améliorer les performances
      const batchSize = 10;
      const batch = this.writeQueue.splice(0, batchSize);
      
      for (const operation of batch) {
        try {
          if (operation.operation === 'revokeToken') {
            await RevokedToken.create({
              jti: operation.data.jti,
              userId: operation.data.userId,
              reason: operation.data.reason,
              expiresAt: operation.data.expiresAt,
              fingerprint: operation.data.fingerprint
            });
          } else if (operation.operation === 'revokeAllUserTokens') {
            // Mettre à jour la raison pour les tokens existants
            await RevokedToken.updateMany(
              { userId: operation.data.userId },
              { $set: { reason: operation.data.reason } }
            );
          }
        } catch (error) {
          logger.error(`Erreur lors du traitement de l'opération ${operation.operation}: ${error.message}`);
        }
      }
    } finally {
      this.isProcessingQueue = false;
      
      // S'il reste des opérations à traiter, continuer
      if (this.writeQueue.length > 0) {
        setImmediate(() => this.processWriteQueue());
      }
    }
  }

  /**
   * Démarre le traitement périodique de la file d'attente
   * @private
   */
  startQueueProcessing() {
    // Traiter la file d'attente toutes les 5 secondes, même si aucune nouvelle opération n'est ajoutée
    this.queueInterval = setInterval(() => {
      if (this.writeQueue.length > 0) {
        this.processWriteQueue();
      }
    }, 5000);
    
    // S'assurer que l'intervalle ne bloque pas la fermeture du processus
    this.queueInterval.unref();
  }

  /**
   * Nettoie le cache en mémoire des tokens expirés
   * @private
   */
  cleanupCache() {
    const now = new Date();
    let expiredCount = 0;
    
    // Nettoyer le cache principal (NodeCache gère automatiquement l'expiration)
    
    // Nettoyer le cache "chaud"
    for (const jti of this.hotCache) {
      const entry = this.cache.get(jti);
      if (!entry || entry.expiresAt <= now) {
        this.hotCache.delete(jti);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      logger.debug(`Nettoyage du cache: ${expiredCount} tokens expirés supprimés du cache chaud`);
    }
    
    // Mettre à jour les statistiques
    this.stats.lastCleanup = Date.now();
  }

  /**
   * Démarre le nettoyage périodique du cache
   * @private
   */
  startCacheCleanup() {
    // Nettoyer le cache toutes les 15 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupCache();
    }, 15 * 60 * 1000);
    
    // S'assurer que l'intervalle ne bloque pas la fermeture du processus
    this.cleanupInterval.unref();
  }

  /**
   * Arrête le nettoyage périodique du cache
   */
  stopCacheCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    if (this.queueInterval) {
      clearInterval(this.queueInterval);
      this.queueInterval = null;
    }
  }

  /**
   * Obtient des statistiques sur les tokens révoqués
   * @returns {Promise<Object>} - Statistiques
   */
  async getStats() {
    try {
      const totalRevoked = await RevokedToken.countDocuments();
      const byReason = await RevokedToken.aggregate([
        { $group: { _id: '$reason', count: { $sum: 1 } } }
      ]);
      
      const reasonStats = {};
      byReason.forEach(item => {
        reasonStats[item._id] = item.count;
      });
      
      // Calculer les statistiques de performance
      const cacheHitRate = this.stats.cacheHits + this.stats.cacheMisses > 0
        ? (this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100).toFixed(2)
        : 0;
      
      return {
        totalRevoked,
        byReason: reasonStats,
        cacheSize: this.cache.stats.keys,
        hotCacheSize: this.hotCache.size,
        queueSize: this.writeQueue.length,
        performance: {
          cacheHits: this.stats.cacheHits,
          cacheMisses: this.stats.cacheMisses,
          cacheHitRate: `${cacheHitRate}%`,
          dbQueries: this.stats.dbQueries,
          lastCleanup: new Date(this.stats.lastCleanup).toISOString()
        }
      };
    } catch (error) {
      logger.error(`Erreur lors de la récupération des statistiques: ${error.message}`);
      return {
        totalRevoked: 0,
        byReason: {},
        cacheSize: this.cache.stats.keys,
        hotCacheSize: this.hotCache.size,
        queueSize: this.writeQueue.length,
        error: error.message
      };
    }
  }
}

// Exporter une instance singleton
const tokenBlacklistService = new TokenBlacklistService();
module.exports = tokenBlacklistService;
