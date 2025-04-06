import React from 'react';
import './LoadingSpinner.css';

/**
 * Composant de chargement réutilisable
 * Affiche un spinner de chargement animé avec un message optionnel
 */
const LoadingSpinner = ({ message = "Chargement en cours..." }) => {
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner"></div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
