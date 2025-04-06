/**
 * AuthUnified.js
 * Point d'entrée unifié pour l'authentification Velo-Altitude
 * 
 * Ce fichier assure la compatibilité avec les imports existants
 * tout en évitant les dépendances circulaires.
 * 
 * @version 2.1 - Avril 2025
 */

// Import direct depuis AuthCore pour éviter les dépendances circulaires
import { AuthProvider, useAuth, useSafeAuth, AuthContext } from './AuthCore';

// Export nommé pour les destructurations
export { AuthProvider, useAuth, useSafeAuth, AuthContext };

// Export par défaut pour les imports traditionnels
export default { AuthProvider, useAuth, useSafeAuth, AuthContext };
