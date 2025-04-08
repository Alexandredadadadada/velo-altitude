import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import './ProfileTabs.css';

/**
 * Composant d'onglets pour la navigation entre les différentes sections du profil
 * 
 * Fournit une navigation élégante avec des animations fluides et des indicateurs visuels
 */
export const ProfileTabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'profile', label: 'Profil', icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    )},
    { id: 'preferences', label: 'Préférences', icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
      </svg>
    )},
    { id: 'notifications', label: 'Notifications', icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
      </svg>
    )},
    { id: 'privacy', label: 'Confidentialité', icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
      </svg>
    )}
  ];
  
  // Animation pour l'indicateur d'onglet actif
  const tabIndicatorVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
    }
  };
  
  return (
    <div className="profile-tabs">
      <nav className="profile-tabs-nav">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              className={`profile-tab ${isActive ? 'profile-tab--active' : ''}`}
              onClick={() => onTabChange(tab.id)}
              aria-selected={isActive}
              role="tab"
            >
              <span className="profile-tab-icon">{tab.icon}</span>
              <span className="profile-tab-label">{tab.label}</span>
              
              {isActive && (
                <motion.div 
                  className="profile-tab-indicator"
                  layoutId="tabIndicator"
                  variants={tabIndicatorVariants}
                  initial="initial"
                  animate="animate"
                ></motion.div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

ProfileTabs.propTypes = {
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired
};
