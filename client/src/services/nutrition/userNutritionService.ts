/**
 * Service de gestion des données nutritionnelles des utilisateurs
 * Version TypeScript avec utilisation de RealApiOrchestrator
 * 
 * Ce service a été refactorisé pour supprimer les mocks intrusifs
 * et utiliser l'approche recommandée avec RealApiOrchestrator.
 */

import RealApiOrchestrator from '../api/RealApiOrchestrator';
import { UserPreferences, NutritionItem, UserFavorites } from '../../types/nutrition';

/**
 * Récupère les préférences nutritionnelles d'un utilisateur
 * @param userId - ID de l'utilisateur
 * @returns Préférences nutritionnelles de l'utilisateur
 */
export async function getUserNutritionPreferences(userId: string): Promise<UserPreferences> {
  try {
    // Utilisation de RealApiOrchestrator au lieu d'une implémentation mockée en dur
    const response = await RealApiOrchestrator.getUserNutritionPreferences(userId);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des préférences nutritionnelles:', error);
    throw error;
  }
}

/**
 * Met à jour les préférences nutritionnelles d'un utilisateur
 * @param userId - ID de l'utilisateur
 * @param preferences - Nouvelles préférences à enregistrer
 * @returns Préférences mises à jour
 */
export async function updateUserNutritionPreferences(
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<UserPreferences> {
  try {
    const response = await RealApiOrchestrator.updateUserNutritionPreferences(userId, preferences);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour des préférences nutritionnelles:', error);
    throw error;
  }
}

/**
 * Récupère les favoris d'un utilisateur
 * @param userId - ID de l'utilisateur
 * @returns Liste des éléments favoris
 */
export async function getUserFavoriteNutritionItems(userId: string): Promise<UserFavorites> {
  try {
    const response = await RealApiOrchestrator.getUserFavoriteNutritionItems(userId);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des favoris:', error);
    throw error;
  }
}

/**
 * Ajoute un élément aux favoris d'un utilisateur
 * @param userId - ID de l'utilisateur
 * @param itemId - ID de l'élément à ajouter aux favoris
 * @param itemType - Type d'élément (recette, aliment, etc.)
 * @returns Liste mise à jour des favoris
 */
export async function addToFavorites(
  userId: string,
  itemId: string,
  itemType: 'recipe' | 'food' | 'mealPlan'
): Promise<UserFavorites> {
  try {
    const response = await RealApiOrchestrator.addNutritionItemToFavorites(userId, itemId, itemType);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de l\'ajout aux favoris:', error);
    throw error;
  }
}

/**
 * Supprime un élément des favoris d'un utilisateur
 * @param userId - ID de l'utilisateur
 * @param itemId - ID de l'élément à supprimer des favoris
 * @param itemType - Type d'élément (recette, aliment, etc.)
 * @returns Liste mise à jour des favoris
 */
export async function removeFromFavorites(
  userId: string,
  itemId: string,
  itemType: 'recipe' | 'food' | 'mealPlan'
): Promise<UserFavorites> {
  try {
    const response = await RealApiOrchestrator.removeNutritionItemFromFavorites(userId, itemId, itemType);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la suppression des favoris:', error);
    throw error;
  }
}

/**
 * Récupère les statistiques nutritionnelles d'un utilisateur sur une période
 * @param userId - ID de l'utilisateur
 * @param startDate - Date de début (format ISO)
 * @param endDate - Date de fin (format ISO)
 * @returns Statistiques nutritionnelles pour la période
 */
export async function getUserNutritionStats(
  userId: string,
  startDate: string,
  endDate: string
): Promise<any> {
  try {
    const response = await RealApiOrchestrator.getUserNutritionStats(userId, startDate, endDate);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques nutritionnelles:', error);
    throw error;
  }
}
