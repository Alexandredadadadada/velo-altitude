/**
 * Service de gestion des plans de repas
 * 
 * Responsable des fonctionnalités liées aux plans de repas et calculs nutritionnels
 */

import api from '../apiWrapper';
import RealApiOrchestrator from '../api/RealApiOrchestrator';
import { 
  MealPlan, 
  Meal, 
  NutritionCalculationParams, 
  NutritionValues,
  NutritionApiParams,
  UserNutritionData
} from '../../types/nutrition';

/**
 * Service pour la gestion des plans de repas et calculs nutritionnels
 */
class MealPlanService {
  /**
   * Récupère les plans de repas recommandés pour un utilisateur
   * @param params - Paramètres de filtrage des plans de repas
   * @returns Plans de repas recommandés
   */
  async getMealPlans(params?: NutritionApiParams['getMealPlans']): Promise<MealPlan[]> {
    try {
      const response = await api.get('/nutrition/meal-plans', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des plans de repas:', error);
      throw error;
    }
  }

  /**
   * Enregistre un repas dans le journal alimentaire
   * @param userId - ID de l'utilisateur
   * @param mealData - Données du repas
   * @returns Confirmation d'enregistrement
   */
  async logMeal(userId: string, mealData: Meal): Promise<{ success: boolean; mealId: string }> {
    try {
      if (!userId || !mealData) {
        throw new Error('Paramètres incomplets pour l\'enregistrement du repas');
      }

      const response = await api.post(`/users/${userId}/nutrition/meals`, mealData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du repas:', error);
      throw error;
    }
  }

  /**
   * Calcule les besoins nutritionnels en fonction des paramètres utilisateur
   * @param params - Paramètres pour le calcul
   * @returns Besoins nutritionnels calculés
   */
  async calculateNutrition(params: NutritionCalculationParams): Promise<NutritionValues> {
    try {
      if (!params.userData || !params.activityData) {
        throw new Error('Paramètres insuffisants pour le calcul nutritionnel');
      }

      // Utilisation de RealApiOrchestrator pour le calcul nutritionnel
      const response = await RealApiOrchestrator.calculateNutrition(params);
      return response.data;
    } catch (error) {
      console.error('Erreur lors du calcul nutritionnel:', error);
      throw error;
    }
  }

  /**
   * Récupère les données de nutrition d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @returns Données nutritionnelles de l'utilisateur
   */
  async getUserNutritionData(userId: string): Promise<UserNutritionData> {
    try {
      if (!userId) {
        throw new Error('ID utilisateur requis');
      }

      const response = await api.get(`/users/${userId}/nutrition`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des données nutritionnelles:', error);
      throw error;
    }
  }

  /**
   * Génère un plan de repas personnalisé pour un utilisateur
   * @param userId - ID de l'utilisateur
   * @param params - Paramètres pour la génération du plan
   * @returns Plan de repas personnalisé
   */
  async generatePersonalizedMealPlan(
    userId: string, 
    params: { 
      duration: number; 
      goal: string; 
      intensity: string;
      dietPreferences: string[];
      allergies: string[];
    }
  ): Promise<MealPlan> {
    try {
      if (!userId) {
        throw new Error('ID utilisateur requis');
      }

      const response = await RealApiOrchestrator.generatePersonalizedMealPlan(userId, params);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la génération du plan personnalisé:', error);
      throw error;
    }
  }
}

export default new MealPlanService();
