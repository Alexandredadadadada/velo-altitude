/**
 * Utilitaire pour gérer les feature flags liés au système de gestion d'erreurs
 * Permet d'activer/désactiver certaines fonctionnalités de gestion d'erreurs en fonction de l'environnement
 */

import { getFeatureFlag } from './FeatureFlagsService';

// Noms des feature flags liés à la gestion d'erreurs
export const ERROR_FEATURE_FLAGS = {
  // Activer/désactiver la télémétrie des erreurs
  ENABLE_ERROR_TELEMETRY: 'enable_error_telemetry',
  
  // Activer/désactiver les retry automatiques pour les erreurs réseau
  ENABLE_AUTO_RETRY: 'enable_auto_retry',
  
  // Activer/désactiver les messages d'erreur détaillés
  SHOW_DETAILED_ERRORS: 'show_detailed_errors',
  
  // Activer/désactiver la page de démonstration des erreurs
  ENABLE_ERROR_DEMO_PAGE: 'enable_error_demo_page',
  
  // Activer/désactiver le logging des erreurs non critiques
  LOG_NON_CRITICAL_ERRORS: 'log_non_critical_errors',
  
  // Niveau de verbosité des erreurs (0-3)
  ERROR_VERBOSITY_LEVEL: 'error_verbosity_level'
};

/**
 * Vérifie si une fonctionnalité de gestion d'erreurs est activée
 * @param {string} flagName - Nom du feature flag à vérifier
 * @param {boolean} defaultValue - Valeur par défaut si le flag n'est pas défini
 * @returns {boolean} - True si la fonctionnalité est activée, false sinon
 */
export const isErrorFeatureEnabled = (flagName, defaultValue = false) => {
  return getFeatureFlag(flagName, defaultValue);
};

/**
 * Récupère la valeur d'un feature flag lié à la gestion d'erreurs
 * @param {string} flagName - Nom du feature flag à récupérer
 * @param {any} defaultValue - Valeur par défaut si le flag n'est pas défini
 * @returns {any} - Valeur du feature flag
 */
export const getErrorFeatureValue = (flagName, defaultValue) => {
  return getFeatureFlag(flagName, defaultValue);
};

/**
 * Détermine si la page de démonstration des erreurs doit être accessible
 * @returns {boolean} - True si la page doit être accessible, false sinon
 */
export const isErrorDemoPageEnabled = () => {
  // En développement, toujours activer la page de démo
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // En production, vérifier le feature flag
  return isErrorFeatureEnabled(ERROR_FEATURE_FLAGS.ENABLE_ERROR_DEMO_PAGE, false);
};

/**
 * Détermine le niveau de détail des erreurs à afficher
 * @returns {Object} - Configuration du niveau de détail
 */
export const getErrorDetailLevel = () => {
  const isDev = process.env.NODE_ENV === 'development';
  const verbosityLevel = getErrorFeatureValue(ERROR_FEATURE_FLAGS.ERROR_VERBOSITY_LEVEL, isDev ? 3 : 1);
  
  return {
    // Afficher les messages d'erreur détaillés
    showDetailedMessages: verbosityLevel >= 2 || isDev,
    
    // Afficher les stack traces
    showStackTraces: verbosityLevel >= 3 || isDev,
    
    // Afficher les informations techniques
    showTechnicalInfo: verbosityLevel >= 2 || isDev,
    
    // Afficher les suggestions de résolution
    showResolutionHints: verbosityLevel >= 1
  };
};
