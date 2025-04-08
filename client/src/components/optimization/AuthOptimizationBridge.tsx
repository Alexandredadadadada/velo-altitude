/**
 * @file AuthOptimizationBridge.tsx
 * @description DÉPRÉCIÉ - Ce composant n'est plus utilisé.
 * 
 * Le système d'authentification a été simplifié et utilise maintenant une approche 
 * synchrone via authUtils.ts au lieu d'un système basé sur les événements.
 * 
 * Voir authUtils.ts pour la nouvelle implémentation.
 */

import { FC } from 'react';

/**
 * DÉPRÉCIÉ - Ne pas utiliser
 * Ce composant est conservé temporairement pour référence historique.
 * Utilisez authUtils.ts à la place.
 */
const AuthOptimizationBridge: FC = () => {
  console.warn(
    '[DEPRECATED] AuthOptimizationBridge is deprecated and will be removed. ' +
    'Use authUtils.ts instead.'
  );
  
  // Ce composant ne fait plus rien et ne rend rien
  return null;
};

export default AuthOptimizationBridge;
