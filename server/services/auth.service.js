/**
 * Service d'authentification centralisé
 * Responsable de la gestion des tokens JWT et des sessions utilisateur
 */

const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { logger } = require('../utils/logger');
const config = require('../config/api.config');
const errorService = require('./error.service');
const tokenBlacklist = require('./token-blacklist.service');
const crypto = require('crypto');
const os = require('os');
const EnhancedJwtRotation = require('../utils/enhanced-jwt-rotation');

// Remplacer l'importation du service de notification par une importation différée
// pour éviter les dépendances circulaires
let notificationService = null;

// Fonction pour initialiser le service de notification de manière différée
const initNotificationService = () => {
  if (!notificationService) {
    try {
      notificationService = require('./notification.service');
      logger.debug('Service de notification chargé avec succès dans AuthService');
    } catch (error) {
      logger.warn(`Impossible de charger le service de notification: ${error.message}`);
      // Créer un service de notification factice si le chargement échoue
      notificationService = {
        sendSecurityNotification: async () => {
          logger.warn('Utilisation du service de notification factice');
          return true;
        }
      };
    }
  }
  return notificationService;
};

class RequestQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  async add(callback) {
    return new Promise((resolve, reject) => {
      this.queue.push({ callback, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    const { callback, resolve, reject } = this.queue.shift();
    
    try {
      const result = await callback();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.isProcessing = false;
      this.process(); // Process next request in queue
    }
  }
}

class AuthService {
  constructor() {
    this.tokenSecret = config.auth?.tokenSecret || process.env.JWT_SECRET || 'default_secret_key_change_in_production';
    this.tokenExpiration = config.auth?.tokenExpiration || '1h';
    this.refreshTokenExpiration = config.auth?.refreshTokenExpiration || '7d';
    
    // Initialiser le système de rotation avancé des tokens JWT
    this.jwtRotation = new EnhancedJwtRotation({
      minRotationInterval: config.auth?.keyRotation?.interval || 24 * 60 * 60 * 1000, // 24 heures par défaut
      gracePeriod: config.auth?.gracePeriod || 30 * 60 * 1000, // 30 minutes par défaut
      logger
    });
    
    // Configurer les événements de rotation
    this.jwtRotation.on('keysRotated', (data) => {
      logger.info(`Rotation des clés JWT effectuée: ${data.previousKeyId} -> ${data.newKeyId}`);
    });
    
    this.jwtRotation.on('tokenRevoked', (data) => {
      logger.info(`Token révoqué pour l'utilisateur ${data.userId}: ${data.reason}`);
    });
    
    // Stockage des empreintes de clients pour la détection d'utilisation suspecte
    this.clientFingerprints = new Map();
    
    // Cache des tokens validés pour améliorer les performances
    this.tokenValidationCache = new Map();
    
    // Métriques pour le suivi des performances et de la sécurité
    this.metrics = {
      tokensGenerated: 0,
      tokensVerified: 0,
      tokensRejected: 0,
      refreshTokensUsed: 0,
      suspiciousActivities: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    
    // Configurer le nettoyage périodique du cache
    setInterval(() => this._cleanupTokenCache(), 15 * 60 * 1000); // Toutes les 15 minutes
    
    logger.info('Service d\'authentification initialisé avec rotation JWT améliorée');
  }
  
  /**
   * Nettoie le cache de validation des tokens
   * @private
   */
  _cleanupTokenCache() {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [tokenHash, cacheEntry] of this.tokenValidationCache.entries()) {
      if (cacheEntry.expiresAt < now) {
        this.tokenValidationCache.delete(tokenHash);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      logger.debug(`Cache de validation des tokens nettoyé: ${expiredCount} entrées supprimées`);
    }
  }
  
  /**
   * Calcule un hash pour un token
   * @param {string} token Token à hacher
   * @returns {string} Hash du token
   * @private
   */
  _hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Génère une empreinte unique pour le client
   * @param {Object} req Requête Express
   * @returns {string} Empreinte du client
   */
  generateClientFingerprint(req) {
    if (!req) return null;
    
    // Collecter les informations du client
    const userAgent = req.headers['user-agent'] || '';
    const acceptLanguage = req.headers['accept-language'] || '';
    
    // Utiliser uniquement les informations essentielles pour réduire les faux positifs
    // Suppression de la dépendance à l'adresse IP pour éviter les problèmes avec les réseaux mobiles
    const fingerprintData = {
      userAgent: userAgent.split(' ').slice(0, 2).join(' '), // Utiliser uniquement les parties principales de l'user-agent
      language: acceptLanguage.split(',')[0], // Utiliser uniquement la langue principale
      // Suppression de l'adresse IP qui change fréquemment pour les utilisateurs mobiles
    };
    
    // Créer une empreinte moins stricte
    const fingerprint = crypto
      .createHash('sha256')
      .update(JSON.stringify(fingerprintData))
      .digest('hex');
    
    return fingerprint;
  }
  
  /**
   * Vérifie si l'activité de l'utilisateur est suspecte
   * @param {string} userId ID de l'utilisateur
   * @param {string} fingerprint Empreinte du client
   * @returns {boolean} True si l'activité est suspecte
   */
  isSuspiciousActivity(userId, fingerprint) {
    if (!userId || !fingerprint) return false;
    
    // Récupérer les empreintes connues pour cet utilisateur
    const userFingerprints = this.clientFingerprints.get(userId) || [];
    
    // Si l'utilisateur n'a pas d'empreintes enregistrées, enregistrer celle-ci
    if (userFingerprints.length === 0) {
      this.clientFingerprints.set(userId, [{ 
        fingerprint, 
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        count: 1
      }]);
      return false;
    }
    
    // Vérifier si l'empreinte est connue
    const knownFingerprint = userFingerprints.find(f => f.fingerprint === fingerprint);
    
    if (knownFingerprint) {
      // Mettre à jour les statistiques de l'empreinte
      knownFingerprint.lastSeen = Date.now();
      knownFingerprint.count += 1;
      return false;
    }
    
    // Nouvelle empreinte pour cet utilisateur
    
    // Augmenter le seuil à 5 empreintes différentes avant de considérer l'activité comme suspecte
    // Cela permet aux utilisateurs d'utiliser plusieurs appareils sans déclencher d'alertes
    const maxFingerprintsBeforeSuspicious = 5;
    
    // Si l'utilisateur a déjà trop d'empreintes différentes, c'est suspect
    if (userFingerprints.length >= maxFingerprintsBeforeSuspicious) {
      this.metrics.suspiciousActivities++;
      
      // Nettoyer les anciennes empreintes (plus de 30 jours)
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const updatedFingerprints = userFingerprints
        .filter(f => f.lastSeen > thirtyDaysAgo)
        .sort((a, b) => b.count - a.count) // Trier par nombre d'utilisations
        .slice(0, maxFingerprintsBeforeSuspicious - 1); // Garder les plus utilisées
      
      // Ajouter la nouvelle empreinte
      updatedFingerprints.push({
        fingerprint,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        count: 1
      });
      
      this.clientFingerprints.set(userId, updatedFingerprints);
      
      // Activité suspecte mais on autorise quand même l'accès
      // On se contente de notifier pour surveillance
      this.notifySuspiciousActivity(userId, fingerprint);
      return false; // Changé de true à false pour être moins restrictif
    }
    
    // Ajouter la nouvelle empreinte à la liste
    userFingerprints.push({
      fingerprint,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      count: 1
    });
    
    this.clientFingerprints.set(userId, userFingerprints);
    return false;
  }

  /**
   * Notifie d'une activité suspecte
   * @param {string} userId ID de l'utilisateur
   * @param {string} fingerprint Empreinte du client
   */
  async notifySuspiciousActivity(userId, fingerprint) {
    try {
      logger.warn(`Activité suspecte détectée pour l'utilisateur ${userId}`);
      
      // Utiliser le service de notification si disponible
      const notificationService = initNotificationService();
      if (notificationService) {
        await notificationService.sendSecurityNotification(
          userId,
          'Activité de connexion suspecte détectée',
          'Une connexion depuis un nouvel appareil ou emplacement a été détectée. Si ce n\'était pas vous, veuillez changer votre mot de passe immédiatement.'
        );
      }
    } catch (error) {
      logger.error(`Erreur lors de la notification d'activité suspecte: ${error.message}`);
    }
  }
  
  /**
   * Génère un token JWT pour un utilisateur
   * @param {Object} user Données utilisateur à encoder dans le token
   * @param {Object} req Requête Express pour l'empreinte client
   * @returns {Object} Tokens d'accès et de rafraîchissement
   */
  async generateTokens(user, req = null) {
    try {
      // Générer une empreinte client si la requête est fournie
      const fingerprint = req ? this.generateClientFingerprint(req) : null;
      
      // Préparer les données utilisateur pour le token
      const userData = {
        id: user.id || user._id,
        email: user.email,
        role: user.role || 'user',
        fingerprint
      };
      
      // Générer le token d'accès avec le système de rotation amélioré
      const accessTokenData = this.jwtRotation.sign(
        { ...userData, type: 'access' },
        { expiresIn: this.tokenExpiration }
      );
      
      // Générer le token de rafraîchissement avec le système de rotation amélioré
      const refreshTokenData = this.jwtRotation.sign(
        { ...userData, type: 'refresh' },
        { expiresIn: this.refreshTokenExpiration }
      );
      
      // Mettre à jour les métriques
      this.metrics.tokensGenerated++;
      
      // Ajouter les tokens au cache de validation
      const accessTokenHash = this._hashToken(accessTokenData.token);
      this.tokenValidationCache.set(accessTokenHash, {
        payload: { ...userData, type: 'access' },
        expiresAt: accessTokenData.expiresAt,
        lastUsed: Date.now()
      });
      
      logger.info(`Tokens générés pour l'utilisateur: ${userData.id}`);
      
      return {
        accessToken: accessTokenData.token,
        refreshToken: refreshTokenData.token,
        expiresIn: Math.floor((accessTokenData.expiresAt - Date.now()) / 1000),
        tokenType: 'Bearer'
      };
    } catch (error) {
      const tokenError = errorService.createError(
        errorService.ERROR_TYPES.AUTHENTICATION,
        'Erreur lors de la génération des tokens',
        {
          userId: user.id || user._id,
          originalError: error.message
        },
        error,
        errorService.SEVERITY_LEVELS.ERROR
      );
      
      logger.error(`Erreur lors de la génération des tokens: ${error.message}`);
      throw tokenError;
    }
  }
  
  /**
   * Vérifie la validité d'un token JWT
   * @param {string} token Token JWT à vérifier
   * @param {Object} req Requête Express pour la vérification de l'empreinte
   * @returns {Object|null} Données du token décodé ou null si invalide
   */
  async verifyToken(token, req = null) {
    try {
      if (!token) {
        throw new Error('Token manquant');
      }
      
      // Vérifier le cache de validation pour améliorer les performances
      const tokenHash = this._hashToken(token);
      const cachedValidation = this.tokenValidationCache.get(tokenHash);
      
      if (cachedValidation) {
        // Vérifier si le cache est encore valide
        if (cachedValidation.expiresAt > Date.now()) {
          // Mettre à jour la date de dernière utilisation
          cachedValidation.lastUsed = Date.now();
          
          // Incrémenter le compteur de hits du cache
          this.metrics.cacheHits++;
          
          // Vérifier l'empreinte client si fournie
          if (req && cachedValidation.payload.fingerprint) {
            const currentFingerprint = this.generateClientFingerprint(req);
            
            // Vérification moins stricte de l'empreinte
            const fingerprintPrefix = currentFingerprint.substring(0, 16);
            const tokenFingerprintPrefix = cachedValidation.payload.fingerprint.substring(0, 16);
            
            if (fingerprintPrefix !== tokenFingerprintPrefix) {
              // Empreinte différente, vérifier si c'est une activité suspecte
              const isSuspicious = this.isSuspiciousActivity(cachedValidation.payload.id, currentFingerprint);
              
              if (isSuspicious) {
                this.metrics.tokensRejected++;
                throw new Error('Empreinte client invalide');
              }
              
              // Mettre à jour l'empreinte dans le cache
              cachedValidation.payload.fingerprint = currentFingerprint;
            }
          }
          
          return cachedValidation.payload;
        } else {
          // Supprimer l'entrée expirée du cache
          this.tokenValidationCache.delete(tokenHash);
        }
      }
      
      // Incrémenter le compteur de miss du cache
      this.metrics.cacheMisses++;
      
      // Vérifier si le token est dans la liste noire
      const isBlacklisted = await tokenBlacklist.isRevoked(token);
      if (isBlacklisted) {
        throw new Error('Token révoqué');
      }
      
      // Utiliser le système de rotation amélioré pour vérifier le token
      const payload = this.jwtRotation.verify(token);
      
      // Si le token est dans la période de grâce, générer un avertissement
      if (payload.gracePeriod) {
        logger.warn(`Token dans la période de grâce pour l'utilisateur: ${payload.id}`);
      }
      
      // Vérifier l'empreinte client si fournie et si l'empreinte est dans le token
      if (req && payload.fingerprint) {
        const currentFingerprint = this.generateClientFingerprint(req);
        
        // Vérification moins stricte de l'empreinte
        const fingerprintPrefix = currentFingerprint.substring(0, 16);
        const tokenFingerprintPrefix = payload.fingerprint.substring(0, 16);
        
        if (fingerprintPrefix !== tokenFingerprintPrefix) {
          // Empreinte différente, vérifier si c'est une activité suspecte
          const isSuspicious = this.isSuspiciousActivity(payload.id, currentFingerprint);
          
          if (isSuspicious) {
            this.metrics.tokensRejected++;
            throw new Error('Empreinte client invalide');
          }
          
          // Mettre à jour l'empreinte dans le payload
          payload.fingerprint = currentFingerprint;
        }
      }
      
      // Ajouter le token au cache de validation
      this.tokenValidationCache.set(tokenHash, {
        payload,
        expiresAt: payload.exp * 1000,
        lastUsed: Date.now()
      });
      
      this.metrics.tokensVerified++;
      return payload;
    } catch (error) {
      this.metrics.tokensRejected++;
      
      const verifyError = errorService.createError(
        errorService.ERROR_TYPES.AUTHENTICATION,
        'Échec de la vérification du token',
        {
          originalError: error.message
        },
        error,
        errorService.SEVERITY_LEVELS.WARNING
      );
      
      logger.warn(`Vérification de token échouée: ${error.message}`);
      throw verifyError;
    }
  }
  
  /**
   * Rafraîchit un token expiré en utilisant le token de rafraîchissement
   * @param {string} refreshToken Token de rafraîchissement
   * @param {Object} req Requête Express pour la vérification de l'empreinte
   * @returns {Promise<Object>} Nouveaux tokens
   */
  async refreshAccessToken(refreshToken, req = null) {
    try {
      if (!refreshToken) {
        throw new Error('Token de rafraîchissement manquant');
      }
      
      // Vérifier si le token est dans la liste noire
      const isBlacklisted = await tokenBlacklist.isRevoked(refreshToken);
      if (isBlacklisted) {
        throw new Error('Token de rafraîchissement révoqué');
      }
      
      // Utiliser le système de rotation amélioré pour vérifier le token
      const payload = this.jwtRotation.verify(refreshToken);
      
      // Vérifier que c'est bien un token de rafraîchissement
      if (payload.type !== 'refresh') {
        throw new Error('Type de token invalide');
      }
      
      // Vérifier l'empreinte client si fournie et si l'empreinte est dans le token
      if (req && payload.fingerprint) {
        const currentFingerprint = this.generateClientFingerprint(req);
        
        // Vérification moins stricte de l'empreinte
        const fingerprintPrefix = currentFingerprint.substring(0, 16);
        const tokenFingerprintPrefix = payload.fingerprint.substring(0, 16);
        
        if (fingerprintPrefix !== tokenFingerprintPrefix) {
          // Empreinte différente, vérifier si c'est une activité suspecte
          const isSuspicious = this.isSuspiciousActivity(payload.id, currentFingerprint);
          
          if (isSuspicious) {
            this.metrics.tokensRejected++;
            throw new Error('Empreinte client invalide pour le rafraîchissement');
          }
        }
      }
      
      // Récupérer les informations utilisateur
      const user = await User.findById(payload.id);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }
      
      // Révoquer l'ancien token de rafraîchissement
      this.jwtRotation.revokeToken(refreshToken, 'Rafraîchissement', user.id);
      
      // Générer de nouveaux tokens
      const tokens = await this.generateTokens(user, req);
      
      this.metrics.refreshTokensUsed++;
      this.lastRefreshTime = new Date();
      
      return tokens;
    } catch (error) {
      this.metrics.refreshFailures++;
      
      const refreshError = errorService.createError(
        errorService.ERROR_TYPES.AUTHENTICATION,
        'Échec du rafraîchissement du token',
        {
          originalError: error.message
        },
        error,
        errorService.SEVERITY_LEVELS.WARNING
      );
      
      logger.warn(`Rafraîchissement de token échoué: ${error.message}`);
      throw refreshError;
    }
  }
  
  /**
   * Invalide tous les tokens pour un utilisateur spécifique
   * @param {string} userId ID de l'utilisateur
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async invalidateAllTokens(userId) {
    try {
      // Utiliser le système de rotation amélioré pour révoquer tous les tokens
      const revoked = this.jwtRotation.revokeAllUserTokens(userId, 'security');
      
      if (revoked) {
        logger.info(`Tous les tokens de l'utilisateur ${userId} ont été invalidés`);
        return true;
      }
      
      return false;
    } catch (error) {
      const invalidateError = errorService.createError(
        errorService.ERROR_TYPES.AUTHENTICATION,
        'Échec de l\'invalidation des tokens',
        {
          userId,
          originalError: error.message
        },
        error,
        errorService.SEVERITY_LEVELS.ERROR
      );
      
      logger.error(`Erreur lors de l'invalidation des tokens: ${error.message}`);
      throw invalidateError;
    }
  }
  
  /**
   * Déconnecte un utilisateur en révoquant son token actuel
   * @param {string} token Token à révoquer
   * @param {string} userId ID de l'utilisateur
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async logout(token, userId) {
    try {
      // Utiliser le système de rotation amélioré pour révoquer le token
      const success = this.jwtRotation.revokeToken(token, 'logout', userId);
      
      if (success) {
        this.metrics.tokensRevoked++;
        logger.info(`Déconnexion réussie pour l'utilisateur: ${userId}`);
      }
      
      return success;
    } catch (error) {
      const logoutError = errorService.createError(
        errorService.ERROR_TYPES.AUTHENTICATION,
        'Échec de la déconnexion',
        {
          userId,
          originalError: error.message
        },
        error,
        errorService.SEVERITY_LEVELS.WARNING
      );
      
      logger.error(`Erreur lors de la déconnexion: ${error.message}`);
      throw logoutError;
    }
  }
  
  /**
   * Révoque un token spécifique
   * @param {string} token Token à révoquer
   * @param {string} reason Raison de la révocation
   * @param {string} userId ID de l'utilisateur
   * @returns {Promise<boolean>} Succès de l'opération
   */
  async revokeToken(token, reason, userId) {
    try {
      // Utiliser le système de rotation amélioré pour révoquer le token
      const success = this.jwtRotation.revokeToken(token, reason, userId);
      
      // Supprimer du cache si présent
      const tokenHash = this._hashToken(token);
      this.tokenValidationCache.delete(tokenHash);
      
      if (success) {
        this.metrics.tokensRevoked++;
        logger.info(`Token révoqué avec succès pour l'utilisateur: ${userId}`);
      }
      
      return success;
    } catch (error) {
      const revokeError = errorService.createError(
        errorService.ERROR_TYPES.AUTHENTICATION,
        'Échec de la révocation du token',
        {
          userId,
          originalError: error.message
        },
        error,
        errorService.SEVERITY_LEVELS.WARNING
      );
      
      logger.error(`Erreur lors de la révocation du token: ${error.message}`);
      throw revokeError;
    }
  }

  /**
   * Récupère la date d'expiration d'un token JWT
   * @param {string} token Token JWT
   * @returns {Date} Date d'expiration
   * @private
   */
  _getTokenExpiry(token) {
    try {
      const decoded = jwt.decode(token);
      return new Date(decoded.exp * 1000);
    } catch (error) {
      logger.error(`Erreur lors de la lecture de l'expiration du token: ${error.message}`);
      return null;
    }
  }

  /**
   * Calcule le temps restant avant l'expiration d'un token
   * @param {string} token Token JWT
   * @returns {number} Temps restant en secondes
   */
  getTokenRemainingTime(token) {
    try {
      const expiryDate = this._getTokenExpiry(token);
      if (!expiryDate) return 0;
      
      const now = new Date();
      const remainingMs = expiryDate - now;
      
      return Math.max(0, Math.floor(remainingMs / 1000));
    } catch (error) {
      logger.error(`Erreur lors du calcul du temps d'expiration: ${error.message}`);
      return 0;
    }
  }

  /**
   * Obtient les métriques et l'état du service d'authentification
   * @returns {Object} Métriques et informations d'état
   */
  async getMetrics() {
    try {
      // Obtenir les statistiques de la liste noire
      const blacklistStats = await tokenBlacklist.getStats();
      
      // Obtenir les statistiques du système de rotation
      const rotationStats = this.jwtRotation.getStats();
      
      return {
        ...this.metrics,
        lastRefreshTime: this.lastRefreshTime ? this.lastRefreshTime.toISOString() : null,
        successRate: this.metrics.tokensRefreshed > 0 
          ? Math.round(((this.metrics.tokensRefreshed - this.metrics.refreshFailures) / this.metrics.tokensRefreshed) * 100) 
          : 100,
        cacheSize: this.tokenValidationCache.size,
        cacheHitRate: (this.metrics.cacheHits + this.metrics.cacheMisses) > 0
          ? Math.round((this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)) * 100)
          : 0,
        blacklist: blacklistStats,
        jwtRotation: rotationStats,
        status: 'healthy'
      };
    } catch (error) {
      logger.error(`Erreur lors de la récupération des métriques: ${error.message}`);
      return {
        ...this.metrics,
        status: 'degraded',
        error: error.message
      };
    }
  }

  /**
   * Définit le service de notification à utiliser
   * Utilisé pour résoudre les dépendances circulaires
   * @param {Object} service Service de notification
   */
  setNotificationService(service) {
    if (service && typeof service.send === 'function') {
      notificationService = service;
      logger.debug('Service de notification injecté dans AuthService');
      return true;
    }
    return false;
  }
}

// Exporter une instance singleton
const authService = new AuthService();
module.exports = authService;
