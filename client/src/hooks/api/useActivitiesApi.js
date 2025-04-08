/**
 * Hooks pour l'API Activités
 * 
 * Collection de hooks React Query pour gérer toutes les opérations liées aux activités.
 * Ces hooks utilisent l'orchestrateur API réel et offrent une gestion de cache efficace.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiOrchestrator } from '../../contexts/RealApiOrchestratorProvider';
import { queryKeys } from '../../lib/react-query';
import { notificationService } from '../../services/notification/notificationService';
import { optimisticMutation } from '../../lib/optimistic-updates';

/**
 * Hook pour récupérer une activité par son ID
 * @param {string} id - ID de l'activité
 * @returns {Object} Query result
 */
export const useGetActivity = (id) => {
  const apiOrchestrator = useApiOrchestrator();
  
  return useQuery(
    queryKeys.activities.byId(id),
    () => apiOrchestrator.getActivityById(id),
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => {
        console.error(`Erreur lors de la récupération de l'activité ${id}:`, error);
        notificationService.showError(
          `Impossible de récupérer les détails de l'activité`,
          { title: 'Erreur API' }
        );
      }
    }
  );
};

/**
 * Hook pour créer une nouvelle activité
 * Utilise une mise à jour optimiste pour une expérience utilisateur fluide
 * @returns {Object} Mutation result
 */
export const useCreateActivity = () => {
  const queryClient = useQueryClient();
  const apiOrchestrator = useApiOrchestrator();
  
  return useMutation(
    (activityData) => apiOrchestrator.createActivity(activityData),
    optimisticMutation(queryClient, {
      mutationFn: (activityData) => apiOrchestrator.createActivity(activityData),
      
      // Définir les clés de requête à invalider après une mutation réussie
      invalidateQueries: (variables) => [
        queryKeys.users.activities(variables.userId),
        queryKeys.activities.recent
      ],
      
      // Configurer la mise à jour optimiste du cache pour les activités récentes
      updateCache: (variables, queryClient) => {
        // Pour les activités récentes, on peut ajouter l'activité optimistiquement
        // mais on ne peut pas anticiper l'ID généré par le serveur
        const recentActivitiesKey = queryKeys.activities.recent;
        const currentRecentActivities = queryClient.getQueryData(recentActivitiesKey);
        
        if (currentRecentActivities) {
          // Créer une version temporaire de l'activité avec un ID temporaire
          const tempActivity = {
            ...variables,
            id: `temp-${Date.now()}`, // ID temporaire qui sera remplacé par l'ID réel
            createdAt: new Date().toISOString()
          };
          
          return {
            [recentActivitiesKey]: [tempActivity, ...currentRecentActivities.slice(0, -1)]
          };
        }
        
        return {}; // Pas de mise à jour optimiste si nous n'avons pas de données
      },
      
      // Messages de notification
      successMessage: 'Activité créée avec succès',
      errorMessage: 'Impossible de créer l\'activité'
    })
  );
};

/**
 * Hook pour mettre à jour une activité
 * Utilise une mise à jour optimiste pour une expérience utilisateur fluide
 * @returns {Object} Mutation result
 */
export const useUpdateActivity = () => {
  const queryClient = useQueryClient();
  const apiOrchestrator = useApiOrchestrator();
  
  return useMutation(
    ({ id, data }) => apiOrchestrator.updateActivity(id, data),
    optimisticMutation(queryClient, {
      mutationFn: ({ id, data }) => apiOrchestrator.updateActivity(id, data),
      
      // Définir les clés de requête à invalider après une mutation réussie
      invalidateQueries: (variables) => [
        queryKeys.users.activities,
        queryKeys.activities.recent
      ],
      
      // Configurer la mise à jour optimiste du cache
      updateCache: (variables, queryClient) => {
        // Mise à jour pour les détails de l'activité
        const activityKey = queryKeys.activities.byId(variables.id);
        const currentActivity = queryClient.getQueryData(activityKey);
        
        // Mise à jour des récentes activités si elles sont en cache
        const recentActivitiesKey = queryKeys.activities.recent;
        const recentActivities = queryClient.getQueryData(recentActivitiesKey);
        
        const updates = {};
        
        // Mise à jour des détails de l'activité
        if (currentActivity) {
          updates[activityKey] = {
            ...currentActivity,
            ...variables.data
          };
        }
        
        // Mise à jour de l'activité dans la liste des récentes
        if (recentActivities) {
          updates[recentActivitiesKey] = recentActivities.map(activity => 
            activity.id === variables.id 
              ? { ...activity, ...variables.data }
              : activity
          );
        }
        
        return updates;
      },
      
      // Messages de notification
      successMessage: 'Activité mise à jour avec succès',
      errorMessage: 'Impossible de mettre à jour l\'activité'
    })
  );
};

/**
 * Hook pour supprimer une activité
 * Utilise une mise à jour optimiste pour une expérience utilisateur fluide
 * @returns {Object} Mutation result
 */
export const useDeleteActivity = () => {
  const queryClient = useQueryClient();
  const apiOrchestrator = useApiOrchestrator();
  
  return useMutation(
    (id) => apiOrchestrator.deleteActivity(id),
    optimisticMutation(queryClient, {
      mutationFn: (id) => apiOrchestrator.deleteActivity(id),
      
      // Définir les clés de requête à invalider après une mutation réussie
      invalidateQueries: () => [
        queryKeys.users.activities,
        queryKeys.activities.recent
      ],
      
      // Configurer la mise à jour optimiste du cache
      updateCache: (id, queryClient) => {
        // Suppression optimiste de l'activité dans la liste des récentes
        const recentActivitiesKey = queryKeys.activities.recent;
        const recentActivities = queryClient.getQueryData(recentActivitiesKey);
        
        const updates = {};
        
        if (recentActivities) {
          updates[recentActivitiesKey] = recentActivities.filter(
            activity => activity.id !== id
          );
        }
        
        return updates;
      },
      
      // Après une suppression réussie, supprimer complètement la requête
      onSuccess: (_, id) => {
        queryClient.removeQueries(queryKeys.activities.byId(id));
      },
      
      // Messages de notification
      successMessage: 'Activité supprimée avec succès',
      errorMessage: 'Impossible de supprimer l\'activité'
    })
  );
};

/**
 * Hook pour récupérer les activités récentes
 * @param {number} limit - Nombre d'activités à récupérer
 * @returns {Object} Query result
 */
export const useGetRecentActivities = (limit = 10) => {
  const apiOrchestrator = useApiOrchestrator();
  
  return useQuery(
    queryKeys.activities.recent,
    () => apiOrchestrator.getRecentActivities(limit),
    {
      staleTime: 1 * 60 * 1000, // 1 minute (plus court car les données changent souvent)
      onError: (error) => {
        console.error('Erreur lors de la récupération des activités récentes:', error);
        notificationService.showError(
          'Impossible de récupérer les activités récentes',
          { title: 'Erreur API' }
        );
      }
    }
  );
};

// Exporter les hooks dans un objet pour faciliter l'import
const activitiesApiHooks = {
  useGetActivity,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity,
  useGetRecentActivities
};

export default activitiesApiHooks;
