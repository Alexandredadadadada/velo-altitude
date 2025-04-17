/**
 * Middleware d'authentification et d'autorisation
 * Version robuste avec gestion automatique du rafraîchissement des tokens
 */
const { logger } = require('../utils/logger');
const authService = require('../services/auth.service');
const errorService = require('../services/error.service');
const tokenBlacklist = require('../services/auth/token-blacklist');
const authErrorHandler = require('../services/auth/auth-error-handler');
const intrusionDetector = require('../services/security/intrusion-detector');
const User = require('../models/user.model');
const config = require('../config/api.config');
const crypto = require('crypto');

/**
 * Middleware de vérification du token JWT avec gestion du rafraîchissement automatique
 * et détection des tentatives d'intrusion
 */
exports.authenticateJWT = async (req, res, next) => {
  try {
    // Récupérer l'adresse IP du client
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Vérifier si l'IP est bloquée par le système d'intrusion
    if (await intrusionDetector.isBlocked(clientIP)) {
      return res.status(423).json({
        success: false,
        error: {
          code: 'ACCOUNT_LOCKED',
          message: 'Votre compte ou IP a été temporairement bloqué suite à des tentatives échouées.'
        },
        status: 423
      });
    }

    // Extraire le token JWT (depuis l'en-tête ou cookie)
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    if (!token) {
      const error = new Error('MissingTokenError');
      error.name = 'MissingTokenError';
      throw error;
    }

    // Vérifier si le token est blacklisté
    if (await tokenBlacklist.isBlacklisted(token)) {
      const error = new Error('TokenRevokedError');
      error.name = 'TokenRevokedError';
      throw error;
    }

    // Vérifier le token
    const decoded = await authService.verifyToken(token, req);
    req.user = decoded;

    // Vérifier si nous sommes en mode développement et si l'authentification est activée
    if (config.environment === 'development' && config.auth?.bypassAuth === true) {
      // En mode développement avec bypass activé, utiliser un utilisateur de test
      req.user = {
        _id: '123456789012345678901234',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'Test',
        role: 'admin'
      };

      logger.info(`[AUTH] Mode développement - Authentification automatique en tant qu'admin`);
    }

    // Vérifier si le token est proche de l'expiration et le rafraîchir si nécessaire
    const remainingTime = authService.getTokenRemainingTime(token);
    const refreshThreshold = 5 * 60; // 5 minutes en secondes

    if (remainingTime < refreshThreshold) {
      // Token proche de l'expiration, tenter de le rafraîchir en arrière-plan
      const refreshToken = req.cookies?.refreshToken;

      if (refreshToken) {
        // Rafraîchir le token de manière asynchrone sans bloquer la requête
        Promise.resolve().then(async () => {
          try {
            const newTokens = await authService.refreshAccessToken(refreshToken);

            // Mettre à jour les cookies avec les nouveaux tokens pour les prochaines requêtes
            if (config.auth?.useCookies) {
              res.cookie('accessToken', newTokens.accessToken, {
                httpOnly: true,
                secure: config.environment !== 'development',
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000 // 24 heures
              });

              res.cookie('refreshToken', newTokens.refreshToken, {
                httpOnly: true,
                secure: config.environment !== 'development',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
              });
            }

            // Ajouter les nouveaux tokens à la réponse
            res.setHeader('X-New-Access-Token', newTokens.accessToken);

            logger.debug(`[AUTH] Token rafraîchi en arrière-plan pour ${req.user.email || req.user._id}`);
          } catch (refreshError) {
            // Ne pas bloquer la requête en cours, juste consigner l'erreur
            logger.warn(`[AUTH] Échec du rafraîchissement en arrière-plan: ${refreshError.message}`);
          }
        });
      }
    }

    // Continuer le traitement de la requête
    next();
  } catch (error) {
    // Utiliser le gestionnaire d'erreurs avancé
    const errorResponse = await authErrorHandler.handleAuthError(error, req, res);
    res.status(errorResponse.status).json(errorResponse);
  }
};

/**
 * Middleware de vérification du rôle administrateur
 */
