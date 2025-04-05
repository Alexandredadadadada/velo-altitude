/**
 * Service de gestion des feature flags
 * Permet d'activer/désactiver des fonctionnalités en fonction de l'environnement
 */

// Définition des environnements
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production'
};

// Récupérer l'environnement actuel
const getCurrentEnvironment = () => {
  return process.env.NODE_ENV || ENVIRONMENTS.DEVELOPMENT;
};

// Configuration par défaut des feature flags
const DEFAULT_FLAGS = {
  // Flags généraux
  enable_dark_mode: true,
  enable_animations: true,
  
  // Flags liés aux erreurs (utilisés par ErrorFeatureFlags)
  enable_error_telemetry: getCurrentEnvironment() === ENVIRONMENTS.PRODUCTION,
  enable_auto_retry: true,
  show_detailed_errors: getCurrentEnvironment() !== ENVIRONMENTS.PRODUCTION,
  enable_error_demo_page: getCurrentEnvironment() !== ENVIRONMENTS.PRODUCTION,
  log_non_critical_errors: true,
  error_verbosity_level: getCurrentEnvironment() === ENVIRONMENTS.DEVELOPMENT ? 3 : 1,
  
  // Flags liés aux fonctionnalités
  enable_weather_widget: true,
  enable_strava_integration: true,
  enable_social_sharing: true,
  enable_offline_mode: true,
  
  // Flags liés aux performances
  enable_lazy_loading: true,
  enable_image_optimization: true,
  enable_code_splitting: true
};

// Stockage local des feature flags
let featureFlags = { ...DEFAULT_FLAGS };

// Charger les flags depuis le serveur ou le localStorage
const loadFeatureFlags = async () => {
  try {
    // En développement, essayer de charger depuis localStorage
    if (getCurrentEnvironment() === ENVIRONMENTS.DEVELOPMENT) {
      const storedFlags = localStorage.getItem('featureFlags');
      if (storedFlags) {
        featureFlags = { ...featureFlags, ...JSON.parse(storedFlags) };
      }
    }
    
    // En production/staging, charger depuis le serveur
    if (getCurrentEnvironment() !== ENVIRONMENTS.DEVELOPMENT) {
      const response = await fetch('/api/feature-flags');
      if (response.ok) {
        const serverFlags = await response.json();
        featureFlags = { ...featureFlags, ...serverFlags };
      }
    }
  } catch (error) {
    console.warn('Impossible de charger les feature flags:', error);
  }
};

// Initialiser le chargement des flags
loadFeatureFlags();

/**
 * Récupère la valeur d'un feature flag
 * @param {string} flagName - Nom du feature flag
 * @param {any} defaultValue - Valeur par défaut si le flag n'est pas défini
 * @returns {any} - Valeur du feature flag
 */
export const getFeatureFlag = (flagName, defaultValue) => {
  return flagName in featureFlags ? featureFlags[flagName] : defaultValue;
};

/**
 * Définit la valeur d'un feature flag (uniquement en développement)
 * @param {string} flagName - Nom du feature flag
 * @param {any} value - Nouvelle valeur
 * @returns {boolean} - True si le flag a été mis à jour, false sinon
 */
export const setFeatureFlag = (flagName, value) => {
  // Ne permettre la modification qu'en développement
  if (getCurrentEnvironment() !== ENVIRONMENTS.DEVELOPMENT) {
    console.warn('Les feature flags ne peuvent être modifiés qu\'en développement');
    return false;
  }
  
  featureFlags[flagName] = value;
  
  // Sauvegarder dans localStorage
  try {
    localStorage.setItem('featureFlags', JSON.stringify(featureFlags));
  } catch (error) {
    console.warn('Impossible de sauvegarder les feature flags:', error);
  }
  
  return true;
};

/**
 * Réinitialise tous les feature flags aux valeurs par défaut
 * @returns {boolean} - True si les flags ont été réinitialisés, false sinon
 */
export const resetFeatureFlags = () => {
  // Ne permettre la réinitialisation qu'en développement
  if (getCurrentEnvironment() !== ENVIRONMENTS.DEVELOPMENT) {
    console.warn('Les feature flags ne peuvent être réinitialisés qu\'en développement');
    return false;
  }
  
  featureFlags = { ...DEFAULT_FLAGS };
  
  // Supprimer du localStorage
  try {
    localStorage.removeItem('featureFlags');
  } catch (error) {
    console.warn('Impossible de supprimer les feature flags:', error);
  }
  
  return true;
};

/**
 * Récupère tous les feature flags
 * @returns {Object} - Tous les feature flags
 */
export const getAllFeatureFlags = () => {
  return { ...featureFlags };
};

export default {
  getFeatureFlag,
  setFeatureFlag,
  resetFeatureFlags,
  getAllFeatureFlags,
  getCurrentEnvironment
};
