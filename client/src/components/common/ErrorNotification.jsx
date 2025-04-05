import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import './ErrorNotification.css';

/**
 * Composant de notification d'erreur qui affiche différents types de notifications
 * selon la gravité de l'erreur (toast, modal, etc.)
 */
const ErrorNotification = ({ 
  error, 
  onClose, 
  onConfirm,
  autoClose = true
}) => {
  const [visible, setVisible] = useState(true);
  const [timeoutId, setTimeoutId] = useState(null);

  // Déterminer le style et le comportement en fonction de la gravité
  const { type, position, autoClose: autoCloseTime, requireConfirmation, blockUI } = 
    error?.notification || {
      type: 'toast',
      position: 'top-right',
      autoClose: 5000,
      requireConfirmation: false,
      blockUI: false
    };

  // Fermer la notification
  const handleClose = useCallback(() => {
    setVisible(false);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    if (onClose) {
      setTimeout(() => onClose(error?.id), 300); // Délai pour l'animation
    }
  }, [error?.id, onClose, timeoutId]);

  // Confirmer la notification (pour les erreurs critiques)
  const handleConfirm = useCallback(() => {
    if (onConfirm) {
      onConfirm(error?.id);
    }
    handleClose();
  }, [error?.id, handleClose, onConfirm]);

  // Gérer la fermeture automatique
  useEffect(() => {
    if (autoClose && autoCloseTime > 0 && !requireConfirmation) {
      const id = setTimeout(() => {
        handleClose();
      }, autoCloseTime);
      setTimeoutId(id);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [autoClose, autoCloseTime, handleClose, requireConfirmation]);

  // Déterminer les classes CSS en fonction du type et de la position
  const getNotificationClasses = () => {
    const classes = ['error-notification'];
    
    // Ajouter la classe pour le type
    classes.push(`error-notification--${type}`);
    
    // Ajouter la classe pour la position
    classes.push(`error-notification--${position}`);
    
    // Ajouter la classe pour la gravité
    classes.push(`error-notification--${error?.severity || 'info'}`);
    
    // Ajouter la classe pour l'animation
    classes.push(visible ? 'error-notification--visible' : 'error-notification--hidden');
    
    return classes.join(' ');
  };

  // Si pas d'erreur, ne rien afficher
  if (!error) {
    return null;
  }

  // Contenu de la notification
  const notificationContent = (
    <div className={getNotificationClasses()}>
      <div className="error-notification__content">
        {error.severity === 'critical' && (
          <div className="error-notification__icon error-notification__icon--critical">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
        )}
        {error.severity === 'error' && (
          <div className="error-notification__icon error-notification__icon--error">
            <i className="fas fa-exclamation-circle"></i>
          </div>
        )}
        {error.severity === 'warning' && (
          <div className="error-notification__icon error-notification__icon--warning">
            <i className="fas fa-exclamation"></i>
          </div>
        )}
        {error.severity === 'info' && (
          <div className="error-notification__icon error-notification__icon--info">
            <i className="fas fa-info-circle"></i>
          </div>
        )}
        
        <div className="error-notification__message">
          <h4 className="error-notification__title">
            {error.severity === 'critical' && 'Erreur critique'}
            {error.severity === 'error' && 'Erreur'}
            {error.severity === 'warning' && 'Avertissement'}
            {error.severity === 'info' && 'Information'}
          </h4>
          <p>{error.message}</p>
          {error.details && process.env.NODE_ENV !== 'production' && (
            <details className="error-notification__details">
              <summary>Détails techniques</summary>
              <pre>{JSON.stringify(error.details, null, 2)}</pre>
            </details>
          )}
        </div>
        
        <div className="error-notification__actions">
          {!requireConfirmation && (
            <button 
              className="error-notification__close-btn" 
              onClick={handleClose}
              aria-label="Fermer"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
          
          {requireConfirmation && (
            <button 
              className="error-notification__confirm-btn" 
              onClick={handleConfirm}
            >
              J'ai compris
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Pour les modales, utiliser un portail pour les afficher au-dessus de tout
  if (type === 'modal') {
    // Créer un élément de fond pour bloquer l'interface si nécessaire
    const backdrop = blockUI ? (
      <div className="error-notification__backdrop" />
    ) : null;

    return createPortal(
      <>
        {backdrop}
        {notificationContent}
      </>,
      document.body
    );
  }

  // Pour les toasts, les afficher normalement
  return notificationContent;
};

ErrorNotification.propTypes = {
  error: PropTypes.shape({
    id: PropTypes.string,
    type: PropTypes.string,
    message: PropTypes.string.isRequired,
    severity: PropTypes.oneOf(['info', 'warning', 'error', 'critical']),
    details: PropTypes.object,
    notification: PropTypes.shape({
      type: PropTypes.oneOf(['toast', 'modal']),
      position: PropTypes.string,
      autoClose: PropTypes.number,
      requireConfirmation: PropTypes.bool,
      blockUI: PropTypes.bool
    })
  }),
  onClose: PropTypes.func,
  onConfirm: PropTypes.func,
  autoClose: PropTypes.bool
};

export default ErrorNotification;
