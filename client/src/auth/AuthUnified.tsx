/**
 * @file AuthUnified.tsx
 * @description Point d'entrée unifié pour l'authentification Velo-Altitude
 * 
 * Ce fichier assure la compatibilité avec les imports existants
 * tout en évitant les dépendances circulaires. Il sert de façade pour
 * le système d'authentification, exposant une API cohérente.
 * 
 * @version 3.0.0
 */

// Import direct depuis AuthCore.tsx pour éviter les dépendances circulaires
import { 
  AuthProvider, 
  useAuth, 
  useSafeAuth, 
  AuthContext,
  AuthUser,
  AuthContextType
} from './AuthCore';

// Export des types pour la compatibilité TypeScript
export type { AuthUser, AuthContextType };

// Export nommé pour les destructurations
export { AuthProvider, useAuth, useSafeAuth, AuthContext };

// Export par défaut pour les imports traditionnels
export default { AuthProvider, useAuth, useSafeAuth, AuthContext };
