// Fichier d'authentification centralisé qui résout les problèmes d'imports incohérents
// Ce fichier redirige maintenant vers l'implémentation temporaire simplifiée

import { useTempAuth, TempAuthProvider as AuthProvider } from '../utils/TempAuthContext';

// Exporter le hook d'authentification principal
export const useAuth = useTempAuth;

// Exporter également le provider pour que App.js puisse l'utiliser
export { AuthProvider };
