/**
 * Configuration des routes de l'application
 * Centralise toutes les routes pour faciliter la maintenance
 */

export const ROUTES = {
  // Routes principales
  HOME: '/',
  DASHBOARD: '/dashboard',
  
  // Module Cols
  COLS: {
    ROOT: '/cols',
    EXPLORER: '/cols/explorer',
    DETAIL: (id) => `/cols/${id}`,
    MAP: '/cols/map',
    CHALLENGES: '/cols/challenges',
    MAJEURS: '/cols/7-majeurs'
  },
  
  // Module Entraînement
  TRAINING: {
    ROOT: '/entrainement',
    CALENDAR: '/entrainement/calendrier',
    WORKOUTS: '/entrainement/seances',
    PROGRAMS: '/entrainement/programmes',
    STATISTICS: '/entrainement/statistiques',
    CALCULATORS: {
      ROOT: '/entrainement/calculateurs',
      FTP: '/entrainement/calculateurs/ftp',
      ZONES: '/entrainement/calculateurs/zones',
      POWER_WEIGHT: '/entrainement/calculateurs/rapport-poids-puissance'
    }
  },
  
  // Module Nutrition
  NUTRITION: {
    ROOT: '/nutrition',
    MEAL_PLANNER: '/nutrition/planificateur',
    RECIPES: '/nutrition/recettes',
    CALCULATOR: '/nutrition/calculateur'
  },
  
  // Module Communauté
  COMMUNITY: {
    ROOT: '/communaute',
    PROFILE: (username) => `/communaute/profil/${username}`,
    FORUM: '/communaute/forum',
    CHALLENGES: '/communaute/defis',
    MESSAGES: '/communaute/messages'
  },
  
  // Profil Utilisateur
  USER: {
    PROFILE: '/profil',
    SETTINGS: '/profil/parametres',
    ACTIVITIES: '/profil/activites',
    ACHIEVEMENTS: '/profil/recompenses'
  },
  
  // Authentification
  AUTH: {
    LOGIN: '/connexion',
    REGISTER: '/inscription',
    FORGOT_PASSWORD: '/mot-de-passe-oublie',
    RESET_PASSWORD: '/reinitialiser-mot-de-passe',
    CALLBACK: '/callback'
  },
  
  // Pages statiques
  STATIC: {
    ABOUT: '/a-propos',
    CONTACT: '/contact',
    TERMS: '/conditions-utilisation',
    PRIVACY: '/confidentialite'
  }
};
