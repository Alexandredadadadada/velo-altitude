/**
 * Services Météo - Point d'entrée unifié
 * Centralise toutes les exportations des services météorologiques
 */

import { UnifiedWeatherService } from './unified-weather-service';

// Export du service unifié comme service par défaut
export default new UnifiedWeatherService();

// Exports nommés pour accès direct aux classes et utilitaires
export { UnifiedWeatherService };
