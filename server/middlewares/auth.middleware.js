/**
 * Middleware d'authentification
 * Vérifie la validité des jetons JWT et gère l'autorisation des utilisateurs
 */

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Clé secrète pour la vérification des jetons JWT
// Dans un environnement de production, cette valeur devrait être stockée dans une variable d'environnement
const JWT_SECRET = process.env.JWT_SECRET || 'grand-est-cyclisme-secret-key';

/**
 * Valide le jeton JWT fourni dans l'en-tête d'autorisation
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction middleware suivante
 */
const validateToken = (req, res, next) => {
  // Récupérer le jeton depuis l'en-tête d'autorisation
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    logger.warn('[AuthMiddleware] Tentative d\'accès sans jeton d\'authentification');
    return res.status(401).json({ 
      status: 'error', 
      message: 'Authentification requise' 
    });
  }
  
  // Format attendu: "Bearer [token]"
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    logger.warn('[AuthMiddleware] Format de jeton invalide');
    return res.status(401).json({ 
      status: 'error', 
      message: 'Format d\'authentification invalide' 
    });
  }
  
  const token = parts[1];
  
  try {
    // Vérifier et décoder le jeton
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Ajouter les informations utilisateur à l'objet de requête
    req.user = decoded;
    
    // Vérifier si le paramètre userId correspond à l'utilisateur authentifié
    if (req.params.userId && req.params.userId !== decoded.userId && !decoded.isAdmin) {
      logger.warn(`[AuthMiddleware] Tentative d'accès non autorisé: Token utilisateur ${decoded.userId} tente d'accéder aux données de l'utilisateur ${req.params.userId}`);
      return res.status(403).json({ 
        status: 'error', 
        message: 'Accès non autorisé' 
      });
    }
    
    logger.debug(`[AuthMiddleware] Utilisateur ${decoded.userId} authentifié avec succès`);
    next();
  } catch (error) {
    logger.error(`[AuthMiddleware] Erreur de vérification du jeton: ${error.message}`);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        status: 'error', 
        message: 'Jeton expiré' 
      });
    }
    
    return res.status(401).json({ 
      status: 'error', 
      message: 'Jeton invalide' 
    });
  }
};

/**
 * Vérifie si l'utilisateur possède des privilèges d'administrateur
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction middleware suivante
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    logger.warn(`[AuthMiddleware] Tentative d'accès à une route admin par l'utilisateur ${req.user ? req.user.userId : 'inconnu'}`);
    return res.status(403).json({ 
      status: 'error', 
      message: 'Accès réservé aux administrateurs' 
    });
  }
  
  logger.debug(`[AuthMiddleware] Accès admin autorisé pour l'utilisateur ${req.user.userId}`);
  next();
};

module.exports = {
  validateToken,
  requireAdmin
};
