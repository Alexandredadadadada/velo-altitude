/**
 * Service de messages d'erreur personnalisés
 * Fournit des messages d'erreur clairs et utiles pour les scénarios courants
 */

import { getErrorDetailLevel } from '../utils/ErrorFeatureFlags';

// Catégories d'erreurs
export const ERROR_CATEGORIES = {
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  VALIDATION: 'validation',
  NETWORK: 'network',
  SERVER: 'server',
  CLIENT: 'client',
  DATA: 'data',
  UNKNOWN: 'unknown'
};

// Messages d'erreur par défaut par catégorie
const DEFAULT_ERROR_MESSAGES = {
  [ERROR_CATEGORIES.AUTHENTICATION]: {
    title: 'Problème d\'authentification',
    message: 'Impossible de vous authentifier. Veuillez vous reconnecter.',
    technicalMessage: 'Échec de l\'authentification: token invalide ou expiré',
    resolution: 'Essayez de vous déconnecter puis de vous reconnecter.'
  },
  [ERROR_CATEGORIES.AUTHORIZATION]: {
    title: 'Accès refusé',
    message: 'Vous n\'avez pas les droits nécessaires pour effectuer cette action.',
    technicalMessage: 'Autorisation insuffisante pour accéder à la ressource',
    resolution: 'Contactez un administrateur si vous pensez que c\'est une erreur.'
  },
  [ERROR_CATEGORIES.VALIDATION]: {
    title: 'Données invalides',
    message: 'Certaines informations saisies sont incorrectes ou incomplètes.',
    technicalMessage: 'Échec de validation des données d\'entrée',
    resolution: 'Vérifiez les champs marqués en rouge et corrigez les erreurs.'
  },
  [ERROR_CATEGORIES.NETWORK]: {
    title: 'Problème de connexion',
    message: 'Impossible de communiquer avec le serveur. Vérifiez votre connexion internet.',
    technicalMessage: 'Échec de la requête réseau',
    resolution: 'Vérifiez votre connexion internet et réessayez.'
  },
  [ERROR_CATEGORIES.SERVER]: {
    title: 'Erreur serveur',
    message: 'Le serveur a rencontré un problème. Nos équipes ont été notifiées.',
    technicalMessage: 'Erreur interne du serveur',
    resolution: 'Veuillez réessayer ultérieurement.'
  },
  [ERROR_CATEGORIES.CLIENT]: {
    title: 'Erreur application',
    message: 'L\'application a rencontré un problème inattendu.',
    technicalMessage: 'Exception non gérée côté client',
    resolution: 'Essayez de rafraîchir la page ou de redémarrer l\'application.'
  },
  [ERROR_CATEGORIES.DATA]: {
    title: 'Problème de données',
    message: 'Impossible de traiter les données demandées.',
    technicalMessage: 'Erreur lors du traitement ou de la récupération des données',
    resolution: 'Veuillez réessayer ou contacter le support si le problème persiste.'
  },
  [ERROR_CATEGORIES.UNKNOWN]: {
    title: 'Erreur inattendue',
    message: 'Une erreur inattendue s\'est produite.',
    technicalMessage: 'Erreur non catégorisée',
    resolution: 'Veuillez réessayer ou contacter le support si le problème persiste.'
  }
};

