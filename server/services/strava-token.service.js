/**
 * Service de gestion des tokens Strava
 * Responsable du rafraîchissement automatique des tokens d'accès
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const notificationService = require('./notification.service');
const apiQuotaManager = require('./api-quota-manager');
const { trackApiCall, canCallApi } = require('../middleware/api-quota-middleware');
const cacheService = require('./cache.service');

class StravaTokenService {
  constructor() {
    // Initialiser le service
    this.tokenRefreshAttempts = 0;
    this.maxRefreshAttempts = 3;
    this.refreshIntervalMs = 10 * 60 * 1000; // 10 minutes entre les tentatives
    this.logPath = path.join(process.cwd(), 'logs', 'strava-token.log');
    this.isRefreshing = false; // Verrou pour éviter les rafraîchissements parallèles
    this.lastRefreshTime = 0; // Timestamp de la dernière tentative de rafraîchissement
    this.backoffFactor = 1.5; // Facteur pour le backoff exponentiel
    this.minRetryDelay = 5 * 60 * 1000; // 5 minutes minimum entre les tentatives
    this.memoryCache = null; // Cache en mémoire du token actuel
    this.memoryCacheExpiry = 0; // Timestamp d'expiration du cache mémoire
    
    // Clés de cache
    this.CACHE_KEYS = {
      TOKEN: 'strava:token:current',
      REFRESH_STATUS: 'strava:token:refresh_status'
    };
    
    // S'assurer que le répertoire de log existe
    const logDir = path.dirname(this.logPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Planifier la vérification périodique des tokens
    this.scheduleTokenRefreshCheck();
  }
  
  /**
   * Vérifie et rafraîchit le token si nécessaire
   * @param {boolean} forceRefresh - Force le rafraîchissement même si non expiré
   * @returns {Promise<string>} Token d'accès actuel ou mis à jour
   */
  async refreshTokenIfNeeded(forceRefresh = false) {
    try {
      // Vérifier si un rafraîchissement est déjà en cours
      if (this.isRefreshing) {
        logger.debug('Un rafraîchissement de token Strava est déjà en cours, attente...');
        
        // Vérifier si nous avons un token en cache mémoire valide
        if (this.memoryCache && Date.now() < this.memoryCacheExpiry) {
          logger.debug('Utilisation du token Strava en cache mémoire pendant le rafraîchissement');
          return this.memoryCache;
        }
        
        // Sinon, retourner le token actuel du fichier
        const { accessToken } = this.getTokens();
        return accessToken;
      }
      
      // Vérifier le cache Redis pour les données de rafraîchissement récentes
      const cachedRefreshStatus = await cacheService.get(this.CACHE_KEYS.REFRESH_STATUS);
      if (cachedRefreshStatus && cachedRefreshStatus.inProgress && Date.now() - cachedRefreshStatus.startTime < 30000) {
        logger.debug('Rafraîchissement de token Strava en cours dans un autre processus, attente...');
        const { accessToken } = this.getTokens();
        return accessToken;
      }
      
      // Vérifier le cache Redis pour le token
      const cachedToken = await cacheService.get(this.CACHE_KEYS.TOKEN);
      if (cachedToken && !forceRefresh) {
        // Vérifier si le token est encore valide
        const now = Math.floor(Date.now() / 1000);
        if (cachedToken.expiresAt && now < cachedToken.expiresAt - 600) { // Marge de 10 minutes
          logger.debug('Utilisation du token Strava depuis le cache Redis');
          
          // Mettre à jour le cache mémoire
          this.memoryCache = cachedToken.accessToken;
          this.memoryCacheExpiry = (cachedToken.expiresAt - 60) * 1000; // 1 minute de marge
          
          return cachedToken.accessToken;
        }
      }
      
      logger.debug('Vérification de l\'expiration du token Strava');
      
      // Charger les tokens actuels
      const { accessToken, refreshToken, expiresAt, clientId, clientSecret } = this.getTokens();
      
      // Si des données sont manquantes, envoyer une alerte et abandonner
      if (!accessToken || !refreshToken || !clientId || !clientSecret) {
        const missingConfig = !accessToken ? 'access token' : 
                             !refreshToken ? 'refresh token' : 
                             !clientId ? 'client ID' : 'client secret';
                             
        const message = `Configuration incomplète pour Strava: ${missingConfig} manquant`;
        logger.error(message);
        
        notificationService.sendAlert({
          type: 'error',
          source: 'strava-token',
          subject: 'Configuration Strava incomplète',
          message
        });
        
        throw new Error(message);
      }
      
      // Vérifier si le token a expiré ou si un rafraîchissement est forcé
      const now = Math.floor(Date.now() / 1000);
      const isExpired = forceRefresh || (expiresAt && now >= expiresAt - 600); // Marge de 10 minutes
      
      // Si le token est toujours valide, le mettre en cache et le retourner
      if (!isExpired) {
        logger.debug('Token Strava toujours valide');
        
        // Mettre à jour le cache Redis
        await cacheService.set(this.CACHE_KEYS.TOKEN, { 
          accessToken, 
          refreshToken, 
          expiresAt,
          updatedAt: now
        }, (expiresAt - now - 60)); // TTL jusqu'à expiration moins 1 minute
        
        // Mettre à jour le cache mémoire
        this.memoryCache = accessToken;
        this.memoryCacheExpiry = (expiresAt - 60) * 1000; // 1 minute de marge
        
        return accessToken;
      }
      
      // Vérifier le délai entre les tentatives (backoff exponentiel)
      const timeSinceLastRefresh = Date.now() - this.lastRefreshTime;
      const requiredDelay = this.minRetryDelay * Math.pow(this.backoffFactor, this.tokenRefreshAttempts);
      
      if (this.tokenRefreshAttempts > 0 && timeSinceLastRefresh < requiredDelay) {
        logger.debug(`Respecte le délai de backoff (${Math.round(timeSinceLastRefresh/1000)}s écoulées, ${Math.round(requiredDelay/1000)}s requises)`);
        return accessToken; // Retourner l'ancien token, même expiré
      }
      
      // Vérifier si nous avons atteint les limites d'API pour le rafraîchissement
      if (!canCallApi('strava', 2)) { // Le rafraîchissement coûte 2 appels d'API
        const message = 'Impossible de rafraîchir le token Strava : quota d\'API dépassé';
        logger.warn(message);
        return accessToken; // Retourner l'ancien token malgré l'expiration
      }
      
      logger.info('Rafraîchissement du token Strava nécessaire');
      
      // Mettre le verrou
      this.isRefreshing = true;
      this.lastRefreshTime = Date.now();
      
      // Enregistrer le statut de rafraîchissement dans Redis
      await cacheService.set(this.CACHE_KEYS.REFRESH_STATUS, {
        inProgress: true,
        startTime: Date.now(),
        attemptNumber: this.tokenRefreshAttempts + 1
      }, 60); // 1 minute TTL
      
      // Enregistrer une tentative de rafraîchissement
      const startTime = Date.now();
      
      try {
        // Rafraîchir le token
        const response = await axios.post('https://www.strava.com/oauth/token', {
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        });
        
        // Enregistrer l'appel à l'API
        trackApiCall(
          'strava', 
          '/oauth/token', 
          true, 
          response.status, 
          Date.now() - startTime,
          2 // Coût plus élevé pour l'opération de rafraîchissement
        );
        
        // Réinitialiser les tentatives après un succès
        this.tokenRefreshAttempts = 0;
        
        // Mettre à jour les tokens
        const newData = {
          accessToken: response.data.access_token,
          refreshToken: response.data.refresh_token,
          expiresAt: response.data.expires_at,
          clientId,
          clientSecret
        };
        
        // Sauvegarder les nouveaux tokens
        this.saveTokens(newData);
        
        // Mettre à jour le cache Redis
        await cacheService.set(this.CACHE_KEYS.TOKEN, { 
          accessToken: newData.accessToken,
          refreshToken: newData.refreshToken,
          expiresAt: newData.expiresAt,
          updatedAt: Math.floor(Date.now() / 1000)
        }, (newData.expiresAt - Math.floor(Date.now() / 1000) - 60)); // TTL jusqu'à expiration moins 1 minute
        
        // Mettre à jour le cache mémoire
        this.memoryCache = newData.accessToken;
        this.memoryCacheExpiry = (newData.expiresAt - 60) * 1000; // 1 minute de marge
        
        // Mettre à jour le statut de rafraîchissement
        await cacheService.set(this.CACHE_KEYS.REFRESH_STATUS, {
          inProgress: false,
          success: true,
          completedAt: Date.now(),
          nextAttemptAllowed: Date.now()
        }, 3600); // 1 heure TTL
        
        logger.info('Token Strava rafraîchi avec succès');
        
        // Envoyer une notification d'information
        notificationService.sendAlert({
          type: 'info',
          source: 'strava-token',
          subject: 'Token Strava rafraîchi',
          message: `Le token Strava a été rafraîchi. Expiration: ${new Date(newData.expiresAt * 1000).toISOString()}`
        });
        
        return newData.accessToken;
      } catch (error) {
        // Incrémenter le compteur de tentatives
        this.tokenRefreshAttempts++;
        
        // Enregistrer l'appel d'API échoué
        trackApiCall('strava', '/oauth/token', false);
        
        // Logger l'erreur
        logger.error('Erreur lors du rafraîchissement du token Strava', {
          error: error.message,
          stack: error.stack,
          attempt: this.tokenRefreshAttempts
        });
        
        // Calculer le prochain délai de tentative
        const nextRetryDelay = this.minRetryDelay * Math.pow(this.backoffFactor, this.tokenRefreshAttempts);
        const nextRetryTime = Date.now() + nextRetryDelay;
        
        // Mettre à jour le statut de rafraîchissement
        await cacheService.set(this.CACHE_KEYS.REFRESH_STATUS, {
          inProgress: false,
          success: false,
          error: error.message,
          failedAt: Date.now(),
          attemptsMade: this.tokenRefreshAttempts,
          nextAttemptAllowed: nextRetryTime
        }, 3600); // 1 heure TTL
        
        // Envoyer une alerte seulement si c'est une erreur critique (après plusieurs tentatives)
        if (this.tokenRefreshAttempts >= 2) {
          notificationService.sendAlert({
            type: 'error',
            source: 'strava-token',
            subject: 'Échec de rafraîchissement du token Strava',
            message: `Erreur lors du rafraîchissement du token Strava (tentative ${this.tokenRefreshAttempts}): ${error.message}. Prochaine tentative dans ${Math.round(nextRetryDelay/60000)} minutes. Il est possible que les requêtes Strava échouent jusqu'à la résolution du problème.`
          });
        }
        
        // Retourner le token actuel en cas d'échec de rafraîchissement
        return accessToken;
      } finally {
        // Libérer le verrou
        this.isRefreshing = false;
      }
    } catch (error) {
      logger.error('Erreur inattendue dans la gestion des tokens Strava', {
        error: error.message,
        stack: error.stack
      });
      
      // Libérer le verrou en cas d'erreur inattendue
      this.isRefreshing = false;
      
      // Retourner le token actuel
      const { accessToken } = this.getTokens();
      return accessToken;
    }
  }

  /**
   * Planifie la vérification périodique des tokens
   */
  scheduleTokenRefreshCheck() {
    // Vérifier le token toutes les heures avec un petit décalage aléatoire
    // pour éviter que tous les serveurs tentent de rafraîchir au même moment
    const jitter = Math.floor(Math.random() * 300000); // 0-5 minutes de décalage
    const interval = 60 * 60 * 1000 + jitter; // ~1 heure
    
    this.tokenCheckerInterval = setInterval(async () => {
      try {
        logger.debug('Vérification programmée du token Strava');
        await this.refreshTokenIfNeeded();
        
        // Après le rafraîchissement réussi, mettre à jour le statut de l'API
        apiQuotaManager.recordRequest(
          'strava', 
          'token_check',
          1,  // Coût standard
          true, // Succès
          0     // Temps de réponse non pertinent pour cette opération
        );
        
      } catch (error) {
        logger.error('Erreur lors de la vérification programmée du token Strava', {
          error: error.message
        });
      }
    }, interval);
    
    logger.info(`Planificateur de vérification des tokens Strava initialisé (interval: ${Math.round(interval/60000)} minutes)`);
  }

  /**
   * Arrête le planificateur de vérification des tokens
   */
  stopTokenChecker() {
    if (this.tokenCheckerInterval) {
      clearInterval(this.tokenCheckerInterval);
      logger.info('Planificateur de vérification des tokens Strava arrêté');
    }
  }

  /**
   * Supprime une entrée spécifique du cache
   * @param {string} cacheKey - Clé de cache à supprimer (TOKEN ou REFRESH_STATUS)
   * @returns {Promise<boolean>} - true si supprimé avec succès
   */
  async clearCache(cacheKey) {
    try {
      if (!this.CACHE_KEYS[cacheKey]) {
        logger.warn(`Tentative de suppression d'une clé de cache inconnue: ${cacheKey}`);
        return false;
      }
      
      const key = this.CACHE_KEYS[cacheKey];
      await cacheService.del(key);
      logger.info(`Cache Strava supprimé: ${key}`);
      
      // Si c'est le token, réinitialiser également le cache mémoire
      if (cacheKey === 'TOKEN') {
        this.memoryCache = null;
        this.memoryCacheExpiry = 0;
      }
      
      return true;
    } catch (error) {
      logger.error(`Erreur lors de la suppression du cache Strava (${cacheKey})`, {
        error: error.message
      });
      return false;
    }
  }

  /**
   * Récupère le statut actuel du service de gestion des tokens
   * @returns {Object} Informations sur l'état du service
   */
  async getStatus() {
    const { accessToken, refreshToken, expiresAt, clientId, clientSecret } = this.getTokens();
    
    const now = Math.floor(Date.now() / 1000);
    const isValid = accessToken && refreshToken && clientId && clientSecret;
    const isExpired = expiresAt && now >= expiresAt;
    const timeUntilExpiration = expiresAt ? (expiresAt - now) : 0;
    
    // Obtenir les statistiques d'utilisation de l'API
    const quotaStats = apiQuotaManager.getUsageStatistics()['strava'] || {};
    
    // Obtenir le statut de rafraîchissement du cache
    const refreshStatus = await cacheService.get(this.CACHE_KEYS.REFRESH_STATUS) || {};
    
    return {
      isConfigured: isValid,
      accessTokenStatus: {
        isAvailable: !!accessToken,
        isExpired: isExpired,
        expiresAt: expiresAt ? new Date(expiresAt * 1000).toISOString() : null,
        timeUntilExpiration: timeUntilExpiration > 0 ? timeUntilExpiration : 0,
        formattedExpiration: expiresAt ? 
          `${Math.floor(timeUntilExpiration / 3600)}h ${Math.floor((timeUntilExpiration % 3600) / 60)}m` : 
          'N/A'
      },
      refreshTokenStatus: {
        isAvailable: !!refreshToken
      },
      clientCredentialsStatus: {
        clientIdAvailable: !!clientId,
        clientSecretAvailable: !!clientSecret
      },
      refreshState: {
        isRefreshing: this.isRefreshing,
        lastRefreshTime: this.lastRefreshTime ? new Date(this.lastRefreshTime).toISOString() : null,
        tokenRefreshAttempts: this.tokenRefreshAttempts,
        nextRetryDelay: this.tokenRefreshAttempts > 0 ? 
          this.minRetryDelay * Math.pow(this.backoffFactor, this.tokenRefreshAttempts) / 1000 : 0,
        cachedStatus: refreshStatus
      },
      cacheStatus: {
        memoryCacheAvailable: !!this.memoryCache,
        memoryCacheExpiry: this.memoryCacheExpiry ? new Date(this.memoryCacheExpiry).toISOString() : null,
        redisCacheAvailable: !!(await cacheService.get(this.CACHE_KEYS.TOKEN))
      },
      lastChecked: new Date().toISOString(),
      tokenCheckerActive: !!this.tokenCheckerInterval,
      apiQuotaUsage: quotaStats.quotaUsage || {
        day: { count: 0, limit: 1000, percentage: '0.00' },
        fifteenMin: { count: 0, limit: 100, percentage: '0.00' }
      }
    };
  }
}

// Exporter une instance singleton
const stravaTokenService = new StravaTokenService();
module.exports = stravaTokenService;
