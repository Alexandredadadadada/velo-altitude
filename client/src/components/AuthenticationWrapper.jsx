import React from 'react';
import { useSafeAuth } from '../auth/AuthCore';

/**
 * Composant d'encapsulation d'authentification
 * Permet de gérer élégamment les états de chargement et d'erreur
 */
function AuthenticationWrapper({ children }) {
  const {
    loading,
    error,
  } = useSafeAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement de l'authentification...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Erreur d'authentification</h2>
        <p>{error.message}</p>
        <button 
          onClick={() => window.location.reload()}
          className="retry-button"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

export default AuthenticationWrapper;
