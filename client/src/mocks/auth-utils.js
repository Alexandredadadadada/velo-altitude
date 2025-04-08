/**
 * Utilitaires d'authentification pour MSW
 * 
 * Ce fichier fournit des utilitaires pour simuler l'authentification
 * dans les handlers MSW. Il permet de gérer les tokens, vérifier 
 * l'autorisation, et générer des réponses d'erreur cohérentes.
 */

// Store pour les tokens d'authentification
export const tokenStore = {
  tokens: new Map(),
  
  // Enregistrer un token pour un utilisateur
  setToken(userId, token, expiry = 3600000) {
    this.tokens.set(userId, {
      token,
      expiry: Date.now() + expiry
    });
    return token;
  },
  
  // Vérifier si un token est valide
  isValid(userId, token) {
    const userToken = this.tokens.get(userId);
    return userToken && 
           userToken.token === token && 
           userToken.expiry > Date.now();
  },
  
  // Invalider un token
  invalidate(userId) {
    this.tokens.delete(userId);
    return true;
  },
  
  // Générer un nouveau token
  generateToken(userId, type = 'access') {
    // Simuler un JWT avec un préfixe et l'ID utilisateur
    const prefix = type === 'refresh' ? 'mock-refresh-' : 'mock-jwt-';
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `${prefix}${randomPart}-${userId}`;
  },
  
  // Extraire l'ID utilisateur d'un token
  extractUserId(token) {
    if (!token) return null;
    const parts = token.split('-');
    return parts[parts.length - 1];
  }
};

// Constantes pour les erreurs d'authentification
export const AUTH_ERROR = {
  UNAUTHORIZED: { status: 401, message: 'Non authentifié', code: 'AUTH_REQUIRED' },
  FORBIDDEN: { status: 403, message: 'Accès non autorisé', code: 'ACCESS_DENIED' },
  TOKEN_EXPIRED: { status: 401, message: 'Token expiré', code: 'TOKEN_EXPIRED' },
  INVALID_CREDENTIALS: { status: 401, message: 'Identifiants invalides', code: 'INVALID_CREDENTIALS' }
};

/**
 * Valide l'authentification à partir de l'en-tête d'autorisation
 * 
 * @param {Object} req - Requête HTTP
 * @returns {Object} Résultat de validation avec isValid et userId ou error
 */
export const validateAuth = (req) => {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    return { isValid: false, error: AUTH_ERROR.UNAUTHORIZED };
  }
  
  const token = authHeader.replace('Bearer ', '');
  const userId = tokenStore.extractUserId(token);
  
  if (!userId || !tokenStore.isValid(userId, token)) {
    return { isValid: false, error: AUTH_ERROR.TOKEN_EXPIRED };
  }
  
  return { isValid: true, userId };
};

/**
 * Gère les erreurs de manière cohérente
 * 
 * @param {Object} res - Fonction de réponse MSW
 * @param {Object} ctx - Contexte MSW
 * @param {Object} error - Objet d'erreur avec status et message
 * @returns {Object} Réponse formatée
 */
export const handleError = (res, ctx, error) => {
  return res(
    ctx.status(error.status),
    ctx.json({
      message: error.message,
      code: error.code || 'ERROR',
      timestamp: new Date().toISOString()
    })
  );
};

/**
 * Vérifie si l'utilisateur est autorisé à accéder à une ressource
 * 
 * @param {Object} req - Requête HTTP
 * @param {string} resourceUserId - ID de l'utilisateur propriétaire de la ressource
 * @returns {Object} Résultat de validation
 */
export const authorizeResource = (req, resourceUserId) => {
  const auth = validateAuth(req);
  
  if (!auth.isValid) {
    return auth;
  }
  
  // Vérifier si l'utilisateur accède à ses propres ressources
  if (auth.userId !== resourceUserId) {
    return { isValid: false, error: AUTH_ERROR.FORBIDDEN };
  }
  
  return { isValid: true, userId: auth.userId };
};

export default {
  tokenStore,
  validateAuth,
  handleError,
  authorizeResource,
  AUTH_ERROR
};
