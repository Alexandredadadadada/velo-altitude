import { useState, useCallback } from 'react';
import notificationService from '../services/notification/notificationService';

/**
 * Hook pour gérer les erreurs asynchrones dans les composants fonctionnels
 * 
 * Les ErrorBoundary de React ne capturent que les erreurs survenant pendant le rendu,
 * pas les erreurs asynchrones (comme celles des appels API, setTimeout, etc.)
 * Ce hook permet de gérer ces erreurs de manière unifiée.
 * 
 * @param {Object} options - Options de configuration
 * @param {string} options.moduleName - Nom du module pour l'identification
 * @param {Function} options.onError - Callback personnalisé lors d'une erreur
 * @param {boolean} options.silent - Ne pas afficher de notification d'erreur
 * @param {Object} options.fallback - Valeur de remplacement à utiliser en cas d'erreur
 * @returns {Object} - Utilitaires de gestion d'erreur
 */
const useAsyncError = (options = {}) => {
  const {
    moduleName = 'Composant',
    onError,
    silent = false,
    fallback
  } = options;
  
  // État pour tracker si une erreur s'est produite
  const [error, setError] = useState(null);
  const [isRecovering, setIsRecovering] = useState(false);
  
  /**
   * Wrapper pour les fonctions asynchrones à protéger contre les erreurs
   * @param {Function} asyncFn - Fonction asynchrone à exécuter
   * @param {Object} errorOptions - Options spécifiques à cette exécution
   * @returns {Promise} - Résultat de la fonction ou valeur de fallback
   */
  const safeAsync = useCallback(async (asyncFn, errorOptions = {}) => {
    try {
      // Réinitialiser l'état d'erreur avant chaque nouvelle tentative
      if (error) {
        setError(null);
      }
      
      // Exécuter la fonction asynchrone
      return await asyncFn();
    } catch (caughtError) {
      // Enregistrer l'erreur
      setError(caughtError);
      
      // Journalisation
      console.error(`[${moduleName}] Erreur asynchrone:`, caughtError);
      
      // Callback personnalisé si fourni
      if (typeof onError === 'function') {
        onError(caughtError);
      }
      
      // Callback spécifique à cette exécution si fourni
      if (typeof errorOptions.onError === 'function') {
        errorOptions.onError(caughtError);
      }
      
      // Notification à l'utilisateur (sauf si mode silencieux)
      if (!silent && !errorOptions.silent) {
        const notificationTitle = errorOptions.title || 'Erreur technique';
        const notificationMessage = errorOptions.message || 
          `Une erreur s'est produite lors d'une opération dans ${moduleName}`;
        
        notificationService.error(notificationMessage, {
          title: notificationTitle,
          action: errorOptions.retryLabel || 'Réessayer',
          onAction: () => {
            setIsRecovering(true);
            
            // Tentative de réexécution si une fonction de retry est fournie
            if (typeof errorOptions.onRetry === 'function') {
              Promise.resolve(errorOptions.onRetry())
                .finally(() => {
                  setIsRecovering(false);
                });
            } else {
              setIsRecovering(false);
            }
          }
        });
      }
      
      // Retourner la valeur de fallback si fournie
      const fallbackValue = errorOptions.fallback !== undefined ? 
        errorOptions.fallback : fallback;
      
      return fallbackValue;
    }
  }, [error, moduleName, onError, silent, fallback]);
  
  /**
   * Version simplifiée pour wrapper une fonction sans l'appeler immédiatement
   * @param {Function} fn - Fonction à protéger
   * @param {Object} errorOptions - Options spécifiques
   * @returns {Function} - Fonction protégée contre les erreurs
   */
  const wrapAsync = useCallback((fn, errorOptions = {}) => {
    return async (...args) => {
      return safeAsync(() => fn(...args), errorOptions);
    };
  }, [safeAsync]);
  
  /**
   * Réinitialise manuellement l'état d'erreur
   */
  const resetError = useCallback(() => {
    setError(null);
  }, []);
  
  return {
    error,
    isRecovering,
    safeAsync,
    wrapAsync,
    resetError
  };
};

export default useAsyncError;
