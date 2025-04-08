import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ErrorFallback from './ErrorFallback';

/**
 * Composant ErrorBoundary
 * 
 * Capture les erreurs de rendu React et affiche une UI de secours
 * Implémente les bonnes pratiques de gestion d'erreurs React
 * 
 * Usage:
 * <ErrorBoundary moduleName="NutritionModule" onError={handleError}>
 *   <VotreComposant />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  /**
   * Capture les erreurs survenant dans les composants enfants
   * et met à jour l'état pour déclencher un rendu de fallback
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /**
   * Appelé après qu'une erreur est capturée
   * Utilisé pour journaliser l'erreur et ses détails
   */
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // Journalisation de l'erreur
    console.error(`[ErrorBoundary] Erreur dans ${this.props.moduleName || 'composant inconnu'}:`, error, errorInfo);
    
    // Appeler le callback onError si fourni
    if (typeof this.props.onError === 'function') {
      this.props.onError({
        error,
        errorInfo,
        moduleName: this.props.moduleName,
        componentStack: errorInfo?.componentStack
      });
    }

    // Journalisation dans un service externe si en production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  /**
   * Envoie l'erreur à un service externe de monitoring
   */
  logErrorToService(error, errorInfo) {
    try {
      // Informations de base sur l'erreur
      const errorData = {
        type: 'react_render_error',
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        moduleName: this.props.moduleName,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };

      // Ajout d'informations contextuelles le cas échéant
      if (this.props.contextInfo) {
        errorData.context = this.props.contextInfo;
      }

      // Envoi au point de terminaison de logs
      fetch('/api/logs/error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
        // Envoyer même si l'utilisateur quitte la page
        keepalive: true
      }).catch(e => console.warn('[ErrorBoundary] Échec de l\'envoi du log d\'erreur:', e));
    } catch (loggingError) {
      console.warn('[ErrorBoundary] Erreur lors de la journalisation:', loggingError);
    }
  }

  /**
   * Réinitialise l'état d'erreur, à utiliser après correction
   */
  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    // Si une erreur a été capturée, afficher le composant de fallback
    if (this.state.hasError) {
      // Si le développeur a fourni un composant de fallback personnalisé
      if (this.props.fallback) {
        return React.createElement(this.props.fallback, {
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          resetError: this.resetError
        });
      }

      // Sinon, utiliser le composant de fallback par défaut
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          moduleName={this.props.moduleName}
          showDetails={this.props.showErrorDetails}
        />
      );
    }

    // Si tout va bien, rendu normal des enfants
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  moduleName: PropTypes.string,
  onError: PropTypes.func,
  fallback: PropTypes.elementType,
  showErrorDetails: PropTypes.bool,
  contextInfo: PropTypes.object
};

ErrorBoundary.defaultProps = {
  moduleName: 'Composant',
  showErrorDetails: process.env.NODE_ENV !== 'production'
};

export default ErrorBoundary;
