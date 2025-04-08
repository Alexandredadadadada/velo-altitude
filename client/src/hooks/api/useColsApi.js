/**
 * Hooks pour l'API Cols
 * 
 * Collection de hooks React Query pour gérer toutes les opérations liées aux cols.
 * Ces hooks utilisent l'orchestrateur API réel et offrent une gestion de cache efficace.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiOrchestrator } from '../../contexts/RealApiOrchestratorProvider';
import { queryKeys } from '../../lib/react-query';
import { notificationService } from '../../services/notification/notificationService';

/**
 * Hook pour récupérer tous les cols
 * @returns {Object} Query result
 */
export const useGetAllCols = () => {
  const apiOrchestrator = useApiOrchestrator();
  
  return useQuery(
    queryKeys.cols.all,
    () => apiOrchestrator.getAllCols(),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
      onError: (error) => {
        console.error('Erreur lors de la récupération des cols:', error);
        notificationService.showError(
          'Impossible de récupérer la liste des cols',
          { title: 'Erreur API' }
        );
      }
    }
  );
};

/**
 * Hook pour récupérer un col par son ID
 * @param {string} id - ID du col
 * @returns {Object} Query result
 */
export const useGetColById = (id) => {
  const apiOrchestrator = useApiOrchestrator();
  
  return useQuery(
    queryKeys.cols.byId(id),
    () => apiOrchestrator.getColById(id),
    {
      enabled: !!id, // N'exécuter que si l'ID est défini
      staleTime: 15 * 60 * 1000, // 15 minutes
      onError: (error) => {
        console.error(`Erreur lors de la récupération du col ${id}:`, error);
        notificationService.showError(
          `Impossible de récupérer les informations du col`,
          { title: 'Erreur API' }
        );
      }
    }
  );
};

/**
 * Hook pour récupérer les cols par région
 * @param {string} region - Région à filtrer
 * @returns {Object} Query result
 */
export const useGetColsByRegion = (region) => {
  const apiOrchestrator = useApiOrchestrator();
  
  return useQuery(
    queryKeys.cols.byRegion(region),
    () => apiOrchestrator.getColsByRegion(region),
    {
      enabled: !!region, // N'exécuter que si la région est définie
      staleTime: 10 * 60 * 1000, // 10 minutes
      onError: (error) => {
        console.error(`Erreur lors de la récupération des cols de la région ${region}:`, error);
        notificationService.showError(
          `Impossible de récupérer les cols de la région sélectionnée`,
          { title: 'Erreur API' }
        );
      }
    }
  );
};

/**
 * Hook pour récupérer les cols par difficulté
 * @param {string} difficulty - Difficulté à filtrer
 * @returns {Object} Query result
 */
export const useGetColsByDifficulty = (difficulty) => {
  const apiOrchestrator = useApiOrchestrator();
  
  return useQuery(
    queryKeys.cols.byDifficulty(difficulty),
    () => apiOrchestrator.getColsByDifficulty(difficulty),
    {
      enabled: !!difficulty, // N'exécuter que si la difficulté est définie
      staleTime: 10 * 60 * 1000, // 10 minutes
      onError: (error) => {
        console.error(`Erreur lors de la récupération des cols de difficulté ${difficulty}:`, error);
        notificationService.showError(
          `Impossible de récupérer les cols du niveau de difficulté sélectionné`,
          { title: 'Erreur API' }
        );
      }
    }
  );
};

/**
 * Hook pour rechercher des cols
 * @param {string} query - Terme de recherche
 * @returns {Object} Query result
 */
export const useSearchCols = (query) => {
  const apiOrchestrator = useApiOrchestrator();
  
  return useQuery(
    queryKeys.cols.search(query),
    () => apiOrchestrator.searchCols(query),
    {
      enabled: !!query && query.length >= 2, // Exécuter seulement si la requête a au moins 2 caractères
      staleTime: 5 * 60 * 1000, // 5 minutes
      keepPreviousData: true, // Garder les données précédentes pendant le chargement
      onError: (error) => {
        console.error(`Erreur lors de la recherche de cols "${query}":`, error);
        notificationService.showError(
          `Impossible de rechercher les cols`,
          { title: 'Erreur API' }
        );
      }
    }
  );
};

/**
 * Hook pour précharger un col par son ID
 * Utile pour précharger les données d'un col avant de naviguer vers sa page
 * @param {string} id - ID du col
 */
export const usePrefetchColById = (id) => {
  const queryClient = useQueryClient();
  const apiOrchestrator = useApiOrchestrator();
  
  const prefetchCol = () => {
    if (id) {
      queryClient.prefetchQuery(
        queryKeys.cols.byId(id),
        () => apiOrchestrator.getColById(id),
        { staleTime: 15 * 60 * 1000 } // 15 minutes
      );
    }
  };
  
  return { prefetchCol };
};

/**
 * Hook pour précharger la météo d'un col
 * @param {string} colId - ID du col
 */
export const usePrefetchColWeather = (colId) => {
  const queryClient = useQueryClient();
  const apiOrchestrator = useApiOrchestrator();
  
  const prefetchWeather = () => {
    if (colId) {
      queryClient.prefetchQuery(
        queryKeys.weather.byCol(colId),
        () => apiOrchestrator.getColWeather(colId),
        { staleTime: 30 * 60 * 1000 } // 30 minutes
      );
    }
  };
  
  return { prefetchWeather };
};

export default {
  useGetAllCols,
  useGetColById,
  useGetColsByRegion,
  useGetColsByDifficulty,
  useSearchCols,
  usePrefetchColById,
  usePrefetchColWeather
};
