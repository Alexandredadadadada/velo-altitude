/**
 * Middleware de rotation des JWT
 * Implémente une stratégie de rotation automatique des tokens pour renforcer la sécurité
 */

const jwt = require('jsonwebtoken');
const { authCluster } = require('../config/redis-cluster');
const logger = require('../utils/logger');
const crypto = require('crypto');

// Configuration des délais
const JWT_CONFIG = {
  ACCESS_TOKEN_LIFETIME: process.env.ACCESS_TOKEN_LIFETIME || '15m',
  REFRESH_TOKEN_LIFETIME: process.env.REFRESH_TOKEN_LIFETIME || '7d',
  ROTATION_WINDOW: process.env.JWT_ROTATION_WINDOW || '5m', // Fenêtre de rotation préventive
  BLACKLIST_GRACE_PERIOD: 60 * 10, // 10 minutes de grâce pour les tokens en rotation
  SIGNING_ALGORITHM: 'HS256'
};

// Clé secrète pour la signature des tokens
const JWT_SECRET = process.env.JWT_SECRET || 'dashboard-velo-jwt-secret-key';
// Clé secrète secondaire pour la rotation
const JWT_ROTATION_SECRET = process.env.JWT_ROTATION_SECRET || 'dashboard-velo-rotation-key';

/**
 * Génère un token d'accès JWT
 * @param {Object} user - Données utilisateur à inclure dans le token
 * @param {string} jti - ID unique du token
 * @param {string} secret - Clé secrète à utiliser (principale ou rotation)
 * @returns {string} - Token JWT généré
 */
function generateAccessToken(user, jti, secret = JWT_SECRET) {
  const payload = {
    sub: user.id,
    email: user.email,
    roles: user.roles || ['user'],
    jti // JWT ID unique
  };

  return jwt.sign(payload, secret, {
    expiresIn: JWT_CONFIG.ACCESS_TOKEN_LIFETIME,
    algorithm: JWT_CONFIG.SIGNING_ALGORITHM
  });
}

/**
 * Génère un token de rafraîchissement
 * @param {Object} user - Données utilisateur
 * @param {string} jti - ID unique du token
 * @returns {string} - Token de rafraîchissement
 */
function generateRefreshToken(user, jti) {
  const payload = {
    sub: user.id,
    jti, // Même JTI que l'access token associé
    type: 'refresh'
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_CONFIG.REFRESH_TOKEN_LIFETIME,
    algorithm: JWT_CONFIG.SIGNING_ALGORITHM
  });
}

/**
 * Génère une paire de tokens (accès + rafraîchissement)
 * @param {Object} user - Données utilisateur
 * @returns {Object} - Paire de tokens
 */
async function generateTokenPair(user) {
  // Générer un identifiant unique pour cette paire de tokens
  const jti = crypto.randomUUID();
  
  // Générer les tokens
  const accessToken = generateAccessToken(user, jti);
  const refreshToken = generateRefreshToken(user, jti);
  
  // Enregistrer le jti dans Redis pour le tracking
  await authCluster.setex(
    `jwt:valid:${jti}`, 
    getExpirationSeconds(JWT_CONFIG.REFRESH_TOKEN_LIFETIME),
    JSON.stringify({
      userId: user.id,
      createdAt: Date.now()
    })
  );
  
  return {
    accessToken,
    refreshToken,
    expiresIn: getExpirationSeconds(JWT_CONFIG.ACCESS_TOKEN_LIFETIME)
  };
}

/**
 * Rafraîchit un token d'accès expiré en utilisant un token de rafraîchissement
 * @param {string} refreshToken - Token de rafraîchissement
 * @returns {Promise<Object>} - Nouvelles paires de tokens
 */
