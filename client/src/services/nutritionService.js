/**
 * Service de gestion des données de nutrition pour les cyclistes
 * Fournit les fonctions pour récupérer et mettre à jour les données nutritionnelles
 * Utilise RealApiOrchestrator pour gérer les appels API réels.
 */
import RealApiOrchestrator from './api/RealApiOrchestrator';
import RealApiOrchestratorPart2 from './api/RealApiOrchestratorPart2';

/**
 * Service pour la gestion des données de nutrition
 */
class NutritionService {
  constructor() {
    // Reference to the API orchestrator
    this.apiOrchestrator = RealApiOrchestrator;
    this.apiOrchestratorPart2 = RealApiOrchestratorPart2;
  }

  /**
   * Récupère les données de nutrition d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} - Données nutritionnelles de l'utilisateur
   */
  async getUserNutritionData(userId) {
    try {
      if (!userId) {
        throw new Error('ID utilisateur requis');
      }

      // Call the orchestrator directly - no mock data checks
      return await this.apiOrchestratorPart2.getNutritionData(userId);
    } catch (error) {
      console.error('Erreur lors de la récupération des données nutritionnelles:', error);
      throw error;
    }
  }

  /**
   * Enregistre un repas dans le journal alimentaire
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} mealData - Données du repas
   * @returns {Promise<Object>} - Confirmation d'enregistrement
   */
  async logMeal(userId, mealData) {
    try {
      if (!userId || !mealData) {
        throw new Error('Paramètres incomplets pour l\'enregistrement du repas');
      }

      return await this.apiOrchestratorPart2.createNutritionLogEntry({
        userId,
        ...mealData
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du repas:', error);
      throw error;
    }
  }

  /**
   * Récupère les plans de repas recommandés pour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} type - Type de plan (ride-day, recovery-day, etc.)
   * @returns {Promise<Array>} - Plans de repas recommandés
   */
  async getMealPlans(userId, type = null) {
    try {
      return await this.apiOrchestratorPart2.getUserNutritionPlan(userId);
    } catch (error) {
      console.error('Erreur lors de la récupération des plans de repas:', error);
      throw error;
    }
  }

  /**
   * Calcule les besoins nutritionnels en fonction des paramètres utilisateur
   * @param {Object} userData - Données utilisateur (poids, taille, etc.)
   * @param {Object} activityData - Données d'activité (durée, intensité, etc.)
   * @returns {Promise<Object>} - Besoins nutritionnels calculés
   */
  async calculateNutrition(userData, activityData) {
    try {
      if (!userData || !activityData) {
        throw new Error('Paramètres insuffisants pour le calcul nutritionnel');
      }

      // This would need to be implemented in RealApiOrchestrator if not already
      // For now, we'll use a direct API call as a temporary solution
      const response = await fetch('/nutrition/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userData, activityData })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors du calcul nutritionnel:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les recettes disponibles pour les cyclistes
   * @returns {Promise<Array>} Liste des recettes disponibles
   */
  async getRecipes() {
    try {
      return await this.apiOrchestratorPart2.getNutritionRecipes();
    } catch (error) {
      console.error('Erreur lors de la récupération des recettes:', error);
      throw error;
    }
  }

  /**
   * Récupère une recette spécifique par son ID
   * @param {string} id - ID de la recette
   * @returns {Promise<Object>} Détails de la recette
   */
  async getNutritionRecipeById(id) {
    try {
      if (!id) {
        throw new Error('ID de recette requis');
      }

      return await this.apiOrchestratorPart2.getNutritionRecipe(id);
    } catch (error) {
      console.error('Erreur lors de la récupération de la recette:', error);
      throw error;
    }
  }

  /**
   * Récupère les recettes favorites d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Array>} Liste des recettes favorites
   */
  async getUserFavoriteRecipes(userId) {
    try {
      if (!userId) {
        throw new Error('ID utilisateur requis');
      }

      // This would need to be implemented in RealApiOrchestrator if not already
      const response = await fetch(`/users/${userId}/favorites/recipes`);
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de la récupération des recettes favorites:', error);
      throw error;
    }
  }

  /**
   * Ajoute une recette aux favoris d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} recipeId - ID de la recette à ajouter
   * @returns {Promise<void>}
   */
  async addToFavorites(userId, recipeId) {
    try {
      if (!userId || !recipeId) {
        throw new Error('Paramètres incomplets');
      }

      // This would need to be implemented in RealApiOrchestrator if not already
      const response = await fetch(`/users/${userId}/favorites/recipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ recipeId })
      });
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors de l\'ajout aux favoris:', error);
      throw error;
    }
  }

  /**
   * Retire une recette des favoris d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} recipeId - ID de la recette à retirer
   * @returns {Promise<void>}
   */
  async removeFromFavorites(userId, recipeId) {
    try {
      if (!userId || !recipeId) {
        throw new Error('Paramètres incomplets');
      }

      // This would need to be implemented in RealApiOrchestrator if not already
      const response = await fetch(`/users/${userId}/favorites/recipes/${recipeId}`, {
        method: 'DELETE'
      });
      
      return await response.json();
    } catch (error) {
      console.error('Erreur lors du retrait des favoris:', error);
      throw error;
    }
  }
}

// Export as singleton
const nutritionService = new NutritionService();
export default nutritionService;
