/**
 * Contexte d'erreur pour l'application
 * Fournit un système centralisé de gestion des erreurs
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { 
  Toast, 
  ErrorModal, 
  ErrorBanner, 
  SeverityLevel 
} from '../components/error/ErrorComponents';

// Mapping des codes d'erreur API vers des messages utilisateur
export const API_ERROR_MESSAGES = {
  // Erreurs d'authentification
  'auth/invalid-credentials': 'Identifiants incorrects. Veuillez vérifier votre email et mot de passe.',
  'auth/user-not-found': 'Aucun utilisateur trouvé avec ces identifiants.',
  'auth/wrong-password': 'Mot de passe incorrect.',
  'auth/email-already-in-use': 'Cette adresse email est déjà utilisée.',
  'auth/weak-password': 'Le mot de passe doit contenir au moins 6 caractères.',
  'auth/invalid-email': 'Format d\'email invalide.',
  'auth/requires-recent-login': 'Cette action nécessite une connexion récente. Veuillez vous reconnecter.',
  'auth/user-disabled': 'Ce compte a été désactivé.',
  'auth/account-exists-with-different-credential': 'Un compte existe déjà avec cette adresse email.',
  'auth/operation-not-allowed': 'Cette opération n\'est pas autorisée.',
  'auth/too-many-requests': 'Trop de tentatives. Veuillez réessayer plus tard.',
  'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion internet.',
  
  // Erreurs de validation
  'validation/required': 'Ce champ est obligatoire.',
  'validation/invalid-format': 'Format invalide.',
  'validation/min-length': 'Longueur minimale non respectée.',
  'validation/max-length': 'Longueur maximale dépassée.',
  'validation/pattern-mismatch': 'Format non conforme.',
  'validation/value-too-small': 'Valeur trop petite.',
  'validation/value-too-large': 'Valeur trop grande.',
  
  // Erreurs de requête HTTP
  '400': 'Requête invalide.',
  '401': 'Authentification requise.',
  '403': 'Accès refusé.',
  '404': 'Ressource non trouvée.',
  '409': 'Conflit avec l\'état actuel.',
  '422': 'Données invalides ou incomplètes.',
  '429': 'Trop de requêtes. Veuillez réessayer plus tard.',
  '500': 'Erreur du serveur.',
  '503': 'Service temporairement indisponible.',
  
  // Erreurs génériques
  'unknown': 'Une erreur inconnue est survenue.',
  'network': 'Erreur de connexion réseau. Vérifiez votre connexion internet.',
  'timeout': 'La requête a expiré. Veuillez réessayer.',
  'cancelled': 'Opération annulée.',
  'offline': 'Vous êtes hors ligne. Vérifiez votre connexion internet.'
};

// Types d'erreurs supportés
export const ErrorType = {
  TOAST: 'toast',
  MODAL: 'modal',
  BANNER: 'banner',
  INLINE: 'inline'
};

// Création du contexte
const ErrorContext = createContext(null);

/**
 * Fournisseur du contexte d'erreur
 * @param {Object} props Props du composant
 * @param {React.ReactNode} props.children Enfants du composant
 */
