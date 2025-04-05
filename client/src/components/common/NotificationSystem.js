import React, { useState, useEffect, createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { Alert, Toast, ToastContainer } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheckCircle, faExclamationTriangle, 
  faExclamationCircle, faInfoCircle, 
  faTimes 
} from '@fortawesome/free-solid-svg-icons';

// Contexte pour la gestion des notifications
const NotificationContext = createContext();

/**
 * Provider pour le système de notification
 * Permet de gérer les notifications à travers l'application
 */
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  // Ajouter une nouvelle notification
  const addNotification = (notification) => {
    const id = Date.now().toString();
    const defaultDuration = notification.type === 'error' ? 8000 : 5000;
    
    setNotifications(prev => [
      ...prev,
      {
        id,
        type: 'info',
        title: '',
        message: '',
        duration: defaultDuration,
        ...notification,
        timestamp: new Date()
      }
    ]);
    
    // Enregistrer les erreurs dans la console pour le débogage
    if (notification.type === 'error') {
      console.error(`Notification d'erreur: ${notification.title || ''} - ${notification.message || ''}`, 
                    notification.error || '');
    }
    
    return id;
  };

  // Supprimer une notification par ID
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Méthodes d'utilitaire pour différents types de notifications
  const notify = {
    success: (message, options = {}) => addNotification({ 
      type: 'success', message, ...options 
    }),
    
    error: (message, error = null, options = {}) => {
      // Extraire le message d'erreur si un objet Error est fourni
      let errorMessage = message;
      if (error && typeof error === 'object') {
        if (error.message) {
          errorMessage = `${message}: ${error.message}`;
        }
        
        // Enregistrer l'erreur complète dans la console
        console.error('Détails de l\'erreur:', error);
      }
      
      return addNotification({ 
        type: 'error', 
        message: errorMessage, 
        error,
        ...options 
      });
    },
    
    warning: (message, options = {}) => addNotification({ 
      type: 'warning', message, ...options 
    }),
    
    info: (message, options = {}) => addNotification({ 
      type: 'info', message, ...options 
    })
  };

  // Auto-supprimer les notifications après leur durée
  useEffect(() => {
    const timers = notifications.map(notification => {
      if (notification.duration) {
        return setTimeout(() => {
          removeNotification(notification.id);
        }, notification.duration);
      }
      return null;
    }).filter(Boolean);

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, notify }}>
      {children}
      <NotificationDisplay />
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired
};

/**
 * Hook pour utiliser le système de notification
 */
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification doit être utilisé à l\'intérieur d\'un NotificationProvider');
  }
  return context;
};

/**
 * Composant d'affichage des notifications
 */
const NotificationDisplay = () => {
  const { notifications, removeNotification } = useContext(NotificationContext);

  // Obtenir l'icône correspondant au type de notification
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return faCheckCircle;
      case 'error':
        return faExclamationCircle;
      case 'warning':
        return faExclamationTriangle;
      case 'info':
      default:
        return faInfoCircle;
    }
  };

  return (
    <>
      {/* Notifications en bas à droite pour les messages de statut */}
      <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 1100 }}>
        {notifications
          .filter(notification => notification.type !== 'error')
          .map(notification => (
            <Toast 
              key={notification.id}
              onClose={() => removeNotification(notification.id)}
              bg={notification.type === 'info' ? 'light' : notification.type}
              text={notification.type === 'info' ? 'dark' : 'white'}
              delay={notification.duration}
              autohide
            >
              <Toast.Header>
                <FontAwesomeIcon icon={getIcon(notification.type)} className="me-2" />
                <strong className="me-auto">
                  {notification.title || 
                  (notification.type === 'success' ? 'Succès' : 
                   notification.type === 'warning' ? 'Attention' : 'Information')}
                </strong>
                <small>{notification.timestamp?.toLocaleTimeString()}</small>
              </Toast.Header>
              <Toast.Body>
                {notification.message}
              </Toast.Body>
            </Toast>
          ))}
      </ToastContainer>

      {/* Alertes centrées pour les erreurs importantes */}
      <div className="notification-alerts-container" style={{ 
        position: 'fixed', 
        top: '20px', 
        left: '50%', 
        transform: 'translateX(-50%)',
        zIndex: 1100,
        maxWidth: '90%',
        width: '500px'
      }}>
        {notifications
          .filter(notification => notification.type === 'error')
          .map(notification => (
            <Alert 
              key={notification.id} 
              variant="danger" 
              dismissible
              onClose={() => removeNotification(notification.id)}
              className="mb-3 shadow-sm"
            >
              <div className="d-flex align-items-center">
                <FontAwesomeIcon icon={faExclamationCircle} className="me-2" size="lg" />
                <div>
                  <Alert.Heading>{notification.title || 'Erreur'}</Alert.Heading>
                  <p className="mb-0">{notification.message}</p>
                </div>
              </div>
              {notification.details && (
                <div className="mt-2 pt-2 border-top">
                  <small className="text-muted">{notification.details}</small>
                </div>
              )}
            </Alert>
          ))}
      </div>
    </>
  );
};

/**
 * Composant d'alerte
 */
export const Notification = ({ type, title, message, onClose, dismissible = true }) => {
  return (
    <Alert variant={type} dismissible={dismissible} onClose={onClose}>
      {title && <Alert.Heading>{title}</Alert.Heading>}
      <p className="mb-0">{message}</p>
    </Alert>
  );
};

Notification.propTypes = {
  type: PropTypes.oneOf(['success', 'info', 'warning', 'error', 'danger']),
  title: PropTypes.string,
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func,
  dismissible: PropTypes.bool
};

export default NotificationProvider;