exports.isAdmin = async (req, res, next) => {
  try {
    // Vérifier si l'utilisateur est authentifié
    if (!req.user) {
      const error = errorService.createError({
        type: 'auth_required',
        message: 'Authentification requise',
        severity: 'warning',
        notification: {
          type: 'toast',
          position: 'top-center',
          autoClose: 5000,
          requireConfirmation: false
        }
      });

      logger.warn('[AUTH] Tentative d\'accès admin sans authentification');
      return errorService.sendErrorResponse(res, error);
    }

    // Vérifier si l'utilisateur a le rôle admin
    if (req.user.role !== 'admin') {
      const error = errorService.createError({
        type: 'auth_insufficient_privileges',
        message: 'Accès refusé. Privilèges administrateur requis.',
        severity: 'warning',
        notification: {
          type: 'toast',
          position: 'top-center',
          autoClose: 5000,
          requireConfirmation: false
        }
      });

      logger.warn(`[AUTH] Tentative d'accès admin refusée pour ${req.user.email || req.user._id}`);
      return errorService.sendErrorResponse(res, error);
    }

    // Utilisateur admin authentifié, autoriser l'accès
    logger.debug(`[AUTH] Accès admin autorisé pour ${req.user.email || req.user._id}`);
    next();
  } catch (error) {
    const middlewareError = errorService.createError({
      type: 'auth_middleware_failure',
      message: 'Erreur interne du serveur lors de la vérification des privilèges',
      severity: 'error',
      details: {
        originalError: error.message
      }
    });

    logger.error(`[AUTH] Erreur dans la vérification admin: ${error.message}`);
    return errorService.sendErrorResponse(res, middlewareError);
  }
};

/**
 * Middleware de vérification du propriétaire de la ressource
 * @param {Function} getResourceOwnerId - Fonction qui récupère l'ID du propriétaire à partir de req
 */
exports.isResourceOwner = (getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      // Vérifier si nous sommes en mode développement et si l'authentification est activée
      if (config.environment === 'development' && config.auth?.bypassAuth === true) {
        // En mode développement avec bypass activé, simuler un accès propriétaire
        if (!req.user) {
          req.user = {
            _id: '123456789012345678901234',
            email: 'admin@test.com',
            firstName: 'Admin',
            lastName: 'Test',
            role: 'admin'
          };
        }

        logger.info(`[AUTH] Mode développement - Autorisation propriétaire automatique`);
        return next();
      }

      // Vérifier si l'utilisateur est authentifié
      if (!req.user) {
        const error = errorService.createError({
          type: 'auth_required',
          message: 'Authentification requise',
          severity: 'warning',
          notification: {
            type: 'toast',
            position: 'top-center',
            autoClose: 5000,
            requireConfirmation: false
          }
        });

        logger.warn('[AUTH] Tentative d\'accès ressource sans authentification');
        return errorService.sendErrorResponse(res, error);
      }

      // Si l'utilisateur est admin, autoriser l'accès sans vérification supplémentaire
      if (req.user.role === 'admin') {
        logger.debug(`[AUTH] Accès ressource autorisé pour admin ${req.user.email || req.user._id}`);
        return next();
      }

      // Récupérer l'ID du propriétaire de la ressource
      const resourceOwnerId = await getResourceOwnerId(req);

      // Si l'ID du propriétaire n'a pas pu être récupéré
      if (!resourceOwnerId) {
        const error = errorService.createError({
          type: 'resource_not_found',
          message: 'Ressource introuvable',
          severity: 'warning',
          notification: {
            type: 'toast',
            position: 'top-center',
            autoClose: 5000,
            requireConfirmation: false
          }
        });

        logger.warn(`[AUTH] Impossible de déterminer le propriétaire de la ressource`);
        return errorService.sendErrorResponse(res, error);
      }

      // Comparer l'ID de l'utilisateur avec celui du propriétaire
      if (req.user._id.toString() !== resourceOwnerId.toString()) {
        const error = errorService.createError({
          type: 'auth_unauthorized_access',
          message: 'Accès refusé. Vous n\'êtes pas le propriétaire de cette ressource.',
          severity: 'warning',
          notification: {
            type: 'toast',
            position: 'top-center',
            autoClose: 5000,
            requireConfirmation: false
          }
        });

        logger.warn(`[AUTH] Tentative d'accès non autorisé à une ressource par ${req.user.email || req.user._id}`);
        return errorService.sendErrorResponse(res, error);
      }

      // Utilisateur propriétaire authentifié, autoriser l'accès
      logger.debug(`[AUTH] Accès propriétaire autorisé pour ${req.user.email || req.user._id}`);
      next();
    } catch (error) {
      const middlewareError = errorService.createError({
        type: 'auth_middleware_failure',
        message: 'Erreur interne du serveur lors de la vérification des droits d\'accès',
        severity: 'error',
        details: {
          originalError: error.message
        }
      });

      logger.error(`[AUTH] Erreur dans la vérification du propriétaire: ${error.message}`);
      return errorService.sendErrorResponse(res, middlewareError);
    }
  };
};