async function refreshTokens(refreshToken) {
  try {
    // Vérifier le token de rafraîchissement
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    
    // Vérifier si le token est dans la liste noire
    const isBlacklisted = await authCluster.exists(`jwt:blacklist:${decoded.jti}`);
    if (isBlacklisted) {
      logger.warn(`Tentative d'utilisation d'un refresh token blacklisté`, {
        service: 'jwtRotation',
        jti: decoded.jti
      });
      throw new Error('Token has been revoked');
    }
    
    // Vérifier si le token est valide dans notre registre
    const tokenData = await authCluster.get(`jwt:valid:${decoded.jti}`);
    if (!tokenData) {
      logger.warn(`Tentative d'utilisation d'un refresh token non enregistré`, {
        service: 'jwtRotation',
        jti: decoded.jti
      });
      throw new Error('Token is not recognized');
    }
    
    const { userId } = JSON.parse(tokenData);
    
    // Récupérer les informations utilisateur depuis la base de données
    // (Dans un cas réel, vous feriez un appel à votre modèle User ici)
    const user = await getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Révoquer l'ancien token
    await revokeToken(decoded.jti);
    
    // Générer une nouvelle paire de tokens
    return await generateTokenPair(user);
  } catch (error) {
    logger.error(`Erreur lors du rafraîchissement du token: ${error.message}`, {
      service: 'jwtRotation',
      stack: error.stack
    });
    throw error;
  }
}

/**
 * Révoque un token en l'ajoutant à la liste noire
 * @param {string} jti - Identifiant unique du token
 * @returns {Promise<boolean>} - Succès de l'opération
 */
async function revokeToken(jti) {
  try {
    // Récupérer les données du token
    const tokenData = await authCluster.get(`jwt:valid:${decoded.jti}`);
    if (!tokenData) {
      return false;
    }
    
    const data = JSON.parse(tokenData);
    
    // Calculer la durée restante du token
    const now = Date.now();
    const createdAt = data.createdAt;
    const refreshExpiry = getExpirationSeconds(JWT_CONFIG.REFRESH_TOKEN_LIFETIME) * 1000;
    const timeRemaining = Math.max(0, (createdAt + refreshExpiry) - now) / 1000;
    
    // Ajouter à la liste noire pour la durée restante + grace period
    await authCluster.setex(
      `jwt:blacklist:${jti}`,
      Math.ceil(timeRemaining + JWT_CONFIG.BLACKLIST_GRACE_PERIOD),
      '1'
    );
    
    // Supprimer de la liste des tokens valides
    await authCluster.del(`jwt:valid:${jti}`);
    
    logger.info(`Token révoqué avec succès`, {
      service: 'jwtRotation',
      jti
    });
    
    return true;
  } catch (error) {
    logger.error(`Erreur lors de la révocation du token: ${error.message}`, {
      service: 'jwtRotation',
      jti,
      stack: error.stack
    });
    return false;
  }
}

/**
 * Middleware pour vérifier et faire la rotation des JWT
 * Automatiquement rafraîchit les tokens proches de l'expiration
 */
function jwtRotationMiddleware(req, res, next) {
  // Récupérer le token depuis les headers
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Première tentative avec la clé primaire
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (primaryError) {
      // Si la vérification échoue avec la clé primaire, essayer avec la clé de rotation
      try {
        decoded = jwt.verify(token, JWT_ROTATION_SECRET);
      } catch (rotationError) {
        // Si les deux échouent, le token est invalide
        throw primaryError;
      }
    }
    
    // Vérifier si le token est blacklisté
    authCluster.exists(`jwt:blacklist:${decoded.jti}`)
      .then(isBlacklisted => {
        if (isBlacklisted) {
          logger.warn(`Tentative d'utilisation d'un token blacklisté`, {
            service: 'jwtRotationMiddleware',
            jti: decoded.jti
          });
          return res.status(401).json({ message: 'Token révoqué, veuillez vous reconnecter.' });
        }
        
        // Attacher les informations utilisateur à la requête
        req.user = {
          id: decoded.sub,
          email: decoded.email,
          roles: decoded.roles
        };
        
        // Vérifier si le token est proche de l'expiration
        const expirationTime = decoded.exp * 1000; // Convertir en millisecondes
        const currentTime = Date.now();
        const timeToExpiration = expirationTime - currentTime;
        
        // Calculer le seuil de rotation (en ms)
        const rotationThreshold = parseTimeToMs(JWT_CONFIG.ROTATION_WINDOW);
        
        // Si le token expire bientôt, générer un nouveau token
        if (timeToExpiration < rotationThreshold) {
          // Récupérer les infos utilisateur
          getUserById(decoded.sub)
            .then(user => {
              if (!user) {
                return next();
              }
              
              // Générer un nouveau jti pour le token en rotation
              const newJti = crypto.randomUUID();
              
              // Générer un nouveau token
              const newToken = generateAccessToken(user, newJti);
              
              // Enregistrer le nouveau jti
              authCluster.setex(
                `jwt:valid:${newJti}`,
                getExpirationSeconds(JWT_CONFIG.ACCESS_TOKEN_LIFETIME),
                JSON.stringify({
                  userId: user.id,
                  createdAt: Date.now(),
                  rotatedFrom: decoded.jti
                })
              );
              
              // Ajouter l'en-tête pour la rotation du token
              res.setHeader('X-New-Access-Token', newToken);
              res.setHeader('Access-Control-Expose-Headers', 'X-New-Access-Token');
              
              logger.debug(`Token en rotation généré pour l'utilisateur ${user.id}`, {
                service: 'jwtRotationMiddleware',
                timeToExpiration: Math.floor(timeToExpiration / 1000)
              });
              
              next();
            })
            .catch(error => {
              logger.error(`Erreur lors de la rotation du token: ${error.message}`, {
                service: 'jwtRotationMiddleware',
                stack: error.stack
              });
              next();
            });
        } else {
          next();
        }
      })
      .catch(error => {
        logger.error(`Erreur lors de la vérification de la liste noire: ${error.message}`, {
          service: 'jwtRotationMiddleware',
          stack: error.stack
        });
        next();
      });
  } catch (error) {
    // Ne pas renvoyer d'erreur, juste passer à la suite
    // Le middleware d'authentification standard gérera l'erreur
    next();
  }
}

