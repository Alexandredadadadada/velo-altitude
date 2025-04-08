/**
 * @file Utilitaires de gestion des erreurs API pour Velo-Altitude
 * @description Fournit des fonctions pour traiter les erreurs provenant des appels API
 * et produire des messages d'erreur cohérents pour l'utilisateur final.
 * Ces utilitaires standardisent la gestion des erreurs dans toute l'application.
 * 
 * @module apiErrorUtils
 */

import axios, { AxiosError } from 'axios';
import { ApiError } from '../types/api';

// Import du service de notification 
import notificationService from '../services/notification/notificationService';

/**
 * Analyse une erreur Axios et la transforme en un format standard ApiError
 * Cette fonction gère différents cas d'erreur et génère des messages utilisateur appropriés
 * 
 * @param {unknown} error - L'erreur Axios ou autre type d'erreur à traiter
 * @param {string} operation - Le nom de l'opération qui a échoué (pour le logging)
 * @returns {ApiError} Un objet d'erreur standardisé pour l'application
 */
export const handleApiError = (error: unknown, operation: string): ApiError => {
  // Journaliser l'erreur brute
  console.error(`[API Error] - ${operation}:`, error);
  
  let apiError: ApiError = {
    status: 500,
    message: 'Une erreur inattendue est survenue'
  };
  
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    
    // Préparer les détails de base
    apiError.status = axiosError.response?.status || 500;
    
    // Analyser la réponse selon son format
    if (axiosError.response?.data) {
      const responseData = axiosError.response.data as any;
      
      // Extraire le message d'erreur selon le format de l'API
      if (typeof responseData === 'string') {
        apiError.message = responseData;
      } else if (responseData.message) {
        apiError.message = responseData.message;
      } else if (responseData.error) {
        apiError.message = typeof responseData.error === 'string' 
          ? responseData.error 
          : responseData.error.message || 'Erreur serveur';
      }
      
      // Extraire le code d'erreur s'il existe
      if (responseData.code) {
        apiError.code = responseData.code;
      }
      
      // Extraire les détails supplémentaires s'ils existent
      if (responseData.details) {
        apiError.details = responseData.details;
      }
    }
    
    // Gérer les cas spécifiques
    if (axiosError.code === 'ECONNABORTED') {
      apiError.message = 'La connexion a expiré. Veuillez réessayer.';
      apiError.code = 'TIMEOUT';
    } else if (!axiosError.response) {
      apiError.message = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
      apiError.code = 'NETWORK_ERROR';
    }
  } else if (error instanceof Error) {
    apiError.message = error.message;
  }
  
  // Génération de messages utilisateur conviviaux basés sur le code HTTP
  let userMessage = '';
  switch (apiError.status) {
    case 400:
      userMessage = 'Requête incorrecte. Veuillez vérifier les informations saisies.';
      break;
    case 401:
      userMessage = 'Session expirée. Veuillez vous reconnecter.';
      break;
    case 403:
      userMessage = 'Accès refusé. Vous n\'avez pas les permissions nécessaires.';
      break;
    case 404:
      userMessage = 'La ressource demandée n\'existe pas.';
      break;
    case 422:
      userMessage = 'Données invalides. Veuillez vérifier votre saisie.';
      break;
    case 429:
      userMessage = 'Trop de requêtes. Veuillez réessayer plus tard.';
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      userMessage = 'Une erreur serveur est survenue. Veuillez réessayer ultérieurement.';
      break;
    default:
      userMessage = 'Une erreur est survenue. Veuillez réessayer.';
  }
  
  // Afficher la notification pour l'utilisateur
  notificationService.error(userMessage, {
    title: 'Erreur',
    duration: 5000
  });
  
  // TODO: Envoyer l'erreur à un service de reporting externe (Sentry, LogRocket, etc.)
  
  return apiError;
};

/**
 * Crée un message d'erreur lisible à partir d'une ApiError
 * Utile pour afficher des messages d'erreur détaillés dans l'interface
 * 
 * @param {ApiError} error - L'erreur API à formater
 * @returns {string} Une chaîne formatée pour l'affichage à l'utilisateur
 */
export const formatApiErrorMessage = (error: ApiError): string => {
  let message = `Erreur ${error.status}: ${error.message}`;
  
  if (error.code) {
    message += ` (Code: ${error.code})`;
  }
  
  return message;
};

export default {
  handleApiError,
  formatApiErrorMessage
};
