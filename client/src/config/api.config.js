/**
 * Configuration des appels API
 * Utilisé par les services pour effectuer les requêtes vers le backend
 */

export const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
};

export const API_ENDPOINTS = {
  // Authentification
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    verify: '/auth/verify'
  },
  
  // Cols
  cols: {
    list: '/cols',
    detail: (id) => `/cols/${id}`,
    search: '/cols/search',
    nearby: '/cols/nearby',
    difficulty: '/cols/difficulty'
  },
  
  // Entraînement
  training: {
    calendar: '/training/calendar',
    workouts: '/training/workouts',
    programs: '/training/programs',
    stats: '/training/statistics' 
  },
  
  // Nutrition
  nutrition: {
    plans: '/nutrition/plans',
    recipes: '/nutrition/recipes',
    calculate: '/nutrition/calculate'
  },
  
  // Communauté
  community: {
    profile: '/users/profile',
    challenges: '/community/challenges',
    forum: '/community/forum',
    messages: '/community/messages'
  },
  
  // Intégrations externes
  integrations: {
    strava: '/integrations/strava',
    weather: '/integrations/weather'
  }
};
