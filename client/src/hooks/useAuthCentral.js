// Fichier d'authentification centralisé qui résout les problèmes d'imports incohérents
// Ce fichier redirige vers l'implémentation la plus complète (contexts/AuthContext.js)

import { useAuth as useAuthContexts, AuthProvider } from '../contexts/AuthContext';

// Exporter le hook d'authentification principal
export const useAuth = useAuthContexts;

// Exporter également le provider pour que App.js puisse l'utiliser
export { AuthProvider };
