import React from 'react';
import { useSafeAuth } from '../auth';
import LoadingSpinner from './ui/loaders/LoadingSpinner';

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
          <LoadingSpinner />
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
