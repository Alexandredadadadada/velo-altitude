/**
 * Service pour la gestion des utilisateurs
 * Utilise RealApiOrchestrator pour les opérations de données
 */

import RealApiOrchestrator from './api/RealApiOrchestrator';

/**
 * Interface pour les préférences utilisateur
 */
export interface UserPreferences {
  id: string;
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  units: {
    distance: 'km' | 'mi';
    elevation: 'm' | 'ft';
    temperature: 'C' | 'F';
    weight: 'kg' | 'lb';
  };
  notifications: {
    email: boolean;
    push: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'never';
  };
  privacy: {
    shareActivity: boolean;
    shareLocation: boolean;
    profileVisibility: 'public' | 'friends' | 'private';
  };
  dashboardLayout: string[];
  lastUpdated: string;
}

/**
 * Interface pour les favoris utilisateur
 */
export interface UserFavorites {
  userId: string;
  cols?: string[];
  routes?: string[];
  nutrition?: string[];
  workouts?: string[];
  lastUpdated: string;
}

/**
 * Service pour la gestion des utilisateurs
 */
class UserService {
  /**
   * Récupère les préférences d'un utilisateur
   * @param userId ID de l'utilisateur
   * @returns Préférences de l'utilisateur
   */
  async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      return await RealApiOrchestrator.getUserPreferences(userId);
    } catch (error) {
      console.error(`[UserService] Error fetching preferences for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Met à jour les préférences d'un utilisateur
   * @param userId ID de l'utilisateur
   * @param preferences Nouvelles préférences
   * @returns Préférences mises à jour
   */
  async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    try {
      return await RealApiOrchestrator.updateUserPreferences(userId, preferences);
    } catch (error) {
      console.error(`[UserService] Error updating preferences for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Récupère les favoris d'un utilisateur
   * @param userId ID de l'utilisateur
   * @returns Favoris de l'utilisateur
   */
  async getUserFavorites(userId: string): Promise<UserFavorites> {
    try {
      return await RealApiOrchestrator.getUserFavorites(userId);
    } catch (error) {
      console.error(`[UserService] Error fetching favorites for user ${userId}:`, error);
      
      // Fallback pour le développement
      if (process.env.NODE_ENV === 'development') {
        console.warn('[UserService] Using fallback favorites for development');
        return {
          userId,
          cols: [],
          routes: [],
          nutrition: [],
          workouts: [],
          lastUpdated: new Date().toISOString()
        };
      }
      
      throw error;
    }
  }

  /**
   * Ajoute un élément aux favoris d'un utilisateur
   * @param userId ID de l'utilisateur
   * @param category Catégorie de l'élément (cols, routes, nutrition, workouts)
   * @param itemId ID de l'élément à ajouter
   * @returns Favoris mis à jour
   */
  async addToFavorites(userId: string, category: 'cols' | 'routes' | 'nutrition' | 'workouts', itemId: string): Promise<UserFavorites> {
    try {
      return await RealApiOrchestrator.addToFavorites(userId, category, itemId);
    } catch (error) {
      console.error(`[UserService] Error adding ${category}/${itemId} to favorites for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Retire un élément des favoris d'un utilisateur
   * @param userId ID de l'utilisateur
   * @param category Catégorie de l'élément (cols, routes, nutrition, workouts)
   * @param itemId ID de l'élément à retirer
   * @returns Favoris mis à jour
   */
  async removeFromFavorites(userId: string, category: 'cols' | 'routes' | 'nutrition' | 'workouts', itemId: string): Promise<UserFavorites> {
    try {
      return await RealApiOrchestrator.removeFromFavorites(userId, category, itemId);
    } catch (error) {
      console.error(`[UserService] Error removing ${category}/${itemId} from favorites for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Récupère le profil d'un utilisateur
   * @param userId ID de l'utilisateur
   * @returns Profil de l'utilisateur
   */
  async getUserProfile(userId: string): Promise<any> {
    try {
      return await RealApiOrchestrator.getUserProfile(userId);
    } catch (error) {
      console.error(`[UserService] Error fetching profile for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Met à jour le profil d'un utilisateur
   * @param userId ID de l'utilisateur
   * @param profileData Données du profil à mettre à jour
   * @returns Profil mis à jour
   */
  async updateUserProfile(userId: string, profileData: any): Promise<any> {
    try {
      return await RealApiOrchestrator.updateUserProfile(userId, profileData);
    } catch (error) {
      console.error(`[UserService] Error updating profile for user ${userId}:`, error);
      throw error;
    }
  }
}

// Créer une instance et l'exporter
const userService = new UserService();
export default userService;
