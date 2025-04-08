import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { NotificationLevel } from '../../services/notification/notificationService';
import './NotificationToast.scss';

/**
 * Composant pour afficher une notification individuelle
 */
const NotificationToast = ({ notification, onDismiss, onAction }) => {
  const [isExiting, setIsExiting] = useState(false);
  const { id, level, message, title, action, dismissible, icon } = notification;
  
  // Animation de sortie avant de supprimer la notification
  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(id);
    }, 300); // Durée de l'animation de sortie
  };
  
  // Action de la notification (bouton)
  const handleAction = () => {
    onAction(notification);
  };
  
  // Générer les icônes selon le niveau de notification
  const renderIcon = () => {
    // Si une icône personnalisée est fournie
    if (icon) {
      return <span className="notification-toast__icon">{icon}</span>;
    }
    
    // Icônes par défaut selon le type
    switch (level) {
      case NotificationLevel.SUCCESS:
        return (
          <svg className="notification-toast__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22ZM12 20C16.418 20 20 16.418 20 12C20 7.582 16.418 4 12 4C7.582 4 4 7.582 4 12C4 16.418 7.582 20 12 20ZM11.003 16L6.76 11.757L8.174 10.343L11.003 13.172L16.659 7.515L18.074 8.929L11.003 16Z" fill="currentColor" />
          </svg>
        );
      case NotificationLevel.ERROR:
        return (
          <svg className="notification-toast__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22ZM12 20C16.418 20 20 16.418 20 12C20 7.582 16.418 4 12 4C7.582 4 4 7.582 4 12C4 16.418 7.582 20 12 20ZM11 15H13V17H11V15ZM11 7H13V13H11V7Z" fill="currentColor" />
          </svg>
        );
      case NotificationLevel.WARNING:
        return (
          <svg className="notification-toast__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.866 3L22 18H3L12.866 3ZM12.134 5L5.13 16H20.259L12.134 5ZM11 11V13H13V11H11ZM11 14V16H13V14H11Z" fill="currentColor" />
          </svg>
        );
      default: // INFO
        return (
          <svg className="notification-toast__icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22ZM12 20C16.418 20 20 16.418 20 12C20 7.582 16.418 4 12 4C7.582 4 4 7.582 4 12C4 16.418 7.582 20 12 20ZM11 11H13V17H11V11ZM11 7H13V9H11V7Z" fill="currentColor" />
          </svg>
        );
    }
  };
  
  return (
    <div 
      className={`notification-toast notification-toast--${level} ${isExiting ? 'notification-toast--exiting' : ''}`}
      role="alert"
    >
      <div className="notification-toast__content">
        {renderIcon()}
        
        <div className="notification-toast__text">
          {title && <div className="notification-toast__title">{title}</div>}
          <div className="notification-toast__message">{message}</div>
        </div>
        
        {action && (
          <button 
            className="notification-toast__action" 
            onClick={handleAction}
          >
            {action}
          </button>
        )}
        
        {dismissible !== false && (
          <button 
            className="notification-toast__close" 
            onClick={handleDismiss}
            aria-label="Fermer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 10.586L16.95 5.636L18.364 7.05L13.414 12L18.364 16.95L16.95 18.364L12 13.414L7.05 18.364L5.636 16.95L10.586 12L5.636 7.05L7.05 5.636L12 10.586Z" fill="currentColor" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Barre de progression si la notification a une durée définie */}
      {notification.duration && notification.duration > 0 && (
        <div 
          className="notification-toast__progress" 
          style={{ animationDuration: `${notification.duration}ms` }}
        />
      )}
    </div>
  );
};

NotificationToast.propTypes = {
  notification: PropTypes.shape({
    id: PropTypes.string.isRequired,
    level: PropTypes.oneOf(Object.values(NotificationLevel)),
    message: PropTypes.string.isRequired,
    title: PropTypes.string,
    action: PropTypes.string,
    dismissible: PropTypes.bool,
    duration: PropTypes.number,
    icon: PropTypes.node
  }).isRequired,
  onDismiss: PropTypes.func.isRequired,
  onAction: PropTypes.func.isRequired
};

export default NotificationToast;
