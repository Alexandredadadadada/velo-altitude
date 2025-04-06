import axios from 'axios';
import { Recipe, NutritionPlan, NutritionLogEntry, NutritionPreferences, ApiResponse } from '../../../types';

export class NutritionService {
  private apiBaseUrl: string;
  private recipesUrl: string;
  private plansUrl: string;
  private logsUrl: string;

  constructor() {
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    this.recipesUrl = `${this.apiBaseUrl}/recipes`;
    this.plansUrl = `${this.apiBaseUrl}/nutrition-plans`;
    this.logsUrl = `${this.apiBaseUrl}/nutrition-logs`;
  }

  // ===================== RECETTES =====================

  async getAllRecipes(): Promise<Recipe[]> {
    try {
      const response = await axios.get<ApiResponse<Recipe[]>>(this.recipesUrl);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des recettes:', error);
      throw error;
    }
  }

  async getRecipeById(id: string): Promise<Recipe> {
    try {
      const response = await axios.get<ApiResponse<Recipe>>(`${this.recipesUrl}/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la recette ${id}:`, error);
      throw error;
    }
  }

  async searchRecipes(query: string): Promise<Recipe[]> {
    try {
      const response = await axios.get<ApiResponse<Recipe[]>>(`${this.recipesUrl}/search?q=${encodeURIComponent(query)}`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la recherche de recettes:', error);
      throw error;
    }
  }

  async getRecipesByCategory(category: 'before' | 'during' | 'after' | 'special'): Promise<Recipe[]> {
    try {
      const response = await axios.get<ApiResponse<Recipe[]>>(`${this.recipesUrl}/category/${category}`);
      return response.data.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des recettes de catégorie ${category}:`, error);
      throw error;
    }
  }

  async getRecipesByTags(tags: string[]): Promise<Recipe[]> {
    try {
      const tagsParam = tags.map(tag => `tags=${encodeURIComponent(tag)}`).join('&');
      const response = await axios.get<ApiResponse<Recipe[]>>(`${this.recipesUrl}/tags?${tagsParam}`);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des recettes par tags:', error);
      throw error;
    }
  }

  async getRecipesForCol(colId: string): Promise<Recipe[]> {
    try {
      const response = await axios.get<ApiResponse<Recipe[]>>(`${this.recipesUrl}/recommended-for-col/${colId}`);
      return response.data.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des recettes recommandées pour le col ${colId}:`, error);
      throw error;
    }
  }