// Messages d'erreur spécifiques par code d'erreur
const SPECIFIC_ERROR_MESSAGES = {
  // Erreurs d'authentification
  'auth/invalid-credentials': {
    title: 'Identifiants incorrects',
    message: 'L\'email ou le mot de passe saisi est incorrect.',
    technicalMessage: 'Échec d\'authentification: identifiants invalides',
    resolution: 'Vérifiez vos identifiants ou utilisez la fonction "Mot de passe oublié".'
  },
  'auth/session-expired': {
    title: 'Session expirée',
    message: 'Votre session a expiré. Veuillez vous reconnecter.',
    technicalMessage: 'Token de session expiré',
    resolution: 'Reconnectez-vous pour continuer.'
  },
  
  // Erreurs réseau
  'network/timeout': {
    title: 'Délai d\'attente dépassé',
    message: 'La requête a pris trop de temps. Le serveur est peut-être surchargé.',
    technicalMessage: 'Timeout de la requête réseau',
    resolution: 'Veuillez réessayer ultérieurement.'
  },
  'network/offline': {
    title: 'Hors ligne',
    message: 'Vous êtes actuellement hors ligne. Vérifiez votre connexion internet.',
    technicalMessage: 'Appareil hors ligne',
    resolution: 'Connectez-vous à internet et réessayez.'
  },
  
  // Erreurs de validation
  'validation/required-fields': {
    title: 'Champs obligatoires',
    message: 'Veuillez remplir tous les champs obligatoires.',
    technicalMessage: 'Validation échouée: champs obligatoires manquants',
    resolution: 'Complétez les champs marqués comme obligatoires.'
  },
  'validation/invalid-format': {
    title: 'Format invalide',
    message: 'Certaines informations ne sont pas au format attendu.',
    technicalMessage: 'Validation échouée: format de données incorrect',
    resolution: 'Vérifiez le format des champs marqués en rouge.'
  },
  
  // Erreurs serveur
  'server/maintenance': {
    title: 'Maintenance en cours',
    message: 'Le service est actuellement en maintenance. Nous serons bientôt de retour.',
    technicalMessage: 'Serveur en maintenance',
    resolution: 'Veuillez réessayer plus tard.'
  },
  'server/overloaded': {
    title: 'Serveur surchargé',
    message: 'Nos serveurs sont actuellement très sollicités. Veuillez réessayer ultérieurement.',
    technicalMessage: 'Serveur surchargé, rate limiting actif',
    resolution: 'Réessayez dans quelques minutes.'
  },
  
  // Erreurs de données
  'data/not-found': {
    title: 'Données introuvables',
    message: 'Les informations demandées n\'ont pas été trouvées.',
    technicalMessage: 'Ressource non trouvée',
    resolution: 'Vérifiez les paramètres de votre recherche ou contactez le support.'
  },
  'data/stale': {
    title: 'Données obsolètes',
    message: 'Les données ont été modifiées par un autre utilisateur.',
    technicalMessage: 'Conflit de version des données',
    resolution: 'Rafraîchissez la page pour voir les dernières modifications.'
  }
};

/**
 * Détermine la catégorie d'une erreur en fonction de son type et de son code
 * @param {Error} error - L'erreur à analyser
 * @returns {string} - Catégorie de l'erreur
 */
export const categorizeError = (error) => {
  // Si l'erreur a un code spécifique, l'utiliser pour déterminer la catégorie
  if (error.code) {
    if (error.code.startsWith('auth/')) {
      return ERROR_CATEGORIES.AUTHENTICATION;
    }
    if (error.code.startsWith('permission-denied') || error.code.startsWith('forbidden')) {
      return ERROR_CATEGORIES.AUTHORIZATION;
    }
    if (error.code.startsWith('validation/')) {
      return ERROR_CATEGORIES.VALIDATION;
    }
    if (error.code.startsWith('network/')) {
      return ERROR_CATEGORIES.NETWORK;
    }
    if (error.code.startsWith('server/')) {
      return ERROR_CATEGORIES.SERVER;
    }
    if (error.code.startsWith('client/')) {
      return ERROR_CATEGORIES.CLIENT;
    }
    if (error.code.startsWith('data/')) {
      return ERROR_CATEGORIES.DATA;
    }
  }
  
  // Si l'erreur est une erreur Axios, utiliser le code de statut HTTP
  if (error.isAxiosError && error.response) {
    const status = error.response.status;
    
    if (status === 401 || status === 403) {
      return status === 401 ? ERROR_CATEGORIES.AUTHENTICATION : ERROR_CATEGORIES.AUTHORIZATION;
    }
    
    if (status === 400 || status === 422) {
      return ERROR_CATEGORIES.VALIDATION;
    }
    
    if (status >= 500) {
      return ERROR_CATEGORIES.SERVER;
    }
    
    if (status === 404 || status === 410) {
      return ERROR_CATEGORIES.DATA;
    }
  }
  
  // Si l'erreur est une erreur réseau
  if (error.name === 'NetworkError' || 
      (error.isAxiosError && !error.response) ||
      error.message.includes('network') ||
      error.message.includes('connection')) {
    return ERROR_CATEGORIES.NETWORK;
  }
  
  // Si l'erreur est une erreur de validation
  if (error.name === 'ValidationError' || 
      error.message.includes('validation') ||
      error.message.includes('invalid')) {
    return ERROR_CATEGORIES.VALIDATION;
  }
  
  // Par défaut, considérer comme une erreur client
  return ERROR_CATEGORIES.CLIENT;
};

