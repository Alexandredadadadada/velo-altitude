/**
 * Hooks pour l'API Utilisateurs
 * 
 * Collection de hooks React Query pour gérer toutes les opérations liées aux utilisateurs.
 * Ces hooks utilisent l'orchestrateur API réel et offrent une gestion de cache efficace.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiOrchestrator } from '../../contexts/RealApiOrchestratorProvider';
import { queryKeys } from '../../lib/react-query';
import { notificationService } from '../../services/notification/notificationService';
import { optimisticMutation, objectUpdater } from '../../lib/optimistic-updates';

/**
 * Hook pour récupérer le profil d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Object} Query result
 */
export const useGetUserProfile = (userId) => {
  const apiOrchestrator = useApiOrchestrator();
  
  return useQuery(
    queryKeys.users.profile(userId),
    () => apiOrchestrator.getUserProfile(userId),
    {
      enabled: !!userId,
      staleTime: 20 * 60 * 1000, // 20 minutes (données utilisateur relativement stables)
      onError: (error) => {
        console.error(`Erreur lors de la récupération du profil de l'utilisateur ${userId}:`, error);
        notificationService.showError(
          `Impossible de récupérer le profil utilisateur`,
          { title: 'Erreur API' }
        );
      }
    }
  );
};

/**
 * Hook pour mettre à jour le profil d'un utilisateur
 * Utilise une mise à jour optimiste pour une expérience utilisateur fluide
 * @returns {Object} Mutation result
 */
export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();
  const apiOrchestrator = useApiOrchestrator();
  
  return useMutation(
    ({ userId, data }) => apiOrchestrator.updateUserProfile(userId, data),
    optimisticMutation(queryClient, {
      mutationFn: ({ userId, data }) => apiOrchestrator.updateUserProfile(userId, data),
      
      // Définir les clés de requête à invalider après une mutation réussie
      invalidateQueries: (variables) => [
        queryKeys.users.activities(variables.userId)
      ],
      
      // Configurer la mise à jour optimiste du cache
      updateCache: (variables) => {
        const profileKey = queryKeys.users.profile(variables.userId);
        
        return {
          [profileKey]: objectUpdater((oldData) => ({
            ...oldData,
            ...variables.data
          }))
        };
      },
      
      // Messages de notification
      successMessage: 'Profil mis à jour avec succès',
      errorMessage: 'Impossible de mettre à jour le profil'
    })
  );
};

/**
 * Hook pour récupérer les activités d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {number} page - Numéro de page
 * @param {number} pageSize - Taille de la page
 * @returns {Object} Query result
 */
export const useGetUserActivities = (userId, page = 1, pageSize = 10) => {
  const apiOrchestrator = useApiOrchestrator();
  
  return useQuery(
    queryKeys.users.activities(userId, page),
    () => apiOrchestrator.getUserActivities(userId, page, pageSize),
    {
      enabled: !!userId,
      keepPreviousData: true, // Garder les données précédentes pendant le chargement
      staleTime: 2 * 60 * 1000, // 2 minutes
      onError: (error) => {
        console.error(`Erreur lors de la récupération des activités de l'utilisateur ${userId}:`, error);
        notificationService.showError(
          `Impossible de récupérer les activités`,
          { title: 'Erreur API' }
        );
      }
    }
  );
};

/**
 * Hook pour précharger le profil d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 */
export const usePrefetchUserProfile = (userId) => {
  const queryClient = useQueryClient();
  const apiOrchestrator = useApiOrchestrator();
  
  const prefetchProfile = () => {
    if (userId) {
      queryClient.prefetchQuery(
        queryKeys.users.profile(userId),
        () => apiOrchestrator.getUserProfile(userId),
        { staleTime: 20 * 60 * 1000 } // 20 minutes (cohérent avec useGetUserProfile)
      );
    }
  };
  
  return { prefetchProfile };
};

/**
 * Hook pour précharger les activités d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 */
export const usePrefetchUserActivities = (userId) => {
  const queryClient = useQueryClient();
  const apiOrchestrator = useApiOrchestrator();
  
  const prefetchActivities = (page = 1, pageSize = 10) => {
    if (userId) {
      queryClient.prefetchQuery(
        queryKeys.users.activities(userId, page),
        () => apiOrchestrator.getUserActivities(userId, page, pageSize),
        { staleTime: 2 * 60 * 1000 } // 2 minutes
      );
    }
  };
  
  return { prefetchActivities };
};

// Exporter les hooks dans un objet pour faciliter l'import
const usersApiHooks = {
  useGetUserProfile,
  useUpdateUserProfile,
  useGetUserActivities,
  usePrefetchUserProfile,
  usePrefetchUserActivities
};

export default usersApiHooks;
