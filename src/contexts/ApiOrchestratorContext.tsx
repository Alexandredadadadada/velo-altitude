// src/contexts/ApiOrchestratorContext.tsx
import React, { createContext, ReactNode, useEffect, useState } from 'react';
import colService from '../../client/src/services/colService';
import authService from '../../client/src/services/authService';
import UserService from '../../client/src/services/UserService';
import stravaService from '../../client/src/services/stravaService';
import nutritionService from '../../client/src/services/nutritionService';
import trainingService from '../../client/src/services/trainingService';
import routeService from '../../client/src/services/routeService';
import socialService from '../../client/src/services/socialService';
import { UnifiedAPIService } from '../../client/src/services/api/unified-api-service';

// Interface pour l'orchestrateur d'API
interface ApiOrchestrator {
  // Core API Methods
  getAllCols: () => Promise<any[]>;
  getColById: (id: string) => Promise<any>;
  getUserProfile: () => Promise<any>;
  updateUserProfile: (data: any) => Promise<any>;
  
  // Authentication
  login: (credentials: any) => Promise<any>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string>;
  
  // User Profile Management
  getUserPreferences: () => Promise<any>;
  updateUserPreferences: (preferences: any) => Promise<any>;
  exportUserData: (format: string) => Promise<Blob>;
  updatePrivacySettings: (settings: any) => Promise<any>;
  updateNotificationSettings: (settings: any) => Promise<any>;
  
  // External Services
  connectWithStrava: () => Promise<any>;
  disconnectFromStrava: () => Promise<void>;
  importStravaActivities: () => Promise<any[]>;
  
  // Weather
  getWeatherForCol: (colId: string) => Promise<any>;
  getWeatherForecast: (lat: number, lng: number, days: number) => Promise<any>;
  
  // Training
  getTrainingPlans: () => Promise<any[]>;
  getTrainingPlanById: (id: string) => Promise<any>;
  createTrainingPlan: (plan: any) => Promise<any>;
  
  // Challenges
  getChallenges: () => Promise<any[]>;
  getChallengeById: (id: string) => Promise<any>;
  createChallenge: (challenge: any) => Promise<any>;
  updateChallengeProgress: (challengeId: string, progress: any) => Promise<any>;
  
  // Nutrition
  getNutritionRecipes: () => Promise<any[]>;
  getNutritionRecipeById: (id: string) => Promise<any>;
  logNutritionEntry: (entry: any) => Promise<any>;
  getNutritionLog: (startDate: string, endDate: string) => Promise<any[]>;
  
  // Community
  getForumTopics: () => Promise<any[]>;
  getForumPosts: (topicId: string) => Promise<any[]>;
  createForumPost: (post: any) => Promise<any>;
  
  // Miscellaneous
  isOnline: () => boolean;
  getApiStatus: () => Promise<any>;
}

// Context initial vide
export const ApiOrchestratorContext = createContext<ApiOrchestrator | null>(null);

// Props pour le provider
interface ApiOrchestratorProviderProps {
  children: ReactNode;
}

// Implementation du Provider
export const ApiOrchestratorProvider: React.FC<ApiOrchestratorProviderProps> = ({ children }) => {
  const [isOnlineStatus, setIsOnlineStatus] = useState(navigator.onLine);
  
  // Monitoring online status
  useEffect(() => {
    const handleOnline = () => setIsOnlineStatus(true);
    const handleOffline = () => setIsOnlineStatus(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Implémentation réelle des méthodes de l'API, connectant aux services appropriés
  const orchestrator: ApiOrchestrator = {
    // Core API Methods
    getAllCols: async () => {
      return colService.getAllCols();
    },
    
    getColById: async (id: string) => {
      return colService.getColById(id);
    },
    
    getUserProfile: async () => {
      return UserService.getUserProfile();
    },
    
    updateUserProfile: async (data: any) => {
      return UserService.updateProfile(data);
    },
    
    // Authentication
    login: async (credentials: any) => {
      return authService.login(credentials);
    },
    
    logout: async () => {
      return authService.logout();
    },
    
    refreshToken: async () => {
      return authService.refreshToken();
    },
    
    // User Profile Management
    getUserPreferences: async () => {
      return UserService.getUserPreferences();
    },
    
    updateUserPreferences: async (preferences: any) => {
      return UserService.updatePreferences(preferences);
    },
    
    exportUserData: async (format: string) => {
      return UserService.exportData(format);
    },
    
    updatePrivacySettings: async (settings: any) => {
      return UserService.updatePrivacySettings(settings);
    },
    
    updateNotificationSettings: async (settings: any) => {
      return UserService.updateNotificationSettings(settings);
    },
    
    // External Services
    connectWithStrava: async () => {
      return stravaService.connect();
    },
    
    disconnectFromStrava: async () => {
      return stravaService.disconnect();
    },
    
    importStravaActivities: async () => {
      return stravaService.importActivities();
    },
    
    // Weather
    getWeatherForCol: async (colId: string) => {
      return colService.getWeatherForCol(colId);
    },
    
    getWeatherForecast: async (lat: number, lng: number, days: number) => {
      return colService.getWeatherForecast(lat, lng, days);
    },
    
    // Training
    getTrainingPlans: async () => {
      return trainingService.getPlans();
    },
    
    getTrainingPlanById: async (id: string) => {
      return trainingService.getPlanById(id);
    },
    
    createTrainingPlan: async (plan: any) => {
      return trainingService.createPlan(plan);
    },
    
    // Challenges
    getChallenges: async () => {
      return UserService.getChallenges();
    },
    
    getChallengeById: async (id: string) => {
      return UserService.getChallengeById(id);
    },
    
    createChallenge: async (challenge: any) => {
      return UserService.createChallenge(challenge);
    },
    
    updateChallengeProgress: async (challengeId: string, progress: any) => {
      return UserService.updateChallengeProgress(challengeId, progress);
    },
    
    // Nutrition
    getNutritionRecipes: async () => {
      return nutritionService.getRecipes();
    },
    
    getNutritionRecipeById: async (id: string) => {
      return nutritionService.getNutritionRecipeById(id); 
    },
    
    logNutritionEntry: async (entry: any) => {
      // Utilise l'ID utilisateur courant
      const userId = UserService.getCurrentUserId();
      return nutritionService.logMeal(userId, entry);
    },
    
    getNutritionLog: async (startDate: string, endDate: string) => {
      const userId = UserService.getCurrentUserId();
      return nutritionService.getUserNutritionData(userId);
    },
    
    // Community
    getForumTopics: async () => {
      return socialService.getForumTopics();
    },
    
    getForumPosts: async (topicId: string) => {
      return socialService.getForumPosts(topicId);
    },
    
    createForumPost: async (post: any) => {
      return socialService.createForumPost(post);
    },
    
    // Miscellaneous
    isOnline: () => isOnlineStatus,
    
    getApiStatus: async () => {
      try {
        const apiService = new UnifiedAPIService();
        return apiService.getStats();
      } catch (error) {
        console.error('Erreur lors de la récupération du statut API:', error);
        return {
          status: isOnlineStatus ? 'degraded' : 'offline',
          error: error.message,
        };
      }
    }
  };
  
  return (
    <ApiOrchestratorContext.Provider value={orchestrator}>
      {children}
    </ApiOrchestratorContext.Provider>
  );
};
