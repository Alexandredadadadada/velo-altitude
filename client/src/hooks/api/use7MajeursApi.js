/**
 * Hooks pour l'API 7 Majeurs
 * 
 * Collection de hooks React Query pour gérer toutes les opérations liées aux défis "7 Majeurs".
 * Ces hooks utilisent l'orchestrateur API réel et offrent une gestion de cache efficace.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiOrchestrator } from '../../contexts/RealApiOrchestratorProvider';
import { queryKeys } from '../../lib/react-query';
import { notificationService } from '../../services/notification/notificationService';
import { optimisticMutation } from '../../lib/optimistic-updates';

/**
 * Hook pour récupérer tous les défis 7 Majeurs
 * @returns {Object} Query result
 */
export const useGetAllMajeurs7Challenges = () => {
  const apiOrchestrator = useApiOrchestrator();
  
  return useQuery(
    queryKeys.majeurs7.all,
    () => apiOrchestrator.getAllMajeurs7Challenges(),
    {
      staleTime: 20 * 60 * 1000, // 20 minutes (ces données changent rarement)
      onError: (error) => {
        console.error('Erreur lors de la récupération des défis 7 Majeurs:', error);
        notificationService.showError(
          'Impossible de récupérer les défis 7 Majeurs',
          { title: 'Erreur API' }
        );
      }
    }
  );
};

/**
 * Hook pour récupérer un défi 7 Majeurs par son ID
 * @param {string} id - ID du défi
 * @returns {Object} Query result
 */
export const useGetMajeurs7ChallengeById = (id) => {
  const apiOrchestrator = useApiOrchestrator();
  
  return useQuery(
    queryKeys.majeurs7.byId(id),
    () => apiOrchestrator.getMajeurs7ChallengeById(id),
    {
      enabled: !!id,
      staleTime: 15 * 60 * 1000, // 15 minutes
      onError: (error) => {
        console.error(`Erreur lors de la récupération du défi 7 Majeurs ${id}:`, error);
        notificationService.showError(
          'Impossible de récupérer les détails du défi',
          { title: 'Erreur API' }
        );
      }
    }
  );
};

/**
 * Hook pour récupérer la progression d'un utilisateur sur un défi 7 Majeurs
 * @param {string} userId - ID de l'utilisateur
 * @param {string} challengeId - ID du défi
 * @returns {Object} Query result
 */
export const useGetMajeurs7Progress = (userId, challengeId) => {
  const apiOrchestrator = useApiOrchestrator();
  
  return useQuery(
    queryKeys.majeurs7.progress(userId, challengeId),
    () => apiOrchestrator.getMajeurs7Progress(userId, challengeId),
    {
      enabled: !!userId && !!challengeId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error) => {
        console.error(`Erreur lors de la récupération de la progression pour le défi ${challengeId}:`, error);
        notificationService.showError(
          'Impossible de récupérer votre progression',
          { title: 'Erreur API' }
        );
      }
    }
  );
};

/**
 * Hook pour rejoindre un défi 7 Majeurs
 * Utilise une mise à jour optimiste pour une expérience utilisateur fluide
 * @returns {Object} Mutation result
 */
export const useJoinMajeurs7Challenge = () => {
  const queryClient = useQueryClient();
  const apiOrchestrator = useApiOrchestrator();
  
  return useMutation(
    ({ userId, challengeId }) => apiOrchestrator.joinMajeurs7Challenge(userId, challengeId),
    optimisticMutation(queryClient, {
      mutationFn: ({ userId, challengeId }) => apiOrchestrator.joinMajeurs7Challenge(userId, challengeId),
      
      // Définir les clés de requête à invalider après une mutation réussie
      invalidateQueries: (variables) => [
        queryKeys.majeurs7.progress(variables.userId, variables.challengeId),
        queryKeys.users.profile(variables.userId)
      ],
      
      // Configurer la mise à jour optimiste du cache - création d'une progression initiale
      updateCache: (variables, queryClient) => {
        const progressKey = queryKeys.majeurs7.progress(variables.userId, variables.challengeId);
        const challengeKey = queryKeys.majeurs7.byId(variables.challengeId);
        
        // Récupérer les détails du défi si disponible
        const challengeData = queryClient.getQueryData(challengeKey);
        
        if (challengeData) {
          // Créer une progression initiale vide
          return {
            [progressKey]: {
              userId: variables.userId,
              challengeId: variables.challengeId,
              startDate: new Date().toISOString(),
              completedCols: [],
              totalProgress: 0,
              status: 'in-progress'
            }
          };
        }
        
        return {}; // Pas de mise à jour optimiste si nous n'avons pas les détails du défi
      },
      
      // Messages de notification
      successMessage: 'Vous avez rejoint le défi avec succès',
      errorMessage: 'Impossible de rejoindre le défi'
    })
  );
};

