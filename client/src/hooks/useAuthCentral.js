// Fichier d'authentification centralisé - Version simplifiée et robuste
// Ce fichier redirige vers l'implémentation complète dans contexts/AuthContext.js

import { useAuth, AuthProvider } from '../contexts/AuthContext';

// Exporter le hook d'authentification pour tous les imports
export { useAuth, AuthProvider };

// Export par défaut pour compatibilité avec les imports par défaut
export default useAuth;