/**
 * Génère un message d'erreur personnalisé en fonction de l'erreur
 * @param {Error} error - L'erreur à analyser
 * @param {Object} options - Options supplémentaires
 * @returns {Object} - Message d'erreur personnalisé
 */
export const getErrorMessage = (error, options = {}) => {
  const { showTechnical = false } = options;
  const errorDetailLevel = getErrorDetailLevel();
  
  // Déterminer le code d'erreur
  const errorCode = error.code || (error.response?.data?.code) || null;
  
  // Chercher un message spécifique pour ce code d'erreur
  let errorMessage = errorCode && SPECIFIC_ERROR_MESSAGES[errorCode];
  
  // Si pas de message spécifique, utiliser la catégorie
  if (!errorMessage) {
    const category = categorizeError(error);
    errorMessage = DEFAULT_ERROR_MESSAGES[category];
  }
  
  // Construire le message final
  return {
    title: errorMessage.title,
    message: errorMessage.message,
    technicalMessage: errorDetailLevel.showTechnicalInfo || showTechnical 
      ? (error.message || errorMessage.technicalMessage) 
      : null,
    resolution: errorDetailLevel.showResolutionHints 
      ? errorMessage.resolution 
      : null,
    stack: errorDetailLevel.showStackTraces ? error.stack : null,
    category: categorizeError(error),
    code: errorCode
  };
};

/**
 * Service singleton pour les messages d'erreur
 */
const ErrorMessagesService = {
  /**
   * Récupère un message d'erreur personnalisé
   * @param {Error|string} error - L'erreur ou le code d'erreur
   * @param {Object} options - Options supplémentaires
   * @returns {Object} - Message d'erreur personnalisé
   */
  getMessage(error, options = {}) {
    // Si c'est une chaîne, la considérer comme un code d'erreur
    if (typeof error === 'string') {
      const errorObj = new Error('Error with code: ' + error);
      errorObj.code = error;
      return getErrorMessage(errorObj, options);
    }
    
    // Sinon, traiter comme une erreur
    return getErrorMessage(error, options);
  },
  
  /**
   * Récupère tous les messages d'erreur disponibles
   * @returns {Object} - Tous les messages d'erreur
   */
  getAllMessages() {
    return {
      defaultMessages: DEFAULT_ERROR_MESSAGES,
      specificMessages: SPECIFIC_ERROR_MESSAGES
    };
  },
  
  /**
   * Ajoute ou met à jour un message d'erreur personnalisé
   * @param {string} errorCode - Code de l'erreur
   * @param {Object} message - Message d'erreur
   */
  setCustomMessage(errorCode, message) {
    SPECIFIC_ERROR_MESSAGES[errorCode] = {
      ...SPECIFIC_ERROR_MESSAGES[errorCode],
      ...message
    };
  }
};

export default ErrorMessagesService;
