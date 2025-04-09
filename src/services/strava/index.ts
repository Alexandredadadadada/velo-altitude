/**
 * Module d'intégration Strava pour Velo-Altitude
 * 
 * Fonctionnalités:
 * - Authentification OAuth avec Strava
 * - Gestion sécurisée des tokens
 * - Récupération des activités et routes
 * - Synchronisation automatique
 * - Mise en cache pour optimiser les performances
 * - Gestion des erreurs et limites de débit
 */

import { StravaService } from './StravaService';
import tokenManager from './StravaTokenManager';
import * as types from './types';

// Créer une instance par défaut du service
const stravaService = new StravaService({
  initialSyncDays: 90,
  autoSyncEnabled: true,
  autoSyncInterval: 60,
  forceResyncAfterDays: 30,
  maxActivitiesPerSync: 100,
});

// Exporter l'instance par défaut
export default stravaService;

// Exporter les classes et types
export { StravaService, tokenManager };
export * from './types';