export const ErrorProvider = ({ children }) => {
  const [errors, setErrors] = useState([]);
  
  // Générer un ID unique pour chaque erreur
  const generateErrorId = () => `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  /**
   * Ajoute une erreur
   * @param {Object} errorConfig Configuration de l'erreur
   * @returns {string} ID de l'erreur
   */
  const addError = useCallback((errorConfig) => {
    const errorId = generateErrorId();
    const newError = {
      id: errorId,
      timestamp: new Date(),
      ...errorConfig
    };
    
    setErrors(prev => [...prev, newError]);
    
    // Auto-dismissible pour les toasts non-critiques
    if (errorConfig.type === ErrorType.TOAST && 
        errorConfig.severity !== SeverityLevel.FATAL && 
        errorConfig.severity !== SeverityLevel.ERROR) {
      setTimeout(() => {
        dismissError(errorId);
      }, errorConfig.duration || 6000);
    }
    
    return errorId;
  }, []);
  
  /**
   * Supprime une erreur
   * @param {string} errorId ID de l'erreur à supprimer
   */
  const dismissError = useCallback((errorId) => {
    setErrors(prev => prev.filter(error => error.id !== errorId));
  }, []);
  
  /**
   * Supprime toutes les erreurs
   */
  const clearAllErrors = useCallback(() => {
    setErrors([]);
  }, []);
  
  /**
   * Affiche une notification toast
   * @param {string} message Message à afficher
   * @param {string} severity Niveau de sévérité
   * @param {Object} options Options additionnelles
   * @returns {string} ID de l'erreur
   */
  const showToast = useCallback((message, severity = SeverityLevel.INFO, options = {}) => {
    return addError({
      type: ErrorType.TOAST,
      message,
      severity,
      ...options
    });
  }, [addError]);
  
  /**
   * Affiche une modal d'erreur
   * @param {string} title Titre de la modal
   * @param {string} message Message à afficher
   * @param {string} severity Niveau de sévérité
   * @param {Object} options Options additionnelles
   * @returns {string} ID de l'erreur
   */
  const showModal = useCallback((title, message, severity = SeverityLevel.ERROR, options = {}) => {
    return addError({
      type: ErrorType.MODAL,
      title,
      message,
      severity,
      ...options
    });
  }, [addError]);
  
  /**
   * Affiche une bannière d'erreur
   * @param {string} message Message à afficher
   * @param {string} severity Niveau de sévérité
   * @param {Object} options Options additionnelles
   * @returns {string} ID de l'erreur
   */
  const showBanner = useCallback((message, severity = SeverityLevel.WARNING, options = {}) => {
    return addError({
      type: ErrorType.BANNER,
      message,
      severity,
      ...options
    });
  }, [addError]);
  
  /**
   * Gère une erreur API
   * @param {Object} error Erreur à gérer
   * @param {Object} options Options de configuration
   * @returns {string} ID de l'erreur
   */
  const handleApiError = useCallback((error, options = {}) => {
    // Récupérer les détails de l'erreur
    const errorCode = error.code || (error.response ? `${error.response.status}` : 'unknown');
    const errorMessage = error.message || API_ERROR_MESSAGES[errorCode] || API_ERROR_MESSAGES.unknown;
    const severity = options.severity || 
      (error.response && error.response.status >= 500 ? SeverityLevel.ERROR : SeverityLevel.WARNING);
    
    // Déterminer le type d'erreur à afficher
    const errorType = options.type || ErrorType.TOAST;
    
    // Erreurs critique/serveur : modal
    if (severity === SeverityLevel.FATAL || (error.response && error.response.status >= 500)) {
      return showModal(
        options.title || 'Erreur',
        options.message || errorMessage,
        severity,
        options
      );
    }
    
    // Erreurs d'authentification : modal ou bannière
    if (errorCode.startsWith('auth/') || error.response?.status === 401 || error.response?.status === 403) {
      return showModal(
        options.title || 'Erreur d\'authentification',
        options.message || errorMessage,
        severity,
        {
          actions: [
            { 
              label: 'Se connecter', 
              onClick: () => window.location.href = '/login',
              variant: 'contained',
              color: 'primary'
            },
            { 
              label: 'Annuler', 
              onClick: () => {}, 
              variant: 'text' 
            }
          ],
          ...options
        }
      );
    }
    
    // Erreurs réseau : toast ou bannière
    if (errorCode === 'network' || errorCode === 'offline' || !error.response) {
      return errorType === ErrorType.BANNER ? 
        showBanner(options.message || errorMessage, severity, options) :
        showToast(options.message || errorMessage, severity, options);
    }
    
    // Autres erreurs : selon le type demandé
    switch (errorType) {
      case ErrorType.MODAL:
        return showModal(
          options.title || 'Erreur',
          options.message || errorMessage,
          severity,
          options
        );
      case ErrorType.BANNER:
        return showBanner(
          options.message || errorMessage,
          severity,
          options
        );
      case ErrorType.TOAST:
      default:
        return showToast(
          options.message || errorMessage,
          severity,
          options
        );
    }
  }, [showToast, showModal, showBanner, addError]);
  
  // Valeurs exposées par le contexte
  const contextValue = {
    errors,
    addError,
    dismissError,
    clearAllErrors,
    showToast,
    showModal,
    showBanner,
    handleApiError
  };
  
  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
      
      {/* Afficher les erreurs de type Toast */}
      {errors.filter(error => error.type === ErrorType.TOAST).map(error => (
        <Toast
          key={error.id}
          open={true}
          message={error.message}
          severity={error.severity || SeverityLevel.INFO}
          duration={error.duration}
          onClose={() => dismissError(error.id)}
          action={error.action}
          position={error.position}
          variant={error.variant}
        />
      ))}
      
      {/* Afficher les erreurs de type Modal */}
      {errors.filter(error => error.type === ErrorType.MODAL).map(error => (
        <ErrorModal
          key={error.id}
          open={true}
          title={error.title || 'Erreur'}
          message={error.message}
          severity={error.severity || SeverityLevel.ERROR}
          onClose={() => dismissError(error.id)}
          actions={error.actions}
          maxWidth={error.maxWidth}
          fullWidth={error.fullWidth}
          disableBackdropClick={error.disableBackdropClick}
          disableEscapeKeyDown={error.disableEscapeKeyDown}
        />
      ))}
      
      {/* Afficher les erreurs de type Banner */}
      {errors.filter(error => error.type === ErrorType.BANNER).map(error => (
        <ErrorBanner
          key={error.id}
          open={true}
          message={error.message}
          severity={error.severity || SeverityLevel.WARNING}
          onClose={() => dismissError(error.id)}
          actions={error.actions}
          dismissible={error.dismissible !== false}
        />
      ))}
    </ErrorContext.Provider>
  );
};

/**
 * Hook pour utiliser le contexte d'erreur
 * @returns {Object} Contexte d'erreur
 */
export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError doit être utilisé à l\'intérieur d\'un ErrorProvider');
  }
  return context;
};

export default ErrorContext;
