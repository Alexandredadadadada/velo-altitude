/**
 * @file auth/index.ts
 * @description Point d'entrée unifié pour l'authentification Velo-Altitude
 * Cette structure évite les dépendances circulaires et fournit une API cohérente
 * 
 * @version 3.0.0 - TypeScript Edition
 */

// Exporter les types d'authentification
import {
  useAuth,
  useSafeAuth,
  AuthProvider,
  AuthContext,
  getAuth0Config,
  AuthUser,
  AuthContextType,
  getAccessToken  // Import correct depuis AuthCore
} from './AuthCore';

// Exporter les composants d'authentification
import AuthenticationWrapper from './AuthenticationWrapper';
import ProtectedRoute from './ProtectedRoute';

// Exporter types
export type { 
  AuthUser, 
  AuthContextType
};

// Exporter hooks et contexte
export { 
  useAuth, 
  useSafeAuth, 
  AuthProvider, 
  AuthContext, 
  getAuth0Config,
  getAccessToken  // Export correct de getAccessToken au lieu de getAuthToken
};

// Exporter composants
export {
  AuthenticationWrapper,
  ProtectedRoute
};

// Export par défaut pour compatibilité avec les imports existants
export default {
  AuthProvider,
  useAuth,
  useSafeAuth,
  AuthContext,
  getAuth0Config,
  getAccessToken,  // Export correct au lieu de getAuthToken et refreshAuthToken
  AuthenticationWrapper,
  ProtectedRoute
};
