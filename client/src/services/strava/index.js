/**
 * Services Strava - Point d'entrée unifié
 * Centralise toutes les exportations des services Strava
 */

import { UnifiedStravaService } from './unified-strava-service';

// Export du service unifié comme service par défaut
export default new UnifiedStravaService();

// Exports nommés pour accès direct aux classes et utilitaires
export { UnifiedStravaService };
