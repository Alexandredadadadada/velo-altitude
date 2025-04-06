/**
 * auth/index.js
 * Point d'entrée unifié pour l'authentification Velo-Altitude
 * Cette structure évite les dépendances circulaires
 * 
 * @version 2.1 - Avril 2025
 */

// Importer depuis le fichier principal (source unique de vérité)
import { 
  useAuth, 
  useSafeAuth, 
  AuthProvider, 
  AuthContext, 
  getAuth0Config 
} from './AuthCore';

// Exporter toutes les fonctionnalités d'authentification
export { 
  useAuth, 
  useSafeAuth, 
  AuthProvider, 
  AuthContext, 
  getAuth0Config 
};

// Export par défaut pour compatibilité avec les imports existants
export default {
  AuthProvider,
  useAuth,
  useSafeAuth,
  AuthContext,
  getAuth0Config
};
