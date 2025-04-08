import React from 'react';
import ErrorBoundary from './ErrorBoundary';
import notificationService from '../../services/notification/notificationService';

/**
 * HOC qui ajoute la gestion d'erreurs à un composant
 * 
 * @param {React.Component} WrappedComponent - Le composant à wrapper
 * @param {Object} options - Options de configuration
 * @param {string} options.moduleName - Nom du module pour l'identification des erreurs
 * @param {boolean} options.showErrorDetails - Afficher les détails techniques des erreurs
 * @param {Function} options.onError - Callback personnalisé lors d'une erreur
 * @param {Object} options.contextInfo - Informations contextuelles à inclure dans les logs d'erreur
 * @returns {React.Component} - Composant avec gestion d'erreurs
 */
const withErrorHandling = (WrappedComponent, options = {}) => {
  const {
    moduleName = WrappedComponent.displayName || WrappedComponent.name || 'Composant',
    showErrorDetails = process.env.NODE_ENV !== 'production',
    onError,
    contextInfo
  } = options;

  // Fonction de gestion d'erreur par défaut
  const defaultErrorHandler = (errorData) => {
    console.error(`[${moduleName}] Erreur capturée:`, errorData.error);
    
    // Notifier l'utilisateur via le service de notification
    notificationService.error(`Une erreur s'est produite dans le module ${moduleName}`, {
      title: 'Erreur applicative',
      action: 'Recharger',
      onAction: () => window.location.reload()
    });
  };

  // Combinaison du handler par défaut et du handler personnalisé
  const handleError = (errorData) => {
    defaultErrorHandler(errorData);
    
    if (typeof onError === 'function') {
      onError(errorData);
    }
  };

  // Nom à afficher dans React DevTools
  const displayName = `withErrorHandling(${moduleName})`;

  // Composant wrapper avec ErrorBoundary
  const WithErrorHandling = (props) => {
    return (
      <ErrorBoundary
        moduleName={moduleName}
        showErrorDetails={showErrorDetails}
        onError={handleError}
        contextInfo={{
          ...contextInfo,
          componentProps: props // Inclure les props actuelles dans le contexte
        }}
      >
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };

  WithErrorHandling.displayName = displayName;
  
  return WithErrorHandling;
};

export default withErrorHandling;
