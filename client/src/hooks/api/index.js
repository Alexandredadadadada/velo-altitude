/**
 * Index des hooks API
 * 
 * Ce fichier exporte tous les hooks API disponibles pour l'application.
 * Il permet d'importer facilement les hooks depuis un seul point d'entrée.
 */

import useColsApi from './useColsApi';
import useUsersApi from './useUsersApi';
import useActivitiesApi from './useActivitiesApi';
import use7MajeursApi from './use7MajeursApi';
import useWeatherApi from './useWeatherApi';
import useNutritionApi from './useNutritionApi';
import useAuthApi from './useAuthApi';

// Exporter tous les hooks en un seul objet
const apiHooks = {
  ...useColsApi,
  ...useUsersApi,
  ...useActivitiesApi,
  ...use7MajeursApi,
  ...useWeatherApi,
  ...useNutritionApi,
  ...useAuthApi
};

// Exporter aussi individuellement
export {
  useColsApi,
  useUsersApi,
  useActivitiesApi,
  use7MajeursApi,
  useWeatherApi,
  useNutritionApi,
  useAuthApi
};

export default apiHooks;
