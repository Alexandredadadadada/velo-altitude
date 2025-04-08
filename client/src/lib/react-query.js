/**
 * Configuration React Query
 * 
 * Ce fichier configure React Query pour la gestion du cache et des requêtes API.
 * Il définit les paramètres globaux pour toutes les requêtes.
 */

import { QueryClient } from '@tanstack/react-query';

// Configuration des options par défaut
const defaultOptions = {
  queries: {
    // Par défaut, considérer les données comme fraîches pendant 5 minutes
    staleTime: 5 * 60 * 1000,
    
    // Conserver les données en cache pendant 30 minutes
    cacheTime: 30 * 60 * 1000,
    
    // Retenter 3 fois avec un délai exponentiel
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Refetch automatique lors de la reconnexion réseau
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    
    // Afficher les erreurs dans la console
    onError: (error) => {
      console.error('[React Query] Error:', error);
    }
  },
  mutations: {
    // Retenter 2 fois pour les mutations
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    
    // Afficher les erreurs de mutation dans la console
    onError: (error) => {
      console.error('[React Query] Mutation error:', error);
    }
  }
};

// Création du client React Query
export const queryClient = new QueryClient({
  defaultOptions
});

// Clés de requête pour chaque type de ressource
export const queryKeys = {
  cols: {
    all: ['cols'],
    byId: (id) => ['cols', id],
    byRegion: (region) => ['cols', 'byRegion', region],
    byDifficulty: (difficulty) => ['cols', 'byDifficulty', difficulty],
    search: (query) => ['cols', 'search', query]
  },
  users: {
    profile: (userId) => ['users', userId, 'profile'],
    activities: (userId, page) => ['users', userId, 'activities', page]
  },
  activities: {
    byId: (id) => ['activities', id],
    recent: ['activities', 'recent']
  },
  majeurs7: {
    all: ['majeurs7'],
    byId: (id) => ['majeurs7', id],
    progress: (userId, challengeId) => ['majeurs7', 'progress', userId, challengeId]
  },
  weather: {
    byCol: (colId) => ['weather', 'col', colId],
    byLocation: (lat, lng) => ['weather', 'location', lat, lng],
    forecast: (colId, days) => ['weather', 'forecast', colId, days]
  },
  training: {
    plans: (userId) => ['training', 'plans', userId],
    plan: (planId) => ['training', 'plan', planId],
    ftp: (userId) => ['training', 'ftp', userId]
  },
  nutrition: {
    plan: (userId) => ['nutrition', 'plan', userId],
    log: (userId, date) => ['nutrition', 'log', userId, date],
    recipes: (query, tags) => ['nutrition', 'recipes', query, tags ? tags.join(',') : null],
    recipe: (recipeId) => ['nutrition', 'recipe', recipeId]
  },
  forum: {
    categories: ['forum', 'categories'],
    topics: (categoryId, page) => ['forum', 'topics', categoryId, page],
    posts: (topicId, page) => ['forum', 'posts', topicId, page]
  }
};

export default queryClient;
