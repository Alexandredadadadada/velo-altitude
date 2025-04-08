/**
 * Service pour la gestion des recettes nutritionnelles
 * 
 * Gère l'accès aux recettes, la récupération des détails et les favoris
 */

import api from '../apiWrapper';
import { Recipe, FavoriteResponse, NutritionApiParams } from '../../types/nutrition';

/**
 * Service des recettes pour la nutrition
 */
class RecipeService {
  /**
   * Récupère toutes les recettes disponibles pour les cyclistes
   * @param params - Paramètres optionnels pour filtrer les recettes
   * @returns Liste des recettes disponibles
   */
  async getRecipes(params?: NutritionApiParams['getRecipes']): Promise<Recipe[]> {
    try {
      const response = await api.get('/nutrition/recipes', { params });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des recettes:', error);
      throw error;
    }
  }

  /**
   * Récupère une recette spécifique par son ID
   * @param id - ID de la recette
   * @returns Détails de la recette
   */
  async getRecipeById(id: string): Promise<Recipe> {
    try {
      if (!id) {
        throw new Error('ID de recette requis');
      }

      const response = await api.get(`/nutrition/recipes/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la recette:', error);
      throw error;
    }
  }

  /**
   * Récupère les recettes favorites d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @returns Liste des recettes favorites
   */
  async getUserFavoriteRecipes(userId: string): Promise<Recipe[]> {
    try {
      if (!userId) {
        throw new Error('ID utilisateur requis');
      }

      const response = await api.get(`/users/${userId}/favorites/recipes`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des recettes favorites:', error);
      throw error;
    }
  }

  /**
   * Ajoute une recette aux favoris d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @param recipeId - ID de la recette à ajouter
   * @returns Réponse de confirmation
   */
  async addToFavorites(userId: string, recipeId: string): Promise<FavoriteResponse> {
    try {
      if (!userId || !recipeId) {
        throw new Error('Paramètres incomplets');
      }

      const response = await api.post(`/users/${userId}/favorites/recipes`, { recipeId });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'ajout aux favoris:', error);
      throw error;
    }
  }

  /**
   * Retire une recette des favoris d'un utilisateur
   * @param userId - ID de l'utilisateur
   * @param recipeId - ID de la recette à retirer
   * @returns Réponse de confirmation
   */
  async removeFromFavorites(userId: string, recipeId: string): Promise<FavoriteResponse> {
    try {
      if (!userId || !recipeId) {
        throw new Error('Paramètres incomplets');
      }

      const response = await api.delete(`/users/${userId}/favorites/recipes/${recipeId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors du retrait des favoris:', error);
      throw error;
    }
  }
}

export default new RecipeService();
