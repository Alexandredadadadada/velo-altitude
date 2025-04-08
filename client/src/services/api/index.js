/**
 * Services API - Point d'entrée unifié
 * Centralise toutes les exportations des services API
 */

import { UnifiedAPIService } from './unified-api-service';

// Export du service unifié comme service par défaut
export default new UnifiedAPIService();

// Exports nommés pour accès direct aux classes et utilitaires
export { UnifiedAPIService };
