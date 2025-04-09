/**
 * Gestionnaire d'erreurs pour le service des cols
 */

import { ColNotFoundError, ColValidationError } from './types/ColTypes';
import { monitoring } from '../monitoring';

/**
 * Classe de gestion des erreurs du service des cols
 */
export class ColErrorHandler {
  /**
   * Gère les erreurs du service des cols
   * @param error Erreur à gérer
   * @returns Nouvelle erreur formatée ou error rethrow
   */
  handle(error: any): never {
    // Log de l'erreur
    console.error('Col Service Error:', error);
    
    // Enregistrement de l'erreur dans le système de monitoring
    monitoring.logError('colService', error.name || 'UnknownError', error.message || 'Unknown error');
    
    // Gestion spécifique selon le type d'erreur
    if (error instanceof ColNotFoundError) {
      throw error; // Déjà formatée correctement
    }
    
    if (error instanceof ColValidationError) {
      throw error; // Déjà formatée correctement
    }
    
    // Erreurs réseau
    if (error.name === 'NetworkError' || error.name === 'AbortError' || error.message?.includes('network')) {
      throw new Error(`Erreur de connexion au service des cols: ${error.message}`);
    }
    
    // Erreurs d'API
    if (error.status === 404) {
      throw new ColNotFoundError(error.colId || 'unknown');
    }
    
    if (error.status === 400) {
      throw new Error(`Requête invalide: ${error.message || 'Paramètres incorrects'}`);
    }
    
    if (error.status === 401 || error.status === 403) {
      throw new Error(`Accès non autorisé au service des cols: ${error.message || 'Authentification requise'}`);
    }
    
    if (error.status === 429) {
      throw new Error('Limite de requêtes au service des cols dépassée. Veuillez réessayer plus tard.');
    }
    
    if (error.status >= 500) {
      throw new Error(`Erreur serveur du service des cols: ${error.message || 'Service temporairement indisponible'}`);
    }
    
    // Erreurs génériques
    throw new Error(`Erreur lors de l'accès au service des cols: ${error.message || 'Erreur inconnue'}`);
  }

  /**
   * Gère les erreurs de façon asynchrone avec promesse
   * @param error Erreur à gérer
   * @param fallback Valeur de fallback optionnelle
   * @returns Promise rejetée ou résolue avec la valeur de fallback
   */
  async handleAsync<T>(error: any, fallback?: T): Promise<T> {
    try {
      this.handle(error);
    } catch (formattedError) {
      if (fallback !== undefined) {
        console.warn('Col Service using fallback value after error:', error);
        return fallback;
      }
      throw formattedError;
    }
    // Cette ligne ne devrait jamais être atteinte car handle() lance toujours une exception
    throw error;
  }

  /**
   * Enregistre l'erreur sans la propager
   * @param error Erreur à enregistrer
   * @param context Contexte de l'erreur
   */
  logOnly(error: any, context: string): void {
    console.error(`Col Service Error [${context}]:`, error);
    monitoring.logError('colService', error.name || 'UnknownError', `${context}: ${error.message || 'Unknown error'}`);
  }

  /**
   * Construit un wrapper pour les fonctions du service qui gère automatiquement les erreurs
   * @param fn Fonction à wrapper
   * @param fallback Valeur de fallback optionnelle
   * @returns Fonction wrappée avec gestion d'erreurs
   */
  withErrorHandling<T, Args extends any[]>(
    fn: (...args: Args) => Promise<T>,
    fallback?: T
  ): (...args: Args) => Promise<T> {
    return async (...args: Args): Promise<T> => {
      try {
        return await fn(...args);
      } catch (error) {
        return this.handleAsync(error, fallback);
      }
    };
  }
}
