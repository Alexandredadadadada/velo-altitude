/**
 * Utilitaires pour les mises à jour optimistes avec React Query
 * 
 * Ce fichier fournit des fonctions utilitaires pour faciliter l'implémentation
 * des mises à jour optimistes lors des mutations avec React Query.
 */

import { notificationService } from '../services/notification/notificationService';

/**
 * Configuration de base pour les mutations optimistes
 * @param {Object} queryClient - Instance de QueryClient
 * @param {Object} options - Options de configuration
 * @param {Function} options.mutationFn - Fonction de mutation à exécuter
 * @param {Array|Function} options.invalidateQueries - Clés de requête à invalider (ou fonction retournant ces clés)
 * @param {Object|Function} options.updateCache - Configuration pour mettre à jour le cache (ou fonction retournant cette config)
 * @param {String} options.successMessage - Message à afficher en cas de succès
 * @param {String} options.errorMessage - Message à afficher en cas d'erreur
 * @returns {Object} Configuration de mutation pour React Query
 */
export const optimisticMutation = (queryClient, options) => {
  const {
    mutationFn,
    invalidateQueries,
    updateCache,
    successMessage = 'Opération réussie',
    errorMessage = 'Une erreur est survenue',
  } = options;

  return {
    mutationFn,
    
    // Mise à jour optimiste avant que la mutation ne soit terminée
    onMutate: async (variables) => {
      // Annuler les requêtes en cours pour éviter d'écraser notre mise à jour optimiste
      const queriesToCancel = typeof invalidateQueries === 'function' 
        ? invalidateQueries(variables) 
        : invalidateQueries;
        
      if (queriesToCancel) {
        await queryClient.cancelQueries(queriesToCancel);
      }

      // Sauvegarde des données précédentes pour pouvoir revenir en arrière en cas d'erreur
      const previousData = {};
      
      // Si updateCache est défini, effectuer la mise à jour optimiste du cache
      if (updateCache) {
        const cacheUpdates = typeof updateCache === 'function'
          ? updateCache(variables, queryClient) 
          : updateCache;
          
        // Pour chaque clé de requête à mettre à jour
        Object.entries(cacheUpdates).forEach(([queryKey, updater]) => {
          // Sauvegarder les données précédentes
          previousData[queryKey] = queryClient.getQueryData(queryKey);
          
          // Mettre à jour le cache de manière optimiste
          if (typeof updater === 'function') {
            queryClient.setQueryData(queryKey, (oldData) => {
              return updater(oldData, variables);
            });
          } else {
            queryClient.setQueryData(queryKey, updater);
          }
        });
      }
      
      return { previousData };
    },
    
    // En cas de succès, afficher un message et invalider les requêtes nécessaires
    onSuccess: (data, variables, context) => {
      if (successMessage) {
        notificationService.showSuccess(successMessage);
      }
      
      // Invalider les requêtes pour forcer un rafraîchissement des données
      const queriesToInvalidate = typeof invalidateQueries === 'function' 
        ? invalidateQueries(variables) 
        : invalidateQueries;
        
      if (queriesToInvalidate) {
        queryClient.invalidateQueries(queriesToInvalidate);
      }
    },
    
    // En cas d'erreur, revenir aux données précédentes et afficher un message d'erreur
    onError: (error, variables, context) => {
      console.error('Erreur de mutation:', error);
      
      if (errorMessage) {
        notificationService.showError(errorMessage, {
          description: error?.message || 'Veuillez réessayer ultérieurement'
        });
      }
      
      // Si nous avons des données précédentes, restaurer chaque clé de requête
      if (context?.previousData) {
        Object.entries(context.previousData).forEach(([queryKey, data]) => {
          if (data !== undefined) {
            queryClient.setQueryData(queryKey, data);
          }
        });
      }
    }
  };
};

/**
 * Utilitaire pour créer une mise à jour optimiste pour une liste d'éléments
 * @param {String} type - Type d'opération ('add', 'update', 'delete')
 * @param {Function} matcher - Fonction pour identifier l'élément à mettre à jour/supprimer
 * @param {Object} newData - Nouvelles données pour l'ajout/mise à jour (non utilisé pour la suppression)
 * @returns {Function} Fonction de mise à jour de cache pour optimisticMutation
 */
export const listUpdater = (type, matcher, newData) => (oldData) => {
  if (!oldData || !Array.isArray(oldData)) return oldData;
  
  switch (type) {
    case 'add':
      return [...oldData, newData];
      
    case 'update':
      return oldData.map(item => 
        matcher(item) ? { ...item, ...newData } : item
      );
      
    case 'delete':
      return oldData.filter(item => !matcher(item));
      
    default:
      return oldData;
  }
};

/**
 * Utilitaire pour créer une mise à jour optimiste pour un objet
 * @param {Function} updater - Fonction qui reçoit l'ancien objet et retourne le nouveau
 * @returns {Function} Fonction de mise à jour de cache pour optimisticMutation
 */
export const objectUpdater = (updater) => (oldData) => {
  if (!oldData || typeof oldData !== 'object') return oldData;
  return updater(oldData);
};

/**
 * Utilitaire pour les opérations de toggle (par exemple, ajouter/retirer des favoris)
 * @param {String} field - Le champ à basculer (par exemple 'isFavorite')
 * @param {Function} matcher - Fonction pour identifier l'élément à basculer
 * @returns {Function} Fonction de mise à jour de cache pour optimisticMutation
 */
export const toggleUpdater = (field, matcher) => (oldData) => {
  if (!oldData || !Array.isArray(oldData)) return oldData;
  
  return oldData.map(item => 
    matcher(item) ? { ...item, [field]: !item[field] } : item
  );
};

export default {
  optimisticMutation,
  listUpdater,
  objectUpdater,
  toggleUpdater
};
