/**
 * @file useAuth.js
 * @description Hook d'authentification unifié pour Velo-Altitude
 * 
 * IMPORTANT: Ce fichier est maintenu uniquement pour la rétrocompatibilité
 * Les nouveaux composants devraient importer directement depuis '../auth'
 * 
 * @deprecated Utilisez les exports de '../auth' directement
 */

import { useAuth, useSafeAuth, AuthProvider, AuthContext } from '../auth';

// Export nommé pour les imports destructurés
export { useAuth, useSafeAuth, AuthProvider, AuthContext };

// Export par défaut (cas d'usage le plus courant)
export default useAuth;
