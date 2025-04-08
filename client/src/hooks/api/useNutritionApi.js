/**
 * Hooks pour l'API Nutrition
 * 
 * Collection de hooks React Query pour gérer toutes les opérations liées à la nutrition.
 * Ces hooks utilisent l'orchestrateur API réel et offrent une gestion de cache efficace.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiOrchestrator } from '../../contexts/RealApiOrchestratorProvider';
import { queryKeys } from '../../lib/react-query';
import { notificationService } from '../../services/notification/notificationService';
import { optimisticMutation, objectUpdater } from '../../lib/optimistic-updates';

/**
 * Hook pour récupérer le plan nutritionnel d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {Object} Query result
 */
export const useGetNutritionPlan = (userId) => {
  const apiOrchestrator = useApiOrchestrator();
  
  return useQuery(
    queryKeys.nutrition.plan(userId),
    () => apiOrchestrator.getUserNutritionPlan(userId),
    {
      enabled: !!userId,
      staleTime: 60 * 60 * 1000, // 1 heure
      onError: (error) => {
        console.error(`Erreur lors de la récupération du plan nutritionnel pour l'utilisateur ${userId}:`, error);
        notificationService.showError(
          'Impossible de récupérer votre plan nutritionnel',
          { title: 'Erreur API' }
        );
      }
    }
  );
};

/**
 * Hook pour mettre à jour le plan nutritionnel d'un utilisateur
 * Utilise une mise à jour optimiste pour une expérience utilisateur fluide
 * @returns {Object} Mutation result
 */
export const useUpdateNutritionPlan = () => {
  const queryClient = useQueryClient();
  const apiOrchestrator = useApiOrchestrator();
  
  return useMutation(
    ({ userId, planData }) => apiOrchestrator.updateUserNutritionPlan(userId, planData),
    optimisticMutation(queryClient, {
      mutationFn: ({ userId, planData }) => apiOrchestrator.updateUserNutritionPlan(userId, planData),
      
      // Définir les clés de requête à invalider après une mutation réussie
      invalidateQueries: (variables) => [
        queryKeys.nutrition.plan(variables.userId)
      ],
      
      // Configurer la mise à jour optimiste du cache
      updateCache: (variables) => ({
        [queryKeys.nutrition.plan(variables.userId)]: objectUpdater((oldData) => ({
          ...oldData,
          ...variables.planData
        }))
      }),
      
      // Messages de notification
      successMessage: 'Plan nutritionnel mis à jour avec succès',
      errorMessage: 'Impossible de mettre à jour le plan nutritionnel'
    })
  );
};

/**
 * Hook pour récupérer les recettes
 * @param {string} query - Terme de recherche
 * @param {Array} tags - Filtrer par tags
 * @returns {Object} Query result
 */
export const useGetRecipes = (query, tags) => {
  const apiOrchestrator = useApiOrchestrator();
  
  return useQuery(
    queryKeys.nutrition.recipes(query, tags),
    () => apiOrchestrator.getRecipes(query, tags),
    {
      staleTime: 24 * 60 * 60 * 1000, // 24 heures (les recettes changent rarement)
      keepPreviousData: true,
      onError: (error) => {
        console.error('Erreur lors de la récupération des recettes:', error);
        notificationService.showError(
          'Impossible de récupérer les recettes',
          { title: 'Erreur API' }
        );
      }
    }
  );
};

/**
 * Hook pour récupérer une recette par son ID
 * @param {string} recipeId - ID de la recette
 * @returns {Object} Query result
 */
export const useGetRecipeById = (recipeId) => {
  const apiOrchestrator = useApiOrchestrator();
  
  return useQuery(
    queryKeys.nutrition.recipe(recipeId),
    () => apiOrchestrator.getRecipeById(recipeId),
    {
      enabled: !!recipeId,
      staleTime: 24 * 60 * 60 * 1000, // 24 heures
      onError: (error) => {
        console.error(`Erreur lors de la récupération de la recette ${recipeId}:`, error);
        notificationService.showError(
          'Impossible de récupérer les détails de la recette',
          { title: 'Erreur API' }
        );
      }
    }
  );
};

/**
 * Hook pour enregistrer un journal nutritionnel
 * Utilise une mise à jour optimiste pour une expérience utilisateur fluide
 * @returns {Object} Mutation result
 */
export const useLogNutrition = () => {
  const queryClient = useQueryClient();
  const apiOrchestrator = useApiOrchestrator();
  
  return useMutation(
    ({ userId, date, logData }) => apiOrchestrator.logNutrition(userId, date, logData),
    optimisticMutation(queryClient, {
      mutationFn: ({ userId, date, logData }) => apiOrchestrator.logNutrition(userId, date, logData),
      
      // Définir les clés de requête à invalider après une mutation réussie
      invalidateQueries: (variables) => [
        queryKeys.nutrition.log(variables.userId, variables.date)
      ],
      
      // Configurer la mise à jour optimiste du cache (si des données existantes sont disponibles)
      updateCache: (variables, queryClient) => {
        const queryKey = queryKeys.nutrition.log(variables.userId, variables.date);
        const currentData = queryClient.getQueryData(queryKey);
        
        // Ne faire une mise à jour optimiste que si nous avons déjà des données
        if (currentData) {
          return {
            [queryKey]: {
              ...currentData,
              entries: [...(currentData.entries || []), variables.logData]
            }
          };
        }
        
        return {}; // Pas de mise à jour optimiste si nous n'avons pas de données
      },
      
      // Messages de notification
      successMessage: 'Journal nutritionnel enregistré avec succès',
      errorMessage: 'Impossible d\'enregistrer le journal nutritionnel'
    })
  );
};

/**
 * Hook pour récupérer le journal nutritionnel d'un jour spécifique
 * @param {string} userId - ID de l'utilisateur
 * @param {string} date - Date au format ISO (YYYY-MM-DD)
 * @returns {Object} Query result
 */
export const useGetNutritionLog = (userId, date) => {
  const apiOrchestrator = useApiOrchestrator();
  
  return useQuery(
    queryKeys.nutrition.log(userId, date),
    () => apiOrchestrator.getNutritionLog(userId, date),
    {
      enabled: !!userId && !!date,
      staleTime: 10 * 60 * 1000, // 10 minutes
      onError: (error) => {
        console.error(`Erreur lors de la récupération du journal nutritionnel pour l'utilisateur ${userId} à la date ${date}:`, error);
        notificationService.showError(
          'Impossible de récupérer le journal nutritionnel',
          { title: 'Erreur API' }
        );
      }
    }
  );
};

export default {
  useGetNutritionPlan,
  useUpdateNutritionPlan,
  useGetRecipes,
  useGetRecipeById,
  useLogNutrition,
  useGetNutritionLog
};
