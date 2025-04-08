/**
 * Hooks pour l'API Météo
 * 
 * Collection de hooks React Query pour gérer toutes les opérations liées à la météo.
 * Ces hooks utilisent l'orchestrateur API réel et offrent une gestion de cache efficace.
 */

import { useQuery } from '@tanstack/react-query';
import { useApiOrchestrator } from '../../contexts/RealApiOrchestratorProvider';
import { queryKeys } from '../../lib/react-query';
import { notificationService } from '../../services/notification/notificationService';

/**
 * Hook pour récupérer les données météo d'un col
 * @param {string} colId - ID du col
 * @returns {Object} Query result
 */
export const useGetColWeather = (colId) => {
  const apiOrchestrator = useApiOrchestrator();
  
  return useQuery(
    queryKeys.weather.byCol(colId),
    () => apiOrchestrator.getColWeather(colId),
    {
      enabled: !!colId,
      // Durée de fraîcheur plus courte pour les données météo
      staleTime: 15 * 60 * 1000, // 15 minutes
      // Refetch automatique toutes les 30 minutes
      refetchInterval: 30 * 60 * 1000,
      onError: (error) => {
        console.error(`Erreur lors de la récupération de la météo pour le col ${colId}:`, error);
        notificationService.showError(
          'Impossible de récupérer les informations météo',
          { title: 'Erreur API' }
        );
      }
    }
  );
};

/**
 * Hook pour récupérer les prévisions météo d'un col sur plusieurs jours
 * @param {string} colId - ID du col
 * @param {number} days - Nombre de jours de prévision (max 7)
 * @returns {Object} Query result
 */
export const useGetColForecast = (colId, days = 5) => {
  const apiOrchestrator = useApiOrchestrator();
  
  return useQuery(
    queryKeys.weather.forecast(colId, days),
    () => apiOrchestrator.getColForecast(colId, days),
    {
      enabled: !!colId,
      staleTime: 2 * 60 * 60 * 1000, // 2 heures
      // Refetch automatique toutes les 3 heures
      refetchInterval: 3 * 60 * 60 * 1000,
      onError: (error) => {
        console.error(`Erreur lors de la récupération des prévisions météo pour le col ${colId}:`, error);
        notificationService.showError(
          'Impossible de récupérer les prévisions météo',
          { title: 'Erreur API' }
        );
      }
    }
  );
};

/**
 * Hook pour récupérer la météo pour des coordonnées spécifiques
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Object} Query result
 */
export const useGetWeatherByLocation = (lat, lng) => {
  const apiOrchestrator = useApiOrchestrator();
  
  return useQuery(
    queryKeys.weather.byLocation(lat, lng),
    () => apiOrchestrator.getWeatherByLocation(lat, lng),
    {
      enabled: !!lat && !!lng,
      staleTime: 15 * 60 * 1000, // 15 minutes
      refetchInterval: 30 * 60 * 1000, // 30 minutes
      onError: (error) => {
        console.error(`Erreur lors de la récupération de la météo pour les coordonnées (${lat}, ${lng}):`, error);
        notificationService.showError(
          'Impossible de récupérer les informations météo pour cette localisation',
          { title: 'Erreur API' }
        );
      }
    }
  );
};

/**
 * Hook pour récupérer les alertes météo pour une région
 * @param {string} region - Nom de la région
 * @returns {Object} Query result
 */
export const useGetWeatherAlerts = (region) => {
  const apiOrchestrator = useApiOrchestrator();
  
  return useQuery(
    ['weather', 'alerts', region],
    () => apiOrchestrator.getWeatherAlerts(region),
    {
      enabled: !!region,
      staleTime: 60 * 60 * 1000, // 1 heure
      refetchInterval: 2 * 60 * 60 * 1000, // 2 heures
      onError: (error) => {
        console.error(`Erreur lors de la récupération des alertes météo pour la région ${region}:`, error);
        notificationService.showError(
          'Impossible de récupérer les alertes météo',
          { title: 'Erreur API' }
        );
      }
    }
  );
};

export default {
  useGetColWeather,
  useGetColForecast,
  useGetWeatherByLocation,
  useGetWeatherAlerts
};
