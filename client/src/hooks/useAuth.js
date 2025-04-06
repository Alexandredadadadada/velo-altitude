/**
 * hooks/useAuth.js
 * Hook d'authentification pour Velo-Altitude
 * 
 * Ce fichier maintient la compatibilité avec les imports existants
 * qui utilisent useAuth depuis le dossier hooks.
 * 
 * @version 2.1 - Avril 2025
 */

// Import direct depuis AuthCore pour éviter les dépendances circulaires
import { useAuth, useSafeAuth, AuthProvider, AuthContext } from '../auth/AuthCore';

// Export nommé pour les imports destructurés
export { useAuth, useSafeAuth, AuthProvider, AuthContext };

// Export par défaut (cas d'usage le plus courant)
export default useAuth;