  async createRecipe(recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<Recipe> {
    try {
      const response = await axios.post<ApiResponse<Recipe>>(this.recipesUrl, recipe);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la création de la recette:', error);
      throw error;
    }
  }

  async updateRecipe(id: string, recipe: Partial<Recipe>): Promise<Recipe> {
    try {
      const response = await axios.put<ApiResponse<Recipe>>(`${this.recipesUrl}/${id}`, recipe);
      return response.data.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la recette ${id}:`, error);
      throw error;
    }
  }

  async deleteRecipe(id: string): Promise<void> {
    try {
      await axios.delete(`${this.recipesUrl}/${id}`);
    } catch (error) {
      console.error(`Erreur lors de la suppression de la recette ${id}:`, error);
      throw error;
    }
  }

  // ===================== PLANS NUTRITIONNELS =====================

  async getUserNutritionPlans(userId: string): Promise<NutritionPlan[]> {
    try {
      const response = await axios.get<ApiResponse<NutritionPlan[]>>(`${this.plansUrl}/user/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des plans nutritionnels de l'utilisateur ${userId}:`, error);
      throw error;
    }
  }

  async getNutritionPlanById(id: string): Promise<NutritionPlan> {
    try {
      const response = await axios.get<ApiResponse<NutritionPlan>>(`${this.plansUrl}/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du plan nutritionnel ${id}:`, error);
      throw error;
    }
  }

  async createNutritionPlan(plan: Omit<NutritionPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<NutritionPlan> {
    try {
      const response = await axios.post<ApiResponse<NutritionPlan>>(this.plansUrl, plan);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la création du plan nutritionnel:', error);
      throw error;
    }
  }

  async updateNutritionPlan(id: string, plan: Partial<NutritionPlan>): Promise<NutritionPlan> {
    try {
      const response = await axios.put<ApiResponse<NutritionPlan>>(`${this.plansUrl}/${id}`, plan);
      return response.data.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du plan nutritionnel ${id}:`, error);
      throw error;
    }
  }

  async deleteNutritionPlan(id: string): Promise<void> {
    try {
      await axios.delete(`${this.plansUrl}/${id}`);
    } catch (error) {
      console.error(`Erreur lors de la suppression du plan nutritionnel ${id}:`, error);
      throw error;
    }
  }

  async getRecommendedPlanTemplate(
    userMetrics: {
      weight: number;
      height: number;
      age: number;
      sex: 'M' | 'F';
      activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
    },
    goal: 'weight_loss' | 'maintenance' | 'performance' | 'endurance' | 'climbing'
  ): Promise<NutritionPlan> {
    try {
      const response = await axios.post<ApiResponse<NutritionPlan>>(`${this.plansUrl}/recommended-template`, {
        userMetrics,
        goal
      });
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la génération du plan nutritionnel recommandé:', error);
      throw error;
    }
  }

  // ===================== JOURNAL NUTRITIONNEL =====================

  async getUserNutritionLogs(userId: string, startDate?: string, endDate?: string): Promise<NutritionLogEntry[]> {
    try {
      let url = `${this.logsUrl}/user/${userId}`;
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }
      const response = await axios.get<ApiResponse<NutritionLogEntry[]>>(url);
      return response.data.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du journal nutritionnel de l'utilisateur ${userId}:`, error);
      throw error;
    }
  }

  async getNutritionLogById(id: string): Promise<NutritionLogEntry> {
    try {
      const response = await axios.get<ApiResponse<NutritionLogEntry>>(`${this.logsUrl}/${id}`);
      return response.data.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'entrée de journal ${id}:`, error);
      throw error;
    }
  }

  async createNutritionLogEntry(entry: Omit<NutritionLogEntry, 'id'>): Promise<NutritionLogEntry> {
    try {
      const response = await axios.post<ApiResponse<NutritionLogEntry>>(this.logsUrl, entry);
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'entrée de journal nutritionnel:', error);
      throw error;
    }
  }

  async updateNutritionLogEntry(id: string, entry: Partial<NutritionLogEntry>): Promise<NutritionLogEntry> {
    try {
      const response = await axios.put<ApiResponse<NutritionLogEntry>>(`${this.logsUrl}/${id}`, entry);
      return response.data.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'entrée de journal ${id}:`, error);
      throw error;
    }
  }

  async deleteNutritionLogEntry(id: string): Promise<void> {
    try {
      await axios.delete(`${this.logsUrl}/${id}`);
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'entrée de journal ${id}:`, error);
      throw error;
    }
  }

  // ===================== PRÉFÉRENCES NUTRITIONNELLES =====================

  async getUserNutritionPreferences(userId: string): Promise<NutritionPreferences> {
    try {
      const response = await axios.get<ApiResponse<NutritionPreferences>>(`${this.apiBaseUrl}/users/${userId}/nutrition-preferences`);
      return response.data.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des préférences nutritionnelles de l'utilisateur ${userId}:`, error);
      throw error;
    }
  }

  async updateUserNutritionPreferences(userId: string, preferences: NutritionPreferences): Promise<NutritionPreferences> {
    try {
      const response = await axios.put<ApiResponse<NutritionPreferences>>(
        `${this.apiBaseUrl}/users/${userId}/nutrition-preferences`, 
        preferences
      );
      return response.data.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour des préférences nutritionnelles de l'utilisateur ${userId}:`, error);
      throw error;
    }
  }

  // ===================== CALCULATEUR NUTRITIONNEL =====================

  async calculateDailyNeeds(
    userMetrics: {
      weight: number; // en kg
      height: number; // en cm
      age: number;
      sex: 'M' | 'F';
      activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
    },
    goal: 'weight_loss' | 'maintenance' | 'performance' | 'endurance' | 'climbing'
  ): Promise<{
    calories: number;
    macros: { protein: number; carbs: number; fat: number }; // en grammes
    hydration: number; // en ml
  }> {
    try {
      const response = await axios.post<ApiResponse<{
        calories: number;
        macros: { protein: number; carbs: number; fat: number };
        hydration: number;
      }>>(`${this.apiBaseUrl}/nutrition-calculator`, {
        userMetrics,
        goal
      });
      return response.data.data;
    } catch (error) {
      console.error('Erreur lors du calcul des besoins nutritionnels:', error);
      throw error;
    }
  }
}
