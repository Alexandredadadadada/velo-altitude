/**
 * RealApiOrchestrator
 * 
 * Implémentation de l'interface ApiOrchestrator qui se connecte à de vrais endpoints API
 * au lieu d'utiliser des données mockées. Ce service remplace entièrement l'utilisation
 * des mocks intrusifs qui existaient précédemment.
 */

import api from '../../config/apiConfig';
import { handleApiError } from '../../utils/apiErrorUtils';
import {
  ApiOrchestrator,
  Col,
  UserProfile,
  Activity,
  Majeurs7Challenge,
  Majeurs7Progress,
  WeatherData,
  TrainingPlan,
  FTPRecord,
  NutritionPlan,
  NutritionLog,
  NutritionEntry,
  NutritionRecipe,
  ForumCategory,
  ForumTopic,
  ForumPost
} from '../../types/api';

/**
 * Implémentation réelle de l'orchestrateur d'API qui communique avec le backend
 */
class RealApiOrchestrator implements ApiOrchestrator {
  
  // #region Services des cols
  /**
   * Récupère tous les cols
   * @returns Liste des cols
   */
  async getAllCols(): Promise<Col[]> {
    try {
      const response = await api.get('/cols');
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getAllCols');
    }
  }

  /**
   * Récupère un col par son ID
   * @param id - ID du col à récupérer
   * @returns Détails du col
   */
  async getColById(id: string): Promise<Col> {
    try {
      const response = await api.get(`/cols/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getColById');
    }
  }

  /**
   * Récupère les cols par région
   * @param region - Région à filtrer
   * @returns Liste des cols dans la région
   */
  async getColsByRegion(region: string): Promise<Col[]> {
    try {
      const response = await api.get('/cols', { params: { region } });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getColsByRegion');
    }
  }

  /**
   * Récupère les cols par niveau de difficulté
   * @param difficulty - Niveau de difficulté
   * @returns Liste des cols correspondants
   */
  async getColsByDifficulty(difficulty: string): Promise<Col[]> {
    try {
      const response = await api.get('/cols', { params: { difficulty } });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getColsByDifficulty');
    }
  }

  /**
   * Recherche des cols par requête
   * @param query - Termes de recherche
   * @returns Liste des cols correspondants
   */
  async searchCols(query: string): Promise<Col[]> {
    try {
      const response = await api.get('/cols/search', { params: { q: query } });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'searchCols');
    }
  }
  // #endregion

  // #region Services utilisateur
  /**
   * Récupère le profil d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @returns Profil utilisateur
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    try {
      const response = await api.get(`/users/${userId}/profile`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getUserProfile');
    }
  }

  /**
   * Met à jour le profil d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @param data - Données à mettre à jour
   * @returns Profil mis à jour
   */
  async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await api.patch(`/users/${userId}/profile`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'updateUserProfile');
    }
  }

  /**
   * Récupère les activités d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @param page - Numéro de page
   * @param pageSize - Taille de la page
   * @returns Activités paginées
   */
  async getUserActivities(
    userId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ activities: Activity[]; total: number }> {
    try {
      const response = await api.get(`/users/${userId}/activities`, {
        params: { page, pageSize }
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getUserActivities');
    }
  }
  // #endregion

  // #region Services d'activité
  /**
   * Crée une nouvelle activité
   * @param activity - Données de l'activité
   * @returns Activité créée
   */
  async createActivity(activity: Partial<Activity>): Promise<Activity> {
    try {
      const response = await api.post('/activities', activity);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'createActivity');
    }
  }

  /**
   * Récupère une activité par son ID
   * @param id - ID de l'activité
   * @returns Détails de l'activité
   */
  async getActivity(id: string): Promise<Activity> {
    try {
      const response = await api.get(`/activities/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getActivity');
    }
  }

  /**
   * Met à jour une activité
   * @param id - ID de l'activité
   * @param data - Données à mettre à jour
   * @returns Activité mise à jour
   */
  async updateActivity(id: string, data: Partial<Activity>): Promise<Activity> {
    try {
      const response = await api.patch(`/activities/${id}`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'updateActivity');
    }
  }

  /**
   * Supprime une activité
   * @param id - ID de l'activité
   */
  async deleteActivity(id: string): Promise<void> {
    try {
      await api.delete(`/activities/${id}`);
    } catch (error) {
      throw handleApiError(error, 'deleteActivity');
    }
  }
  // #endregion

  // #region Services des défis 7 Majeurs
  /**
   * Récupère tous les défis 7 Majeurs
   * @returns Liste des défis
   */
  async getAllMajeurs7Challenges(): Promise<Majeurs7Challenge[]> {
    try {
      const response = await api.get('/majeurs7/challenges');
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getAllMajeurs7Challenges');
    }
  }

  /**
   * Récupère un défi 7 Majeurs par son ID
   * @param id - ID du défi
   * @returns Détails du défi
   */
  async getMajeurs7Challenge(id: string): Promise<Majeurs7Challenge> {
    try {
      const response = await api.get(`/majeurs7/challenges/${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getMajeurs7Challenge');
    }
  }

  /**
   * Démarre un défi 7 Majeurs pour un utilisateur
   * @param userId - ID de l'utilisateur
   * @param challengeId - ID du défi
   * @returns Progression initialisée
   */
  async startMajeurs7Challenge(userId: string, challengeId: string): Promise<Majeurs7Progress> {
    try {
      const response = await api.post(`/users/${userId}/majeurs7`, { challengeId });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'startMajeurs7Challenge');
    }
  }

  /**
   * Récupère la progression d'un utilisateur sur un défi 7 Majeurs
   * @param userId - ID de l'utilisateur
   * @param challengeId - ID du défi
   * @returns Progression
   */
  async getMajeurs7Progress(userId: string, challengeId: string): Promise<Majeurs7Progress> {
    try {
      const response = await api.get(`/users/${userId}/majeurs7/${challengeId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getMajeurs7Progress');
    }
  }

  /**
   * Met à jour la progression d'un utilisateur sur un défi 7 Majeurs
   * @param userId - ID de l'utilisateur
   * @param progress - Données de progression
   * @returns Progression mise à jour
   */
  async updateMajeurs7Progress(userId: string, progress: Partial<Majeurs7Progress>): Promise<Majeurs7Progress> {
    try {
      const response = await api.patch(
        `/users/${userId}/majeurs7/${progress.challengeId}`,
        progress
      );
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'updateMajeurs7Progress');
    }
  }
  // #endregion

  // #region Services météo
  /**
   * Récupère les données météo pour un col
   * @param colId - ID du col
   * @returns Données météo
   */
  async getColWeather(colId: string): Promise<WeatherData> {
    try {
      const response = await api.get(`/weather/col/${colId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getColWeather');
    }
  }

  /**
   * Récupère les données météo pour des coordonnées
   * @param lat - Latitude
   * @param lng - Longitude
   * @returns Données météo
   */
  async getLocationWeather(lat: number, lng: number): Promise<WeatherData> {
    try {
      const response = await api.get('/weather/location', {
        params: { lat, lng }
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getLocationWeather');
    }
  }

  /**
   * Récupère les prévisions météo pour un col
   * @param colId - ID du col
   * @param days - Nombre de jours de prévision
   * @returns Prévisions
   */
  async getWeatherForecast(colId: string, days: number = 5): Promise<WeatherData[]> {
    try {
      const response = await api.get(`/weather/forecast/${colId}`, {
        params: { days }
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getWeatherForecast');
    }
  }
  // #endregion

  // #region Services d'entraînement
  /**
   * Récupère tous les plans d'entraînement d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @returns Plans d'entraînement
   */
  async getUserTrainingPlans(userId: string): Promise<TrainingPlan[]> {
    try {
      const response = await api.get(`/users/${userId}/training/plans`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getUserTrainingPlans');
    }
  }

  /**
   * Récupère un plan d'entraînement par son ID
   * @param planId - ID du plan
   * @returns Plan d'entraînement
   */
  async getTrainingPlan(planId: string): Promise<TrainingPlan> {
    try {
      const response = await api.get(`/training/plans/${planId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getTrainingPlan');
    }
  }

  /**
   * Crée un nouveau plan d'entraînement
   * @param plan - Données du plan
   * @returns Plan créé
   */
  async createTrainingPlan(plan: Partial<TrainingPlan>): Promise<TrainingPlan> {
    try {
      const response = await api.post('/training/plans', plan);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'createTrainingPlan');
    }
  }

  /**
   * Met à jour un plan d'entraînement
   * @param planId - ID du plan
   * @param data - Données à mettre à jour
   * @returns Plan mis à jour
   */
  async updateTrainingPlan(planId: string, data: Partial<TrainingPlan>): Promise<TrainingPlan> {
    try {
      const response = await api.patch(`/training/plans/${planId}`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'updateTrainingPlan');
    }
  }

  /**
   * Met à jour la valeur FTP d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @param value - Nouvelle valeur FTP
   * @param method - Méthode de détermination
   * @returns Entrée FTP créée
   */
  async updateFTP(userId: string, value: number, method: string): Promise<FTPRecord> {
    try {
      const response = await api.post(`/users/${userId}/training/ftp`, { value, method });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'updateFTP');
    }
  }

  /**
   * Récupère l'historique FTP d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @returns Historique FTP
   */
  async getFTPHistory(userId: string): Promise<FTPRecord[]> {
    try {
      const response = await api.get(`/users/${userId}/training/ftp`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getFTPHistory');
    }
  }
  // #endregion

  // #region Services de nutrition
  /**
   * Récupère le plan nutritionnel d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @returns Plan nutritionnel
   */
  async getUserNutritionPlan(userId: string): Promise<NutritionPlan> {
    try {
      const response = await api.get(`/users/${userId}/nutrition/plan`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getUserNutritionPlan');
    }
  }

  /**
   * Met à jour le plan nutritionnel
   * @param planId - ID du plan
   * @param data - Données à mettre à jour
   * @returns Plan mis à jour
   */
  async updateNutritionPlan(planId: string, data: Partial<NutritionPlan>): Promise<NutritionPlan> {
    try {
      const response = await api.patch(`/nutrition/plans/${planId}`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'updateNutritionPlan');
    }
  }

  /**
   * Récupère le journal nutritionnel pour une date
   * @param userId - ID de l'utilisateur
   * @param date - Date au format YYYY-MM-DD
   * @returns Journal nutritionnel
   */
  async getNutritionLog(userId: string, date: string): Promise<NutritionLog> {
    try {
      const response = await api.get(`/users/${userId}/nutrition/log`, {
        params: { date }
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getNutritionLog');
    }
  }

  /**
   * Crée une entrée dans le journal nutritionnel
   * @param userId - ID de l'utilisateur
   * @param log - Données du journal
   * @returns Entrée créée
   */
  async createNutritionLogEntry(userId: string, log: Partial<NutritionEntry>): Promise<NutritionEntry> {
    try {
      const response = await api.post(`/users/${userId}/nutrition/log`, log);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'createNutritionLogEntry');
    }
  }

  /**
   * Récupère des recettes selon critères
   * @param query - Termes de recherche
   * @param tags - Tags des recettes
   * @returns Recettes correspondantes
   */
  async getNutritionRecipes(query?: string, tags?: string[]): Promise<NutritionRecipe[]> {
    try {
      const params: Record<string, any> = {};
      if (query) params.q = query;
      if (tags && tags.length) params.tags = tags.join(',');
      
      const response = await api.get('/nutrition/recipes', { params });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getNutritionRecipes');
    }
  }

  /**
   * Récupère une recette par son ID
   * @param recipeId - ID de la recette
   * @returns Détails de la recette
   */
  async getNutritionRecipe(recipeId: string): Promise<NutritionRecipe> {
    try {
      const response = await api.get(`/nutrition/recipes/${recipeId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getNutritionRecipe');
    }
  }

  /**
   * Récupère les préférences nutritionnelles d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @returns Préférences nutritionnelles
   */
  async getUserNutritionPreferences(userId: string): Promise<any> {
    try {
      const response = await api.get(`/users/${userId}/nutrition/preferences`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getUserNutritionPreferences');
    }
  }

  /**
   * Met à jour les préférences nutritionnelles d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @param preferences - Nouvelles préférences
   * @returns Préférences mises à jour
   */
  async updateUserNutritionPreferences(userId: string, preferences: any): Promise<any> {
    try {
      const response = await api.put(`/users/${userId}/nutrition/preferences`, preferences);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'updateUserNutritionPreferences');
    }
  }

  /**
   * Calcule les besoins nutritionnels en fonction des paramètres
   * @param params - Paramètres de calcul
   * @returns Valeurs nutritionnelles calculées
   */
  async calculateNutrition(params: any): Promise<any> {
    try {
      const response = await api.post('/nutrition/calculate', params);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'calculateNutrition');
    }
  }

  /**
   * Récupère les statistiques nutritionnelles d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @param startDate - Date de début
   * @param endDate - Date de fin
   * @returns Statistiques nutritionnelles
   */
  async getUserNutritionStats(userId: string, startDate: string, endDate: string): Promise<any> {
    try {
      const response = await api.get(`/users/${userId}/nutrition/stats`, {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getUserNutritionStats');
    }
  }

  /**
   * Génère un plan de repas personnalisé
   * @param userId - ID de l'utilisateur
   * @param params - Paramètres de génération
   * @returns Plan de repas personnalisé
   */
  async generatePersonalizedMealPlan(userId: string, params: any): Promise<any> {
    try {
      const response = await api.post(`/users/${userId}/nutrition/meal-plan`, params);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'generatePersonalizedMealPlan');
    }
  }

  /**
   * Récupère les éléments nutritionnels favoris d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @returns Éléments favoris
   */
  async getUserFavoriteNutritionItems(userId: string): Promise<any> {
    try {
      const response = await api.get(`/users/${userId}/nutrition/favorites`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getUserFavoriteNutritionItems');
    }
  }

  /**
   * Ajoute un élément nutritionnel aux favoris
   * @param userId - ID de l'utilisateur
   * @param itemId - ID de l'élément
   * @param itemType - Type d'élément
   * @returns Liste mise à jour des favoris
   */
  async addNutritionItemToFavorites(userId: string, itemId: string, itemType: string): Promise<any> {
    try {
      const response = await api.post(`/users/${userId}/nutrition/favorites`, {
        itemId,
        itemType
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'addNutritionItemToFavorites');
    }
  }

  /**
   * Supprime un élément nutritionnel des favoris
   * @param userId - ID de l'utilisateur
   * @param itemId - ID de l'élément
   * @param itemType - Type d'élément
   * @returns Liste mise à jour des favoris
   */
  async removeNutritionItemFromFavorites(userId: string, itemId: string, itemType: string): Promise<any> {
    try {
      const response = await api.delete(`/users/${userId}/nutrition/favorites`, {
        data: { itemId, itemType }
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'removeNutritionItemFromFavorites');
    }
  }
  // #endregion

  // #region Services utilisateur avancés
  /**
   * Récupère les favoris d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @returns Favoris de l'utilisateur
   */
  async getUserFavorites(userId: string): Promise<any> {
    try {
      const response = await api.get(`/users/${userId}/favorites`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getUserFavorites');
    }
  }

  /**
   * Ajoute un élément aux favoris
   * @param userId - ID de l'utilisateur
   * @param type - Type d'élément (cols, routes, etc.)
   * @param itemId - ID de l'élément
   * @returns Favoris mis à jour
   */
  async addToFavorites(userId: string, type: string, itemId: string): Promise<any> {
    try {
      const response = await api.post(`/users/${userId}/favorites`, {
        type,
        itemId
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'addToFavorites');
    }
  }

  /**
   * Supprime un élément des favoris
   * @param userId - ID de l'utilisateur
   * @param type - Type d'élément (cols, routes, etc.)
   * @param itemId - ID de l'élément
   * @returns Favoris mis à jour
   */
  async removeFromFavorites(userId: string, type: string, itemId: string): Promise<any> {
    try {
      const response = await api.delete(`/users/${userId}/favorites`, {
        data: { type, itemId }
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'removeFromFavorites');
    }
  }
  // #endregion

  // #region Services forum
  /**
   * Récupère toutes les catégories du forum
   * @returns Liste des catégories
   */
  async getForumCategories(): Promise<ForumCategory[]> {
    try {
      const response = await api.get('/forum/categories');
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getForumCategories');
    }
  }

  /**
   * Récupère les sujets d'une catégorie
   * @param categoryId - ID de la catégorie
   * @param page - Numéro de page
   * @param pageSize - Taille de la page
   * @returns Sujets paginés
   */
  async getForumTopics(
    categoryId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ topics: ForumTopic[]; total: number }> {
    try {
      const response = await api.get(`/forum/categories/${categoryId}/topics`, {
        params: { page, pageSize }
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getForumTopics');
    }
  }

  /**
   * Récupère les messages d'un sujet
   * @param topicId - ID du sujet
   * @param page - Numéro de page
   * @param pageSize - Taille de la page
   * @returns Messages paginés
   */
  async getForumPosts(
    topicId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ posts: ForumPost[]; total: number }> {
    try {
      const response = await api.get(`/forum/topics/${topicId}/posts`, {
        params: { page, pageSize }
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getForumPosts');
    }
  }

  /**
   * Crée un nouveau sujet de forum
   * @param categoryId - ID de la catégorie
   * @param title - Titre du sujet
   * @param content - Contenu du premier message
   * @returns Sujet créé
   */
  async createForumTopic(categoryId: string, title: string, content: string): Promise<ForumTopic> {
    try {
      const response = await api.post(`/forum/categories/${categoryId}/topics`, {
        title,
        content
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'createForumTopic');
    }
  }

  /**
   * Crée un nouveau message dans un sujet
   * @param topicId - ID du sujet
   * @param content - Contenu du message
   * @returns Message créé
   */
  async createForumPost(topicId: string, content: string): Promise<ForumPost> {
    try {
      const response = await api.post(`/forum/topics/${topicId}/posts`, { content });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'createForumPost');
    }
  }
  // #endregion

  // #region Services d'authentification
  /**
   * Authentifie un utilisateur
   * @param email - Email de l'utilisateur
   * @param password - Mot de passe
   * @returns Token et profil utilisateur
   */
  async login(email: string, password: string): Promise<{ token: string; user: UserProfile }> {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'login');
    }
  }

  /**
   * Enregistre un nouvel utilisateur
   * @param userData - Données d'inscription
   * @returns Token et profil utilisateur
   */
  async register(userData: { email: string; password: string; username: string }): Promise<{ token: string; user: UserProfile }> {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'register');
    }
  }

  /**
   * Rafraîchit le token d'authentification
   * @returns Nouveau token
   */
  async refreshToken(): Promise<{ token: string }> {
    try {
      const response = await api.post('/auth/refresh');
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'refreshToken');
    }
  }

  /**
   * Déconnecte l'utilisateur
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      throw handleApiError(error, 'logout');
    }
  }
  // #endregion

  // #region Services Strava
  /**
   * Connecte un compte Strava
   * @param userId - ID de l'utilisateur
   * @param code - Code d'autorisation Strava
   * @returns Statut de la connexion
   */
  async connectStrava(userId: string, code: string): Promise<{ success: boolean }> {
    try {
      const response = await api.post(`/users/${userId}/strava/connect`, { code });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'connectStrava');
    }
  }

  /**
   * Déconnecte un compte Strava
   * @param userId - ID de l'utilisateur
   * @returns Statut de la déconnexion
   */
  async disconnectStrava(userId: string): Promise<{ success: boolean }> {
    try {
      const response = await api.post(`/users/${userId}/strava/disconnect`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'disconnectStrava');
    }
  }

  /**
   * Synchronise les activités Strava
   * @param userId - ID de l'utilisateur
   * @returns Statut et nombre d'activités synchronisées
   */
  async syncStravaActivities(userId: string): Promise<{ success: boolean; activitiesCount: number }> {
    try {
      const response = await api.post(`/users/${userId}/strava/sync`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'syncStravaActivities');
    }
  }
  // #endregion

  // #region Services de recherche
  /**
   * Recherche globale dans l'application
   * @param query - Terme de recherche
   * @returns Résultats par catégorie
   */
  async searchGlobal(query: string): Promise<{
    cols: Col[];
    activities: Activity[];
    topics: ForumTopic[];
  }> {
    try {
      const response = await api.get('/search', { params: { q: query } });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'searchGlobal');
    }
  }
  // #endregion
}

// Créer une instance unique
const realApiOrchestrator = new RealApiOrchestrator();

// Export de l'instance unique
export default realApiOrchestrator;
