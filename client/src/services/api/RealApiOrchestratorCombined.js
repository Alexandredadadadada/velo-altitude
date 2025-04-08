/**
 * RealApiOrchestratorCombined
 * 
 * Ce fichier combine les trois parties de l'orchestrateur d'API réel
 * pour fournir une implémentation complète de l'interface ApiOrchestrator
 * qui utilise de vrais appels API au lieu de données mockées.
 */

import part1 from './RealApiOrchestrator';
import part2 from './RealApiOrchestratorPart2';
import part3 from './RealApiOrchestratorPart3';

// Combiner les trois parties en un seul objet
const RealApiOrchestrator = {
  // Part 1: Services des cols et utilisateurs
  getAllCols: part1.getAllCols,
  getColById: part1.getColById,
  getColsByRegion: part1.getColsByRegion,
  getColsByDifficulty: part1.getColsByDifficulty,
  searchCols: part1.searchCols,
  getUserProfile: part1.getUserProfile,
  updateUserProfile: part1.updateUserProfile,
  getUserActivities: part1.getUserActivities,
  createActivity: part1.createActivity,
  getActivity: part1.getActivity,
  updateActivity: part1.updateActivity,
  deleteActivity: part1.deleteActivity,
  
  // Part 2: Services 7 Majeurs, météo, entraînement et nutrition
  getAllMajeurs7Challenges: part2.getAllMajeurs7Challenges,
  getMajeurs7Challenge: part2.getMajeurs7Challenge,
  startMajeurs7Challenge: part2.startMajeurs7Challenge,
  getMajeurs7Progress: part2.getMajeurs7Progress,
  updateMajeurs7Progress: part2.updateMajeurs7Progress,
  getColWeather: part2.getColWeather,
  getLocationWeather: part2.getLocationWeather,
  getWeatherForecast: part2.getWeatherForecast,
  getUserTrainingPlans: part2.getUserTrainingPlans,
  getTrainingPlan: part2.getTrainingPlan,
  createTrainingPlan: part2.createTrainingPlan,
  updateTrainingPlan: part2.updateTrainingPlan,
  updateFTP: part2.updateFTP,
  getFTPHistory: part2.getFTPHistory,
  getUserNutritionPlan: part2.getUserNutritionPlan,
  updateNutritionPlan: part2.updateNutritionPlan,
  getNutritionLog: part2.getNutritionLog,
  createNutritionLogEntry: part2.createNutritionLogEntry,
  getNutritionRecipes: part2.getNutritionRecipes,
  getNutritionRecipe: part2.getNutritionRecipe,
  
  // Part 3: Services forum, auth, Strava et recherche
  getForumCategories: part3.getForumCategories,
  getForumTopics: part3.getForumTopics,
  getForumPosts: part3.getForumPosts,
  createForumTopic: part3.createForumTopic,
  createForumPost: part3.createForumPost,
  login: part3.login,
  register: part3.register,
  refreshToken: part3.refreshToken,
  logout: part3.logout,
  connectStrava: part3.connectStrava,
  disconnectStrava: part3.disconnectStrava,
  syncStravaActivities: part3.syncStravaActivities,
  searchGlobal: part3.searchGlobal
};

// Vérifier l'exhaustivité de l'implémentation
const checkImplementation = () => {
  // Liste des méthodes requises par l'interface ApiOrchestrator
  const requiredMethods = [
    // Cols
    'getAllCols', 'getColById', 'getColsByRegion', 'getColsByDifficulty', 'searchCols',
    // Utilisateurs
    'getUserProfile', 'updateUserProfile', 'getUserActivities',
    // Activités
    'createActivity', 'getActivity', 'updateActivity', 'deleteActivity',
    // 7 Majeurs
    'getAllMajeurs7Challenges', 'getMajeurs7Challenge', 'startMajeurs7Challenge', 'getMajeurs7Progress', 'updateMajeurs7Progress',
    // Météo
    'getColWeather', 'getLocationWeather', 'getWeatherForecast',
    // Entraînement
    'getUserTrainingPlans', 'getTrainingPlan', 'createTrainingPlan', 'updateTrainingPlan', 'updateFTP', 'getFTPHistory',
    // Nutrition
    'getUserNutritionPlan', 'updateNutritionPlan', 'getNutritionLog', 'createNutritionLogEntry', 'getNutritionRecipes', 'getNutritionRecipe',
    // Forum
    'getForumCategories', 'getForumTopics', 'getForumPosts', 'createForumTopic', 'createForumPost',
    // Auth
    'login', 'register', 'refreshToken', 'logout',
    // Strava
    'connectStrava', 'disconnectStrava', 'syncStravaActivities',
    // Recherche
    'searchGlobal'
  ];
  
  // Vérifier que chaque méthode requise est bien implémentée
  const missingMethods = requiredMethods.filter(method => typeof RealApiOrchestrator[method] !== 'function');
  
  if (missingMethods.length > 0) {
    console.error('ATTENTION: Méthodes manquantes dans RealApiOrchestrator:', missingMethods);
  } else {
    console.log('RealApiOrchestrator: Implémentation complète de l\'interface ApiOrchestrator');
  }
};

// Effectuer la vérification en développement
if (process.env.NODE_ENV !== 'production') {
  checkImplementation();
}

export default RealApiOrchestrator;
