/**
 * SecureMemoryStorage - Classe pour le stockage sécurisé des clés API en mémoire
 * 
 * Cette classe implémente un système de chiffrement en mémoire pour protéger
 * les clés API même après leur chargement depuis les fichiers. Les clés sont
 * chiffrées en mémoire et ne sont déchiffrées qu'au moment de leur utilisation.
 */

const crypto = require('crypto');

class SecureMemoryStorage {
  /**
   * Constructeur
   * @param {string} encryptionKey - Clé de chiffrement principale
   * @param {Object} options - Options de configuration
   * @param {number} options.ttl - Durée de vie des entrées en mémoire (en ms)
   * @param {boolean} options.autoCleanup - Activer le nettoyage automatique des entrées expirées
   * @param {number} options.cleanupInterval - Intervalle de nettoyage (en ms)
   */
  constructor(encryptionKey, options = {}) {
    if (!encryptionKey || typeof encryptionKey !== 'string' || encryptionKey.length < 32) {
      throw new Error('Une clé de chiffrement valide d\'au moins 32 caractères est requise');
    }

    // Options par défaut
    this.options = {
      ttl: 30 * 60 * 1000, // 30 minutes par défaut
      autoCleanup: true,
      cleanupInterval: 5 * 60 * 1000, // 5 minutes par défaut
      ...options
    };

    // Dériver une clé différente pour le chiffrement en mémoire
    this.memoryEncryptionKey = crypto.createHash('sha256')
      .update(encryptionKey + 'memory-protection')
      .digest('hex');
    
    // Stockage en mémoire
    this.storage = new Map();

    // Démarrer le nettoyage automatique si activé
    if (this.options.autoCleanup) {
      this.startAutoCleanup();
    }
  }

  /**
   * Stocker une valeur chiffrée
   * @param {string} key - Clé d'accès
   * @param {any} value - Valeur à stocker
   * @param {number} customTtl - TTL personnalisé pour cette entrée (en ms)
   * @returns {boolean} - Succès de l'opération
   */
  set(key, value, customTtl = null) {
    try {
      // Générer un IV aléatoire
      const iv = crypto.randomBytes(16);
      
      // Créer le chiffreur
      const cipher = crypto.createCipheriv(
        'aes-256-gcm', 
        Buffer.from(this.memoryEncryptionKey, 'hex'), 
        iv
      );
      
      // Chiffrer la valeur
      let encrypted = cipher.update(JSON.stringify(value), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Récupérer le tag d'authentification
      const authTag = cipher.getAuthTag();
      
      // Calculer l'expiration
      const ttl = customTtl || this.options.ttl;
      const expiresAt = Date.now() + ttl;
      
      // Stocker les données
      this.storage.set(key, {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        expiresAt
      });
      
      return true;
    } catch (error) {
      console.error('Erreur lors du chiffrement en mémoire:', error.message);
      return false;
    }
  }

  /**
   * Récupérer et déchiffrer une valeur
   * @param {string} key - Clé d'accès
   * @returns {any|null} - Valeur déchiffrée ou null si erreur/expirée
   */
  get(key) {
    const data = this.storage.get(key);
    
    // Vérifier si la donnée existe
    if (!data) return null;
    
    // Vérifier si la donnée est expirée
    if (data.expiresAt < Date.now()) {
      this.delete(key);
      return null;
    }
    
    try {
      // Créer le déchiffreur
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm', 
        Buffer.from(this.memoryEncryptionKey, 'hex'), 
        Buffer.from(data.iv, 'hex')
      );
      
      // Définir le tag d'authentification
      decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));
      
      // Déchiffrer la valeur
      let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      // Prolonger la durée de vie (renouveler le TTL)
      data.expiresAt = Date.now() + this.options.ttl;
      this.storage.set(key, data);
      
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Erreur lors du déchiffrement en mémoire:', error.message);
      return null;
    }
  }

  /**
   * Vérifier si une clé existe et n'est pas expirée
   * @param {string} key - Clé à vérifier
   * @returns {boolean} - True si la clé existe et n'est pas expirée
   */
  has(key) {
    const data = this.storage.get(key);
    if (!data) return false;
    
    // Vérifier si la donnée est expirée
    if (data.expiresAt < Date.now()) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Supprimer une valeur
   * @param {string} key - Clé à supprimer
   * @returns {boolean} - Succès de l'opération
   */
  delete(key) {
    return this.storage.delete(key);
  }

  /**
   * Effacer toutes les valeurs
   * @returns {boolean} - Succès de l'opération
   */
  clear() {
    this.storage.clear();
    return true;
  }

  /**
   * Nettoyer les entrées expirées
   * @returns {number} - Nombre d'entrées supprimées
   */
  cleanup() {
    let count = 0;
    const now = Date.now();
    
    for (const [key, data] of this.storage.entries()) {
      if (data.expiresAt < now) {
        this.storage.delete(key);
        count++;
      }
    }
    
    return count;
  }

  /**
   * Démarrer le nettoyage automatique
   */
  startAutoCleanup() {
    if (this._cleanupInterval) {
      clearInterval(this._cleanupInterval);
    }
    
    this._cleanupInterval = setInterval(() => {
      const count = this.cleanup();
      if (count > 0) {
        console.debug(`Nettoyage automatique: ${count} entrées expirées supprimées`);
      }
    }, this.options.cleanupInterval);
    
    // S'assurer que l'intervalle ne bloque pas le processus de se terminer
    this._cleanupInterval.unref();
  }

  /**
   * Arrêter le nettoyage automatique
   */
  stopAutoCleanup() {
    if (this._cleanupInterval) {
      clearInterval(this._cleanupInterval);
      this._cleanupInterval = null;
    }
  }

  /**
   * Obtenir des statistiques sur le stockage
   * @returns {Object} - Statistiques
   */
  getStats() {
    const now = Date.now();
    let activeCount = 0;
    let expiredCount = 0;
    
    for (const data of this.storage.values()) {
      if (data.expiresAt < now) {
        expiredCount++;
      } else {
        activeCount++;
      }
    }
    
    return {
      totalCount: this.storage.size,
      activeCount,
      expiredCount,
      memoryUsage: process.memoryUsage().heapUsed
    };
  }
}

module.exports = SecureMemoryStorage;
