import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import notificationService, { NotificationPosition } from '../../services/notification/notificationService';
import NotificationToast from './NotificationToast';
import './NotificationSystem.scss';

/**
 * Système de notification centralisé
 * Affiche les notifications déclenchées via le service de notification
 */
const NotificationSystem = ({ maxNotifications = 5, defaultPosition }) => {
  const [notifications, setNotifications] = useState([]);
  
  useEffect(() => {
    // S'abonner aux nouvelles notifications
    const subscription = notificationService.notifications$.subscribe(notification => {
      if (notification.action === 'dismiss') {
        // Fermer une notification spécifique
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      } else if (notification.action === 'dismiss-all') {
        // Fermer toutes les notifications
        setNotifications([]);
      } else {
        // Ajouter une nouvelle notification
        setNotifications(prev => {
          // Conserver uniquement les notifications les plus récentes (maxNotifications)
          const updatedNotifications = [notification, ...prev].slice(0, maxNotifications);
          
          // Si la notification a une durée, configurer son auto-dismiss
          if (notification.duration > 0) {
            setTimeout(() => {
              notificationService.dismiss(notification.id);
            }, notification.duration);
          }
          
          return updatedNotifications;
        });
      }
    });
    
    // Nettoyage lors du démontage
    return () => subscription.unsubscribe();
  }, [maxNotifications]);

  // Grouper les notifications par position
  const groupedNotifications = notifications.reduce((groups, notification) => {
    const position = notification.position || defaultPosition;
    if (!groups[position]) {
      groups[position] = [];
    }
    groups[position].push(notification);
    return groups;
  }, {});

  // Fermer une notification
  const handleDismiss = (id) => {
    notificationService.dismiss(id);
  };

  // Exécuter l'action associée à une notification
  const handleAction = (notification) => {
    if (notification.onAction && typeof notification.onAction === 'function') {
      notification.onAction();
    }
    
    // Si l'action ne doit pas fermer la notification, il faut l'empêcher explicitement
    if (notification.closeOnAction !== false) {
      handleDismiss(notification.id);
    }
  };

  return (
    <>
      {Object.entries(groupedNotifications).map(([position, positionNotifications]) => (
        <div key={position} className={`notification-container notification-container--${position}`}>
          {positionNotifications.map(notification => (
            <NotificationToast
              key={notification.id}
              notification={notification}
              onDismiss={handleDismiss}
              onAction={handleAction}
            />
          ))}
        </div>
      ))}
    </>
  );
};

NotificationSystem.propTypes = {
  maxNotifications: PropTypes.number,
  defaultPosition: PropTypes.oneOf(Object.values(NotificationPosition))
};

NotificationSystem.defaultProps = {
  maxNotifications: 5,
  defaultPosition: NotificationPosition.TOP_RIGHT
};

export default NotificationSystem;
