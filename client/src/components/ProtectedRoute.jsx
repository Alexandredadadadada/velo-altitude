import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSafeAuth } from '../auth/AuthCore';

/**
 * Composant de route protégée
 * Redirige les utilisateurs non authentifiés vers la page de connexion
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useSafeAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Stocker l'URL actuelle pour redirection après connexion
      sessionStorage.setItem('redirectAfterLogin', location.pathname);
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate, location]);
  
  if (loading) {
    return (
      <div className="route-loading">
        <div className="loading-spinner"></div>
        <p>Vérification de l'authentification...</p>
      </div>
    );
  }
  
  return isAuthenticated ? children : null;
}

export default ProtectedRoute;
