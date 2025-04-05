/**
 * Middleware d'authentification et d'autorisation
 * Fournit des fonctions pour vérifier l'authentification et les rôles utilisateur
 */

const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');
const config = require('../config/api.config');

/**
 * Vérifie si l'utilisateur est authentifié
 * @returns {Function} Middleware Express
 */
const isAuthenticated = (req, res, next) => {
  try {
    // Récupérer le token depuis les headers, les cookies ou le corps de la requête
    const token = req.headers.authorization?.split(' ')[1] || 
                  req.cookies?.token || 
                  req.body?.token;
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentification requise'
      });
    }
    
    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || config.server.sessionSecret);
    
    // Ajouter les informations utilisateur à la requête
    req.user = decoded;
    
    next();
  } catch (error) {
    logger.warn(`Tentative d'accès non autorisé: ${error.message}`);
    
    return res.status(401).json({
      status: 'error',
      message: 'Token invalide ou expiré'
    });
  }
};

/**
 * Vérifie si l'utilisateur a un rôle d'administrateur
 * @returns {Function} Middleware Express
 */
const isAdmin = (req, res, next) => {
  // Vérifier d'abord que l'utilisateur est authentifié
  isAuthenticated(req, res, () => {
    // Vérifier le rôle
    if (req.user && (req.user.role === 'admin' || req.user.isAdmin)) {
      next();
    } else {
      logger.warn(`Tentative d'accès administrateur refusée pour l'utilisateur ${req.user?.id || 'inconnu'}`);
      
      return res.status(403).json({
        status: 'error',
        message: 'Accès refusé: droits d\'administrateur requis'
      });
    }
  });
};

/**
 * Vérifie si l'utilisateur a un rôle spécifique
 * @param {Array<string>} roles Rôles autorisés
 * @returns {Function} Middleware Express
 */
const hasRole = (roles) => {
  return (req, res, next) => {
    // Vérifier d'abord que l'utilisateur est authentifié
    isAuthenticated(req, res, () => {
      // Vérifier le rôle
      if (req.user && roles.includes(req.user.role)) {
        next();
      } else {
        logger.warn(`Tentative d'accès refusée pour l'utilisateur ${req.user?.id || 'inconnu'}, rôle requis: ${roles.join(', ')}`);
        
        return res.status(403).json({
          status: 'error',
          message: `Accès refusé: rôle requis (${roles.join(', ')})`
        });
      }
    });
  };
};

module.exports = {
  isAuthenticated,
  isAdmin,
  hasRole
};
