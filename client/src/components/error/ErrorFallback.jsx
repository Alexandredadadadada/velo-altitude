import React from 'react';
import PropTypes from 'prop-types';
import './ErrorFallback.scss';

/**
 * Composant d'affichage d'erreur par défaut
 * Utilisé par ErrorBoundary lorsqu'une erreur de rendu est capturée
 */
const ErrorFallback = ({ error, errorInfo, resetError, moduleName, showDetails }) => {
  // Extraction du message principal sans la stack trace
  const errorMessage = error?.message || 'Une erreur inattendue est survenue';

  return (
    <div className="error-fallback">
      <div className="error-fallback__container">
        <div className="error-fallback__icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22ZM12 20C16.418 20 20 16.418 20 12C20 7.582 16.418 4 12 4C7.582 4 4 7.582 4 12C4 16.418 7.582 20 12 20ZM11 15H13V17H11V15ZM11 7H13V13H11V7Z"
              fill="currentColor"
            />
          </svg>
        </div>

        <h2 className="error-fallback__title">
          Problème dans le module {moduleName}
        </h2>

        <p className="error-fallback__message">
          {errorMessage}
        </p>

        {showDetails && errorInfo && (
          <div className="error-fallback__details">
            <details>
              <summary>Détails techniques</summary>
              <pre>{error?.stack}</pre>
              <pre>{errorInfo?.componentStack}</pre>
            </details>
          </div>
        )}

        <div className="error-fallback__actions">
          <button 
            className="error-fallback__button error-fallback__button--primary" 
            onClick={resetError}
          >
            Réessayer
          </button>
          
          <button 
            className="error-fallback__button" 
            onClick={() => window.location.href = '/'}
          >
            Retour à l'accueil
          </button>
        </div>

        <p className="error-fallback__help">
          Si le problème persiste, contactez le support technique.
        </p>
      </div>
    </div>
  );
};

ErrorFallback.propTypes = {
  error: PropTypes.object,
  errorInfo: PropTypes.object,
  resetError: PropTypes.func.isRequired,
  moduleName: PropTypes.string,
  showDetails: PropTypes.bool
};

ErrorFallback.defaultProps = {
  moduleName: 'inconnu',
  showDetails: false
};

export default ErrorFallback;
