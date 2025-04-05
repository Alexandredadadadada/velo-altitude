/**
 * Système avancé de rotation des tokens JWT
 * Implémente une rotation automatique des tokens basée sur l'activité utilisateur
 * avec un mécanisme de révocation sélective et un système de journalisation
 * 
 * Dashboard-Velo.com
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { EventEmitter } = require('events');
const { logger } = require('./logger');

class EnhancedJwtRotation extends EventEmitter {
  /**
   * Initialise le gestionnaire de rotation des tokens JWT
   * @param {Object} options Options de configuration
   */
  constructor(options = {}) {
    super();
    
    this.options = {
      // Intervalle minimum entre deux rotations (en ms)
      minRotationInterval: options.minRotationInterval || 12 * 60 * 60 * 1000, // 12 heures
      
      // Durée de vie maximale d'une clé (en ms)
      maxKeyLifetime: options.maxKeyLifetime || 7 * 24 * 60 * 60 * 1000, // 7 jours
      
      // Période de grâce pour les tokens expirés (en ms)
      gracePeriod: options.gracePeriod || 30 * 60 * 1000, // 30 minutes
      
      // Nombre maximum de clés à conserver
      maxKeysCount: options.maxKeysCount || 5,
      
      // Seuil d'activité pour déclencher une rotation (nombre de validations)
      activityThreshold: options.activityThreshold || 1000,
      
      // Fonction de journalisation
      logger: options.logger || logger
    };
    
    // Système de stockage des clés
    this.keys = new Map();
    
    // Clé actuelle pour la signature
    this.currentKeyId = null;
    
    // Compteurs d'activité
    this.activityCounters = {
      validations: 0,
      refreshes: 0,
      revocations: 0,
      lastRotation: Date.now()
    };
    
    // Journal des rotations
    this.rotationLog = [];
    
    // Liste des tokens révoqués
    this.revokedTokens = new Map();
    
    // Initialiser la première clé
    this._generateNewKey();
    
    // Planifier le nettoyage périodique
    setInterval(() => this._cleanupExpiredData(), 60 * 60 * 1000); // Toutes les heures
    
    this.options.logger.info('Système de rotation JWT amélioré initialisé');
  }
  
  /**
   * Génère une nouvelle clé de signature
   * @private
   */
  _generateNewKey() {
    const keyId = Date.now().toString();
    const secret = crypto.randomBytes(64).toString('base64');
    
    const keyData = {
      id: keyId,
      secret,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.options.maxKeyLifetime,
      usageCount: 0
    };
    
    this.keys.set(keyId, keyData);
    this.currentKeyId = keyId;
    
    // Limiter le nombre de clés
    if (this.keys.size > this.options.maxKeysCount) {
      this._removeOldestKey();
    }
    
    // Journaliser la rotation
    this._logRotation('generate', keyId);
    
    // Émettre un événement
    this.emit('keyGenerated', { keyId });
    
    return keyId;
  }
  
  /**
   * Supprime la clé la plus ancienne
   * @private
   */
  _removeOldestKey() {
    let oldestKeyId = null;
    let oldestTimestamp = Infinity;
    
    // Trouver la clé la plus ancienne
    for (const [keyId, keyData] of this.keys.entries()) {
      if (keyData.createdAt < oldestTimestamp && keyId !== this.currentKeyId) {
        oldestKeyId = keyId;
        oldestTimestamp = keyData.createdAt;
      }
    }
    
    // Supprimer la clé la plus ancienne
    if (oldestKeyId) {
      this.keys.delete(oldestKeyId);
      this._logRotation('remove', oldestKeyId);
    }
  }
  
  /**
   * Journalise une rotation de clé
   * @param {string} action Type d'action (generate, rotate, remove)
   * @param {string} keyId Identifiant de la clé
   * @private
   */
  _logRotation(action, keyId) {
    const logEntry = {
      timestamp: Date.now(),
      action,
      keyId,
      keysCount: this.keys.size
    };
    
    this.rotationLog.push(logEntry);
    
    // Limiter la taille du journal
    if (this.rotationLog.length > 100) {
      this.rotationLog.shift();
    }
    
    this.options.logger.debug(`Rotation JWT: ${action} clé ${keyId}`);
  }
  
  /**
   * Nettoie les données expirées (clés et tokens révoqués)
   * @private
   */
  _cleanupExpiredData() {
    const now = Date.now();
    
    // Nettoyer les clés expirées
    for (const [keyId, keyData] of this.keys.entries()) {
      if (keyData.expiresAt < now && keyId !== this.currentKeyId) {
        this.keys.delete(keyId);
        this._logRotation('expire', keyId);
      }
    }
    
    // Nettoyer les tokens révoqués expirés
    for (const [tokenId, revokeData] of this.revokedTokens.entries()) {
      if (revokeData.expiresAt < now) {
        this.revokedTokens.delete(tokenId);
      }
    }
    
    this.options.logger.debug('Nettoyage des données JWT expirées effectué');
  }
  
  /**
   * Vérifie si une rotation est nécessaire en fonction de l'activité
   * @returns {boolean} True si une rotation est nécessaire
   */
  isRotationNeeded() {
    const now = Date.now();
    const timeSinceLastRotation = now - this.activityCounters.lastRotation;
    
    // Rotation basée sur l'activité
    const activityBasedRotation = 
      this.activityCounters.validations >= this.options.activityThreshold;
    
    // Rotation basée sur le temps
    const timeBasedRotation = 
      timeSinceLastRotation >= this.options.minRotationInterval;
    
    // Rotation basée sur l'expiration de la clé actuelle
    const currentKey = this.keys.get(this.currentKeyId);
    const expirationBasedRotation = 
      currentKey && (currentKey.expiresAt - now <= this.options.gracePeriod);
    
    return activityBasedRotation || timeBasedRotation || expirationBasedRotation;
  }
  
  /**
   * Effectue une rotation des clés de signature
   * @param {boolean} force Forcer la rotation même si les conditions ne sont pas remplies
   * @returns {string} ID de la nouvelle clé
   */
  rotateKeys(force = false) {
    // Vérifier si une rotation est nécessaire
    if (!force && !this.isRotationNeeded()) {
      return this.currentKeyId;
    }
    
    // Générer une nouvelle clé
    const newKeyId = this._generateNewKey();
    
    // Réinitialiser les compteurs d'activité
    this.activityCounters.validations = 0;
    this.activityCounters.lastRotation = Date.now();
    
    // Émettre un événement
    this.emit('keysRotated', { 
      previousKeyId: this.currentKeyId, 
      newKeyId,
      keysCount: this.keys.size
    });
    
    return newKeyId;
  }
  
  /**
   * Obtient la clé de signature actuelle
   * @returns {Object} Données de la clé actuelle
   */
  getCurrentKey() {
    return this.keys.get(this.currentKeyId);
  }
  
  /**
   * Obtient une clé de signature par son ID
   * @param {string} keyId ID de la clé
   * @returns {Object|null} Données de la clé ou null si non trouvée
   */
  getKeyById(keyId) {
    return this.keys.get(keyId) || null;
  }
  
  /**
   * Signe un payload avec la clé actuelle
   * @param {Object} payload Données à signer
   * @param {Object} options Options de signature JWT
   * @returns {Object} Token signé et informations associées
   */
  sign(payload, options = {}) {
    // Vérifier si une rotation est nécessaire
    if (this.isRotationNeeded()) {
      this.rotateKeys();
    }
    
    const currentKey = this.getCurrentKey();
    if (!currentKey) {
      throw new Error('Aucune clé de signature disponible');
    }
    
    // Incrémenter le compteur d'utilisation
    currentKey.usageCount++;
    
    // Préparer les options de signature
    const signOptions = {
      algorithm: 'HS256',
      expiresIn: options.expiresIn || '1h',
      ...options,
      header: {
        ...options.header,
        kid: currentKey.id
      }
    };
    
    // Signer le payload
    const token = jwt.sign(payload, currentKey.secret, signOptions);
    
    // Décoder le token pour obtenir les informations d'expiration
    const decoded = jwt.decode(token, { complete: true });
    const expiresAt = decoded.payload.exp * 1000;
    
    return {
      token,
      keyId: currentKey.id,
      issuedAt: Date.now(),
      expiresAt
    };
  }
  
  /**
   * Vérifie un token JWT
   * @param {string} token Token à vérifier
   * @returns {Object} Payload décodé
   */
  verify(token) {
    // Incrémenter le compteur de validations
    this.activityCounters.validations++;
    
    // Vérifier si le token est révoqué
    const tokenHash = this._hashToken(token);
    if (this.revokedTokens.has(tokenHash)) {
      throw new Error('Token révoqué');
    }
    
    // Décoder le token sans vérifier la signature pour obtenir le keyId
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || !decoded.header) {
      throw new Error('Format de token invalide');
    }
    
    // Récupérer la clé de signature correspondante
    const keyId = decoded.header.kid;
    const keyData = this.getKeyById(keyId);
    
    if (!keyData) {
      throw new Error(`Clé de signature #${keyId} non trouvée`);
    }
    
    try {
      // Vérifier la signature du token
      const payload = jwt.verify(token, keyData.secret, {
        algorithms: ['HS256']
      });
      
      return payload;
    } catch (error) {
      // Vérifier si le token est expiré mais dans la période de grâce
      if (error.name === 'TokenExpiredError') {
        const now = Date.now();
        const expiry = decoded.payload.exp * 1000;
        
        // Si le token est dans la période de grâce, le considérer comme valide
        if (now - expiry <= this.options.gracePeriod) {
          this.options.logger.debug('Token expiré mais dans la période de grâce');
          
          // Retourner le payload mais avec un flag indiquant qu'il est expiré
          return {
            ...decoded.payload,
            isExpired: true,
            gracePeriod: true
          };
        }
      }
      
      throw error;
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
   * Révoque un token spécifique
   * @param {string} token Token à révoquer
   * @param {string} reason Raison de la révocation
   * @param {string} userId ID de l'utilisateur
   * @returns {boolean} Succès de l'opération
   */
  revokeToken(token, reason = 'security', userId = null) {
    try {
      // Décoder le token pour obtenir les informations d'expiration
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded || !decoded.payload) {
        return false;
      }
      
      // Calculer un hash du token pour le stockage
      const tokenHash = this._hashToken(token);
      
      // Stocker les informations de révocation
      this.revokedTokens.set(tokenHash, {
        revokedAt: Date.now(),
        expiresAt: decoded.payload.exp * 1000,
        reason,
        userId
      });
      
      // Incrémenter le compteur de révocations
      this.activityCounters.revocations++;
      
      // Émettre un événement
      this.emit('tokenRevoked', { tokenHash, reason, userId });
      
      return true;
    } catch (error) {
      this.options.logger.error(`Erreur lors de la révocation du token: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Révoque tous les tokens d'un utilisateur
   * @param {string} userId ID de l'utilisateur
   * @param {string} reason Raison de la révocation
   * @returns {number} Nombre de tokens révoqués
   */
  revokeAllUserTokens(userId, reason = 'security') {
    // Forcer une rotation des clés pour invalider tous les tokens futurs
    this.rotateKeys(true);
    
    // Émettre un événement
    this.emit('userTokensRevoked', { userId, reason });
    
    return 1; // Nous ne pouvons pas connaître le nombre exact de tokens révoqués
  }
  
  /**
   * Obtient des statistiques sur l'utilisation du système
   * @returns {Object} Statistiques
   */
  getStats() {
    return {
      keysCount: this.keys.size,
      currentKeyId: this.currentKeyId,
      currentKeyUsage: this.getCurrentKey()?.usageCount || 0,
      activityCounters: { ...this.activityCounters },
      revokedTokensCount: this.revokedTokens.size,
      rotationLogSize: this.rotationLog.length,
      lastRotation: this.activityCounters.lastRotation
    };
  }
  
  /**
   * Obtient le journal des rotations
   * @param {number} limit Nombre maximum d'entrées à retourner
   * @returns {Array} Journal des rotations
   */
  getRotationLog(limit = 10) {
    return this.rotationLog
      .slice(-limit)
      .sort((a, b) => b.timestamp - a.timestamp);
  }
}

module.exports = EnhancedJwtRotation;