/**
 * Middleware de déconnexion
 */
exports.logout = async (req, res, next) => {
  try {
    // Récupérer le token depuis l'en-tête Authorization ou les cookies
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.accessToken || req.token;
    const userId = req.user?._id;

    // Révoquer le token
    if (token) {
      await authService.logout(token, userId);
    }

    // Effacer les cookies d'authentification
    if (config.auth?.useCookies) {
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
    }

    // Continuer le traitement de la requête
    next();
  } catch (error) {
    const logoutError = errorService.createError({
      type: 'auth_logout_failure',
      message: 'Erreur lors de la déconnexion',
      severity: 'warning',
      details: {
        originalError: error.message
      }
    });

    logger.error(`[AUTH] Erreur lors de la déconnexion: ${error.message}`);
    return errorService.sendErrorResponse(res, logoutError);
  }
};

/**
 * Middleware de vérification d'authentification renforcée pour les endpoints sensibles
 * Exige une authentification à deux facteurs ou une session récente
 */
exports.authenticateEnhanced = async (req, res, next) => {
  try {
    // Vérifier d'abord l'authentification de base
    exports.authenticateJWT(req, res, async (err) => {
      if (err) return next(err);

      // Récupérer l'adresse IP du client
      const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

      // Vérifier si l'utilisateur a une authentification à deux facteurs active
      const user = await User.findById(req.user._id);

      if (!user) {
        const error = errorService.createError({
          type: 'auth_user_not_found',
          message: 'Utilisateur introuvable',
          severity: 'error'
        });

        logger.error(`[AUTH] Utilisateur introuvable pour l'authentification renforcée: ${req.user._id}`);
        return errorService.sendErrorResponse(res, error);
      }

      // Si l'utilisateur a activé l'authentification à deux facteurs
      if (user.security && user.security.twoFactorEnabled) {
        // Vérifier si l'utilisateur a validé son 2FA pour cette session
        const twoFactorVerified = req.session?.twoFactorVerified;

        if (!twoFactorVerified) {
          const error = errorService.createError({
            type: 'auth_2fa_required',
            message: 'Cette action nécessite une authentification à deux facteurs',
            severity: 'warning',
            notification: {
              type: 'modal',
              position: 'center',
              autoClose: 0,
              requireConfirmation: true,
              blockUI: true
            }
          });

          logger.warn(`[AUTH] Tentative d'accès à un endpoint sensible sans 2FA: ${user.email} (IP: ${clientIP})`);
          return errorService.sendErrorResponse(res, error);
        }
      } else {
        // Si l'utilisateur n'a pas activé l'authentification à deux facteurs,
        // vérifier si la session est récente (moins de 30 minutes)
        const tokenIssuedAt = authService.getTokenIssuedAt(req.token);
        const sessionAge = Date.now() / 1000 - tokenIssuedAt;

        if (sessionAge > 30 * 60) { // 30 minutes en secondes
          const error = errorService.createError({
            type: 'auth_relogin_required',
            message: 'Pour des raisons de sécurité, veuillez vous reconnecter pour effectuer cette action',
            severity: 'warning',
            notification: {
              type: 'modal',
              position: 'center',
              autoClose: 0,
              requireConfirmation: true,
              blockUI: true
            }
          });

          logger.warn(`[AUTH] Session trop ancienne pour un endpoint sensible: ${user.email} (IP: ${clientIP})`);
          return errorService.sendErrorResponse(res, error);
        }
      }

      // Authentification renforcée réussie
      logger.info(`[AUTH] Authentification renforcée réussie pour ${user.email} (IP: ${clientIP})`);
      next();
    });
  } catch (error) {
    const middlewareError = errorService.createError({
      type: 'auth_enhanced_failure',
      message: 'Erreur lors de l\'authentification renforcée',
      severity: 'error',
      details: {
        originalError: error.message
      }
    });

    logger.error(`[AUTH] Erreur dans l'authentification renforcée: ${error.message}`);
    return errorService.sendErrorResponse(res, middlewareError);
  }
};

