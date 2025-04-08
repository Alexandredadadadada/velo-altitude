/**
 * @file AuthenticationWrapper.tsx
 * @description Composant qui gère les différents états du processus d'authentification
 * (chargement, erreur, authentifié, non authentifié)
 * 
 * @version 3.0.0
 */

import React, { ReactNode } from 'react';
import { useAuth } from './AuthCore';

// Composants pour les différents états
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorDisplay from '../components/common/ErrorDisplay';

/**
 * Props du composant AuthenticationWrapper
 */
interface AuthenticationWrapperProps {
  children: ReactNode;
  requireAuth?: boolean;
  fallback?: ReactNode;
  onAuthFailure?: (error: Error) => void;
  loadingComponent?: ReactNode;
}

/**
 * Wrapper pour gérer les différents états d'authentification
 * @param props - Les propriétés du composant
 * @param props.children - Contenu à afficher si authentifié
 * @param props.requireAuth - Indique si l'authentification est requise
 * @param props.fallback - Contenu à afficher si non authentifié
 * @param props.onAuthFailure - Fonction appelée en cas d'échec d'authentification
 * @param props.loadingComponent - Composant personnalisé pour l'état de chargement
 */
const AuthenticationWrapper = ({
  children,
  requireAuth = true,
  fallback = null,
  onAuthFailure = undefined,
  loadingComponent = null
}: AuthenticationWrapperProps): JSX.Element => {
  // Récupération du contexte d'authentification
  const { user, isAuthenticated, loading, error } = useAuth();

  // Gestion de l'état de chargement
  if (loading) {
    return loadingComponent as JSX.Element || <LoadingSpinner message="Authentification en cours..." />;
  }

  // Gestion des erreurs d'authentification
  if (error) {
    // Appeler le callback d'erreur si fourni
    if (onAuthFailure) {
      onAuthFailure(error);
    }
    
    return (
      <ErrorDisplay 
        title="Erreur d'authentification" 
        message={error.message || "Une erreur est survenue lors de l'authentification."} 
        retryAction={() => window.location.reload()}
      />
    );
  }

  // Si l'authentification est requise mais l'utilisateur n'est pas authentifié
  if (requireAuth && !isAuthenticated) {
    // Afficher le contenu de fallback ou null
    return fallback as JSX.Element || null;
  }

  // Si tout est OK, afficher le contenu enfant
  return <>{children}</>;
};

export default AuthenticationWrapper;
