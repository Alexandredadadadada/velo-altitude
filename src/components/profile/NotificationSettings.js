import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { Checkbox } from '../common/PremiumFormFields';
import './NotificationSettings.css';

/**
 * Paramètres de notification pour la page de profil utilisateur
 * 
 * Ce composant permet aux utilisateurs de gérer leurs préférences 
 * de notification avec une interface visuelle élégante
 */
export const NotificationSettings = ({ isEditing, formData, onChange }) => {
  // Paramètres de notification par défaut
  const notificationSettings = [
    {
      id: 'app_notifications',
      title: 'Notifications de l\'application',
      options: [
        { id: 'new_follower', label: 'Nouveaux abonnés', checked: true },
        { id: 'achievement_earned', label: 'Réalisations débloquées', checked: true },
        { id: 'kudos_received', label: 'Kudos reçus', checked: true },
        { id: 'comment_received', label: 'Commentaires reçus', checked: true },
        { id: 'challenge_invitation', label: 'Invitation à un défi', checked: true },
        { id: 'challenge_completed', label: 'Défi terminé', checked: true }
      ]
    },
    {
      id: 'email_notifications',
      title: 'Notifications par email',
      options: [
        { id: 'newsletter', label: 'Newsletter (nouveautés et actualités)', checked: formData.newsletterSubscription },
        { id: 'new_features', label: 'Nouvelles fonctionnalités', checked: true },
        { id: 'event_reminders', label: 'Rappels d\'événements', checked: true },
        { id: 'weekly_summary', label: 'Résumé hebdomadaire d\'activité', checked: false },
        { id: 'promotional', label: 'Offres promotionnelles et événements partenaires', checked: false }
      ]
    },
    {
      id: 'push_notifications',
      title: 'Notifications push',
      options: [
        { id: 'friend_activity', label: 'Activités des amis', checked: true },
        { id: 'weather_alerts', label: 'Alertes météo pour vos parcours prévus', checked: true },
        { id: 'segment_improvements', label: 'Améliorations de segments', checked: true },
        { id: 'recommended_routes', label: 'Parcours recommandés', checked: false },
        { id: 'local_events', label: 'Événements locaux', checked: false }
      ]
    }
  ];
  
  // Style d'animation pour les sections
  const sectionVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
    }
  };
  
  return (
    <div className="notification-settings">
      <p className="notification-settings-intro">
        Personnalisez vos préférences de notification pour rester informé des activités qui vous intéressent le plus.
      </p>
      
      {notificationSettings.map((section, index) => (
        <motion.div 
          key={section.id} 
          className="notification-section"
          variants={sectionVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: index * 0.1 }}
        >
          <h2 className="notification-section-title">{section.title}</h2>
          
          <div className="notification-options">
            {section.options.map((option) => (
              <div key={option.id} className="notification-option">
                <Checkbox
                  id={`notification_${option.id}`}
                  name={`notification_${option.id}`}
                  label={option.label}
                  checked={option.checked}
                  onChange={onChange}
                  disabled={!isEditing}
                  variant="filled"
                />
                
                {option.id === 'weather_alerts' && (
                  <div className="notification-option-description">
                    Recevez des alertes météo pour les parcours que vous avez planifiés.
                  </div>
                )}
                
                {option.id === 'weekly_summary' && (
                  <div className="notification-option-description">
                    Un récapitulatif hebdomadaire de vos performances, distances parcourues et temps d'activité.
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      ))}
      
      <motion.div 
        className="notification-settings-footer"
        variants={sectionVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.3 }}
      >
        <p className="notification-settings-note">
          Note : Vous pouvez modifier ces préférences à tout moment. Certaines notifications système 
          importantes concernant votre compte ne peuvent être désactivées.
        </p>
      </motion.div>
    </div>
  );
};

NotificationSettings.propTypes = {
  isEditing: PropTypes.bool.isRequired,
  formData: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};
