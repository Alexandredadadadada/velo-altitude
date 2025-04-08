/**
 * components/index.js
 * Point d'entrée centralisé pour les composants de Velo-Altitude
 * 
 * Ce fichier facilite l'importation de composants en permettant des imports comme:
 * import { AuthenticationWrapper, ProtectedRoute } from '../components';
 * 
 * @version 2.1 - Avril 2025
 */

// Composants d'authentification
export { default as AuthenticationWrapper } from './AuthenticationWrapper';
// Import ProtectedRoute depuis le module auth pour unification
export { default as ProtectedRoute } from '../auth/ProtectedRoute';

// Autres composants pourront être ajoutés ici
