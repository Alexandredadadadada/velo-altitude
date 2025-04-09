/**
 * Hook personnalisé pour gérer l'intégration des données nutritionnelles et d'entraînement
 * Fournit une interface unifiée pour synchroniser et récupérer les données entre les modules
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import nutritionService from '../services/nutritionService';
import trainingService from '../services/trainingService';
import trainingNutritionSync from '../services/orchestration/TrainingNutritionSync';

/**
 * Hook pour gérer l'intégration entre nutrition et entraînement
 * @param {string} userId - ID de l'utilisateur (optionnel, utilise auth si non fourni)
 * @param {Object} options - Options de configuration
 * @returns {Object} État et fonctions de synchronisation
 */
export const useNutritionTraining = (userId = null, options = {}) => {
  const { user } = useAuth();
  const activeUserId = userId || user?.id;
  
  const [syncState, setSyncState] = useState({
    isLoading: false,
    error: null,
    lastSynced: null,
    nutritionData: null,
    trainingData: null,
    recommendations: [],
    syncStatus: 'idle' // 'idle', 'syncing', 'success', 'error'
  });

  // Décider si les données doivent être chargées automatiquement
  const autoLoad = options.autoLoad !== undefined ? options.autoLoad : true;

  /**
   * Charge les données nutritionnelles et d'entraînement
   */
  const loadData = useCallback(async () => {
    if (!activeUserId) return;

    try {
      setSyncState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Récupération parallèle des données
      const [nutritionResult, trainingResult] = await Promise.all([
        nutritionService.getUserNutritionData(activeUserId),
        trainingService.getUserTrainingData(activeUserId)
      ]);
      
      // Générer des recommandations si les deux types de données sont disponibles
      let recommendations = [];
      if (nutritionResult && trainingResult) {
        try {
          // Simulation d'un appel pour générer des recommandations
          const syncPoint = trainingNutritionSync.syncPoints.PRE_WORKOUT;
          const nextWorkout = trainingResult.upcomingWorkouts?.[0];
          
          if (nextWorkout) {
            const syncResult = await trainingNutritionSync.syncWorkoutWithNutrition(
              nextWorkout.id,
              activeUserId
            );
            recommendations = [
              {
                type: 'pre_workout',
                workout: nextWorkout,
                ...syncResult.recommendations.pre
              },
              {
                type: 'during_workout',
                workout: nextWorkout,
                ...syncResult.recommendations.during
              },
              {
                type: 'post_workout',
                workout: nextWorkout,
                ...syncResult.recommendations.post
              }
            ];
          }
        } catch (recError) {
          console.error('Erreur lors de la génération des recommandations:', recError);
        }
      }
      
      setSyncState(prev => ({
        ...prev,
        isLoading: false,
        nutritionData: nutritionResult,
        trainingData: trainingResult,
        recommendations,
        lastSynced: new Date(),
        syncStatus: recommendations.length > 0 ? 'success' : 'idle'
      }));
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setSyncState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Une erreur est survenue lors du chargement des données.',
        syncStatus: 'error'
      }));
    }
  }, [activeUserId]);

  /**
   * Synchronise le plan nutritionnel avec le plan d'entraînement
   */
  const syncNutritionWithTraining = useCallback(async () => {
    if (!activeUserId || !syncState.trainingData) {
      throw new Error('Données insuffisantes pour la synchronisation');
    }

    try {
      setSyncState(prev => ({ ...prev, isLoading: true, syncStatus: 'syncing' }));
      
      const syncResult = await trainingNutritionSync.updateNutritionPlan(
        syncState.trainingData
      );
      
      setSyncState(prev => ({
        ...prev,
        isLoading: false,
        nutritionData: syncResult.nutritionPlan,
        lastSynced: new Date(),
        syncStatus: 'success',
        error: null
      }));
      
      return syncResult;
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
      setSyncState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Échec de la synchronisation: ' + error.message,
        syncStatus: 'error'
      }));
      throw error;
    }
  }, [activeUserId, syncState.trainingData]);

  /**
   * Génère des recommandations pour un entraînement spécifique
   */
  const getRecommendationsForWorkout = useCallback(async (workoutId) => {
    if (!activeUserId) {
      throw new Error('Utilisateur non identifié');
    }

    try {
      const syncResult = await trainingNutritionSync.syncWorkoutWithNutrition(
        workoutId,
        activeUserId
      );
      
      const formattedRecommendations = [
        {
          type: 'pre_workout',
          ...syncResult.recommendations.pre
        },
        {
          type: 'during_workout',
          ...syncResult.recommendations.during
        },
        {
          type: 'post_workout',
          ...syncResult.recommendations.post
        }
      ];
      
      setSyncState(prev => ({
        ...prev,
        recommendations: formattedRecommendations
      }));
      
      return formattedRecommendations;
    } catch (error) {
      console.error('Erreur lors de la génération des recommandations:', error);
      throw error;
    }
  }, [activeUserId]);

  /**
   * Met à jour les besoins caloriques en fonction de l'intensité d'entraînement
   */
  const updateCalorieNeeds = useCallback(async (trainingIntensity) => {
    if (!syncState.nutritionData) return null;
    
    try {
      const currentCalories = syncState.nutritionData.baseCalories || 2000;
      let adjustmentFactor;
      
      switch (trainingIntensity) {
        case 'low':
          adjustmentFactor = 1.3;
          break;
        case 'moderate':
          adjustmentFactor = 1.5;
          break;
        case 'high':
          adjustmentFactor = 1.7;
          break;
        case 'very_high':
          adjustmentFactor = 1.9;
          break;
        default:
          adjustmentFactor = 1.5;
      }
      
      const updatedCalories = Math.round(currentCalories * adjustmentFactor);
      
      return {
        baseCalories: currentCalories,
        trainingAdjustedCalories: updatedCalories,
        adjustmentFactor
      };
    } catch (error) {
      console.error('Erreur lors du calcul des besoins caloriques:', error);
      return null;
    }
  }, [syncState.nutritionData]);

  /**
   * Analyse la répartition nutritionnelle optimale pour un objectif spécifique
   */
  const analyzeNutritionDistribution = useCallback((objective) => {
    let recommendedDistribution = {
      carbs: 50,
      protein: 20,
      fat: 30
    };
    
    switch (objective) {
      case 'performance':
        recommendedDistribution = {
          carbs: 60,
          protein: 20,
          fat: 20
        };
        break;
      case 'endurance':
        recommendedDistribution = {
          carbs: 65,
          protein: 15,
          fat: 20
        };
        break;
      case 'strength':
        recommendedDistribution = {
          carbs: 50,
          protein: 30,
          fat: 20
        };
        break;
      case 'recovery':
        recommendedDistribution = {
          carbs: 55,
          protein: 25,
          fat: 20
        };
        break;
      case 'weight_loss':
        recommendedDistribution = {
          carbs: 40,
          protein: 30,
          fat: 30
        };
        break;
      case 'maintenance':
      default:
        // Valeurs par défaut déjà définies
        break;
    }
    
    return {
      objective,
      macroDistribution: recommendedDistribution,
      calorieAdjustment: objective === 'weight_loss' ? 0.85 : 1.0
    };
  }, []);

  // Charger les données automatiquement au montage si autoLoad est true
  useEffect(() => {
    if (autoLoad && activeUserId) {
      loadData();
    }
  }, [autoLoad, activeUserId, loadData]);

  return {
    ...syncState,
    loadData,
    syncNutritionWithTraining,
    getRecommendationsForWorkout,
    updateCalorieNeeds,
    analyzeNutritionDistribution
  };
};

export default useNutritionTraining;
