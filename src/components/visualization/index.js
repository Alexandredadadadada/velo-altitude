/**
 * Point d'entrée unifié pour les composants de visualisation
 * Facilite l'import dans les autres composants
 */

// Exporter le composant principal
export { default as ColVisualization } from './UnifiedColVisualization';

// Exporter pour compatibilité avec les imports existants
// Les anciens noms de composants pointent maintenant vers le composant unifié
export { default as ColVisualization3D } from './UnifiedColVisualization';
export { default as Col3DVisualization } from './UnifiedColVisualization';

// Exporter les types et configurations
export { VISUALIZATION_TYPES, QUALITY_LEVELS } from '../../config/visualizationConfig';
