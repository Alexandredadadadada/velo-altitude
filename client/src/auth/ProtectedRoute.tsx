/**
 * @file ProtectedRoute.tsx
 * @description Composant qui sécurise les routes authentifiées
 * Redirige vers la page de connexion si l'utilisateur n'est pas authentifié
 * 
 * @version 3.0.0
 */

import React, { ReactNode, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthCore';
import LoadingSpinner from '../components/common/LoadingSpinner';

/**
 * Props du composant ProtectedRoute
 */
interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  onUnauthorized?: () => void;
  adminOnly?: boolean;
}

/**
 * Composant qui protège une route contre les accès non autorisés
 * @param props - Les propriétés du composant
 * @param props.children - Le contenu à afficher si l'accès est autorisé
 * @param props.redirectTo - L'URL de redirection en cas d'accès non autorisé
 * @param props.onUnauthorized - Callback appelé en cas d'accès non autorisé
 * @param props.adminOnly - Si true, seuls les administrateurs peuvent accéder à la route
 */
const ProtectedRoute = ({
  children,
  redirectTo = '/login',
  onUnauthorized,
  adminOnly = false,
}: ProtectedRouteProps): JSX.Element => {
  const { isAuthenticated, loading, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Déterminer si l'utilisateur a les droits d'accès nécessaires
  const hasAccess = isAuthenticated && (!adminOnly || isAdmin);
  
  // Effet pour gérer les redirections en fonction de l'état d'authentification
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Stocker l'URL actuelle pour redirection après connexion
      sessionStorage.setItem('redirectAfterLogin', location.pathname);
    }
    
    if (!loading && isAuthenticated && adminOnly && !isAdmin) {
      // Rediriger vers le dashboard si l'utilisateur n'est pas admin
      navigate('/dashboard');
    }
  }, [isAuthenticated, isAdmin, loading, navigate, location, adminOnly]);

  // Si l'authentification est en cours de chargement
  if (loading) {
    return <LoadingSpinner message="Vérification de l'authentification..." />;
  }

  // Si l'utilisateur n'est pas authentifié ou n'a pas les droits suffisants
  if (!hasAccess) {
    // Appeler le callback si fourni
    if (onUnauthorized) {
      onUnauthorized();
    }

    // Rediriger vers la page de connexion avec le retour prévu
    if (!isAuthenticated) {
      return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
    }
    
    // Si l'utilisateur est authentifié mais n'a pas les droits admin requis
    if (adminOnly && !isAdmin) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Si l'utilisateur est authentifié et a les droits nécessaires, afficher le contenu protégé
  return <>{children}</>;
};

export default ProtectedRoute;