/**
 * Middleware pour l'authentification JWT standard
 * À utiliser après le middleware de rotation
 */
function jwtAuthMiddleware(req, res, next) {
  // Vérifier si l'utilisateur a déjà été authentifié par le middleware de rotation
  if (req.user) {
    return next();
  }
  
  // Récupérer le token depuis les headers
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentification requise' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Vérifier le token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (primaryError) {
      try {
        decoded = jwt.verify(token, JWT_ROTATION_SECRET);
      } catch (rotationError) {
        throw primaryError;
      }
    }
    
    // Vérifier si le token est blacklisté
    authCluster.exists(`jwt:blacklist:${decoded.jti}`)
      .then(isBlacklisted => {
        if (isBlacklisted) {
          return res.status(401).json({ message: 'Token révoqué, veuillez vous reconnecter.' });
        }
        
        // Attacher les informations utilisateur à la requête
        req.user = {
          id: decoded.sub,
          email: decoded.email,
          roles: decoded.roles
        };
        
        next();
      })
      .catch(error => {
        logger.error(`Erreur lors de la vérification de la liste noire: ${error.message}`, {
          service: 'jwtAuthMiddleware',
          stack: error.stack
        });
        res.status(500).json({ message: 'Erreur serveur lors de l\'authentification' });
      });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expiré', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ message: 'Token invalide' });
  }
}

/**
 * Fonction utilitaire pour récupérer les informations d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Object>} - Données utilisateur
 */
async function getUserById(userId) {
  // Dans un cas réel, vous feriez un appel à votre modèle User ici
  // Simulation pour les besoins de l'exemple
  const User = require('../models/User');
  return await User.findById(userId);
}

/**
 * Conversion d'une chaîne de temps (ex: '15m', '7d') en secondes
 * @param {string} timeString - Chaîne de temps à convertir
 * @returns {number} - Nombre de secondes
 */
function getExpirationSeconds(timeString) {
  const time = parseInt(timeString);
  const unit = timeString.slice(-1);
  
  switch (unit) {
    case 's':
      return time;
    case 'm':
      return time * 60;
    case 'h':
      return time * 60 * 60;
    case 'd':
      return time * 60 * 60 * 24;
    default:
      return time;
  }
}

/**
 * Conversion d'une chaîne de temps en millisecondes
 * @param {string} timeString - Chaîne de temps
 * @returns {number} - Millisecondes
 */
function parseTimeToMs(timeString) {
  return getExpirationSeconds(timeString) * 1000;
}

module.exports = {
  generateTokenPair,
  refreshTokens,
  revokeToken,
  jwtRotationMiddleware,
  jwtAuthMiddleware
};
