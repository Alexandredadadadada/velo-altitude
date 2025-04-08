/**
 * Services de Monitoring - Point d'entrée unifié
 * Centralise toutes les exportations des services de monitoring
 */

import { UnifiedMonitoringService } from './unified-monitoring-service';

// Export du service unifié comme service par défaut
export default new UnifiedMonitoringService();

// Exports nommés pour accès direct aux classes et utilitaires
export { UnifiedMonitoringService };