/**
 * Middleware de vérification de la signature de requête pour les API publiques
 * Utilise un système de signature HMAC pour authentifier les requêtes API
 */
exports.verifyApiSignature = async (req, res, next) => {
  try {
    // Récupérer les en-têtes de signature
    const apiKey = req.headers['x-api-key'];
    const timestamp = req.headers['x-timestamp'];
    const signature = req.headers['x-signature'];

    // Vérifier que tous les en-têtes requis sont présents
    if (!apiKey || !timestamp || !signature) {
      const error = errorService.createError({
        type: 'api_signature_missing',
        message: 'Signature API manquante ou incomplète',
        severity: 'warning'
      });

      logger.warn(`[API] Tentative d'accès sans signature complète: ${req.originalUrl}`);
      return errorService.sendErrorResponse(res, error);
    }

    // Vérifier que le timestamp n'est pas trop ancien (15 minutes max)
    const now = Math.floor(Date.now() / 1000);
    const timestampNum = parseInt(timestamp, 10);

    if (isNaN(timestampNum) || now - timestampNum > 15 * 60) {
      const error = errorService.createError({
        type: 'api_signature_expired',
        message: 'Signature API expirée',
        severity: 'warning'
      });

      logger.warn(`[API] Tentative d'accès avec une signature expirée: ${req.originalUrl}`);
      return errorService.sendErrorResponse(res, error);
    }

    // Récupérer la clé secrète associée à la clé API
    const apiClient = await ApiClient.findOne({ apiKey });

    if (!apiClient) {
      const error = errorService.createError({
        type: 'api_key_invalid',
        message: 'Clé API invalide',
        severity: 'warning'
      });

      logger.warn(`[API] Tentative d'accès avec une clé API invalide: ${apiKey}`);
      return errorService.sendErrorResponse(res, error);
    }

    // Construire la chaîne à signer
    const method = req.method.toUpperCase();
    const path = req.originalUrl.split('?')[0];
    const queryString = req.originalUrl.includes('?') ? req.originalUrl.split('?')[1] : '';
    const body = JSON.stringify(req.body) || '';

    const stringToSign = `${method}:${path}:${queryString}:${body}:${timestamp}:${apiKey}`;

    // Calculer la signature HMAC
    const hmac = crypto.createHmac('sha256', apiClient.secretKey);
    hmac.update(stringToSign);
    const expectedSignature = hmac.digest('hex');

    // Vérifier que la signature correspond
    if (signature !== expectedSignature) {
      const error = errorService.createError({
        type: 'api_signature_invalid',
        message: 'Signature API invalide',
        severity: 'warning'
      });

      logger.warn(`[API] Tentative d'accès avec une signature invalide: ${apiKey}`);
      return errorService.sendErrorResponse(res, error);
    }

    // Signature valide, ajouter les informations du client API à la requête
    req.apiClient = apiClient;

    // Consigner l'accès API
    logger.info(`[API] Accès API authentifié pour ${apiClient.name}: ${req.originalUrl}`);

    // Continuer le traitement de la requête
    next();
  } catch (error) {
    const middlewareError = errorService.createError({
      type: 'api_auth_failure',
      message: 'Erreur lors de la vérification de la signature API',
      severity: 'error',
      details: {
        originalError: error.message
      }
    });

    logger.error(`[API] Erreur dans la vérification de signature: ${error.message}`);
    return errorService.sendErrorResponse(res, middlewareError);
  }
};