/**
 * Hook pour mettre à jour la progression d'un défi 7 Majeurs
 * Utilise une mise à jour optimiste pour une expérience utilisateur fluide
 * @returns {Object} Mutation result
 */
export const useUpdateMajeurs7Progress = () => {
  const queryClient = useQueryClient();
  const apiOrchestrator = useApiOrchestrator();
  
  return useMutation(
    ({ userId, challengeId, colId, completed }) => 
      apiOrchestrator.updateMajeurs7Progress(userId, challengeId, colId, completed),
    optimisticMutation(queryClient, {
      mutationFn: ({ userId, challengeId, colId, completed }) => 
        apiOrchestrator.updateMajeurs7Progress(userId, challengeId, colId, completed),
      
      // Définir les clés de requête à invalider après une mutation réussie
      invalidateQueries: (variables) => [
        queryKeys.users.profile(variables.userId)
      ],
      
      // Configurer la mise à jour optimiste du cache
      updateCache: (variables, queryClient) => {
        const progressKey = queryKeys.majeurs7.progress(variables.userId, variables.challengeId);
        const currentProgress = queryClient.getQueryData(progressKey);
        
        if (currentProgress) {
          // Mise à jour optimiste de la progression
          const updatedProgress = {...currentProgress};
          
          if (variables.completed) {
            // Ajouter le col complété s'il n'est pas déjà dans la liste
            if (!updatedProgress.completedCols.includes(variables.colId)) {
              updatedProgress.completedCols = [...updatedProgress.completedCols, variables.colId];
              
              // Calculer le nouveau pourcentage de progression
              if (updatedProgress.totalCols) {
                updatedProgress.totalProgress = Math.round(
                  (updatedProgress.completedCols.length / updatedProgress.totalCols) * 100
                );
              }
            }
          } else {
            // Retirer le col de la liste des cols complétés
            updatedProgress.completedCols = updatedProgress.completedCols.filter(
              id => id !== variables.colId
            );
            
            // Recalculer le pourcentage de progression
            if (updatedProgress.totalCols) {
              updatedProgress.totalProgress = Math.round(
                (updatedProgress.completedCols.length / updatedProgress.totalCols) * 100
              );
            }
          }
          
          return {
            [progressKey]: updatedProgress
          };
        }
        
        return {}; // Pas de mise à jour optimiste si nous n'avons pas les données actuelles
      },
      
      // Messages de notification personnalisés
      successMessage: (variables) => variables.completed 
        ? 'Col validé dans votre défi' 
        : 'Progression mise à jour',
      errorMessage: 'Impossible de mettre à jour votre progression'
    })
  );
};

/**
 * Hook pour créer un nouveau défi 7 Majeurs
 * Utilise une mise à jour optimiste pour une expérience utilisateur fluide
 * @returns {Object} Mutation result
 */
export const useCreateMajeurs7Challenge = () => {
  const queryClient = useQueryClient();
  const apiOrchestrator = useApiOrchestrator();
  
  return useMutation(
    (challengeData) => apiOrchestrator.createMajeurs7Challenge(challengeData),
    optimisticMutation(queryClient, {
      mutationFn: (challengeData) => apiOrchestrator.createMajeurs7Challenge(challengeData),
      
      // Définir les clés de requête à invalider après une mutation réussie
      invalidateQueries: () => [
        queryKeys.majeurs7.all
      ],
      
      // Configurer la mise à jour optimiste du cache
      updateCache: (challengeData, queryClient) => {
        const allChallengesKey = queryKeys.majeurs7.all;
        const currentChallenges = queryClient.getQueryData(allChallengesKey);
        
        if (currentChallenges) {
          // Créer une version temporaire du défi avec un ID temporaire
          const tempChallenge = {
            ...challengeData,
            id: `temp-${Date.now()}`, // ID temporaire qui sera remplacé par l'ID réel
            createdAt: new Date().toISOString(),
            participantsCount: 0
          };
          
          return {
            [allChallengesKey]: [...currentChallenges, tempChallenge]
          };
        }
        
        return {}; // Pas de mise à jour optimiste si nous n'avons pas la liste actuelle
      },
      
      // Messages de notification
      successMessage: 'Défi 7 Majeurs créé avec succès',
      errorMessage: 'Impossible de créer le défi'
    })
  );
};

// Exporter les hooks dans un objet pour faciliter l'import
const majeurs7ApiHooks = {
  useGetAllMajeurs7Challenges,
  useGetMajeurs7ChallengeById,
  useGetMajeurs7Progress,
  useJoinMajeurs7Challenge,
  useUpdateMajeurs7Progress,
  useCreateMajeurs7Challenge
};

export default majeurs7ApiHooks;
