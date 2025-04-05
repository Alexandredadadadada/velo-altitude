/**
 * Hook personnalisé pour la gestion des erreurs
 * Ce hook combine le service d'erreur et le système de notification
 * pour fournir une gestion cohérente des erreurs dans les composants
 */

import { useEffect, useCallback } from 'react';
import { useNotification } from '../components/common/NotificationSystem';
import errorService from '../services/errorService';

/**
 * Hook pour la gestion des erreurs
 * @returns {Object} Fonctions et utilitaires pour la gestion des erreurs
 */
const useErrorHandler = () => {
  const { notify } = useNotification();
  
  // Initialiser le service d'erreur avec le système de notification
  useEffect(() => {
    errorService.init(notify);
  }, [notify]);
  
  /**
   * Fonction pour gérer les erreurs d'API de manière asynchrone
   * @param {Promise} promise - La promesse à exécuter
   * @param {Object} options - Options de gestion d'erreur
   * @returns {Promise} La promesse avec gestion d'erreur
   */
  const handleApiRequest = useCallback(async (promise, options = {}) => {
    const {
      successMessage,
      loadingMessage,
      errorMessage = 'Une erreur est survenue',
      showSuccess = false,
      showLoading = false,
      onSuccess,
      onError
    } = options;
    
    let loadingId;
    
    try {
      // Afficher un message de chargement si demandé
      if (showLoading && loadingMessage) {
        loadingId = notify.info(loadingMessage, { 
          title: 'Chargement', 
          duration: 0 // Pas de fermeture automatique
        });
      }
      
      // Exécuter la promesse
      const result = await promise;
      
      // Supprimer le message de chargement
      if (loadingId) {
        errorService.notifyFn.removeNotification(loadingId);
      }
      
      // Afficher un message de succès si demandé
      if (showSuccess && successMessage) {
        notify.success(successMessage);
      }
      
      // Exécuter le callback de succès si fourni
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (error) {
      // Supprimer le message de chargement
      if (loadingId) {
        errorService.notifyFn.removeNotification(loadingId);
      }
      
      // Utiliser le message d'erreur personnalisé si fourni
      if (errorMessage) {
        errorService.handleError(
          errorMessage, 
          error.response?.data?.error?.type || 'default',
          { details: error.message }
        );
      }
      
      // Exécuter le callback d'erreur si fourni
      if (onError) {
        onError(error);
      }
      
      throw error;
    }
  }, [notify]);
  
  /**
   * Fonction pour gérer les erreurs de manière synchrone (try/catch)
   * @param {Function} fn - La fonction à exécuter
   * @param {Object} options - Options de gestion d'erreur
   * @returns {any} Le résultat de la fonction ou null en cas d'erreur
   */
  const tryCatch = useCallback((fn, options = {}) => {
    const {
      errorMessage = 'Une erreur est survenue',
      showError = true,
      fallbackValue = null,
      onError
    } = options;
    
    try {
      return fn();
    } catch (error) {
      if (showError) {
        errorService.handleError(
          errorMessage, 
          'default',
          { details: error.message }
        );
      }
      
      if (onError) {
        onError(error);
      }
      
      return fallbackValue;
    }
  }, []);
  
  /**
   * Fonction pour gérer les erreurs de formulaire
   * @param {Object} error - L'erreur de validation du formulaire
   * @param {Function} setError - Fonction pour définir les erreurs dans le formulaire
   */
  const handleFormError = useCallback((error, setError) => {
    // Gérer les erreurs de validation du backend
    if (error.response?.data?.error?.validationErrors) {
      const { validationErrors } = error.response.data.error;
      
      // Définir les erreurs dans le formulaire
      Object.entries(validationErrors).forEach(([field, message]) => {
        setError(field, {
          type: 'manual',
          message
        });
      });
      
      // Afficher un message d'erreur général
      errorService.handleError(
        'Veuillez corriger les erreurs dans le formulaire',
        'validation_error'
      );
    } else {
      // Gérer les autres types d'erreurs
      errorService.handleApiError(error);
    }
  }, []);
  
  return {
    handleApiRequest,
    tryCatch,
    handleFormError,
    handleError: errorService.handleError.bind(errorService),
    getErrorStats: errorService.getErrorStats.bind(errorService)
  };
};

export default useErrorHandler;
