import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { MdDragIndicator, MdClose, MdSettings, MdAdd, MdRefresh } from 'react-icons/md';
import './DashboardWidgets.css';

/**
 * Système de widgets de tableau de bord premium avec fonctionnalités de redimensionnement et de réorganisation
 * Permet une visualisation personnalisée des métriques importantes pour l'utilisateur
 * 
 * @component
 */
export const DashboardContainer = ({ children, onLayoutChange, addWidgetMode, onAddWidget }) => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-widgets-grid">
        {children}
      </div>
      
      {addWidgetMode && (
        <motion.div 
          className="dashboard-add-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="dashboard-add-container">
            <h3 className="dashboard-add-title">Ajouter un widget</h3>
            <div className="dashboard-add-grid">
              {AVAILABLE_WIDGETS.map(widget => (
                <motion.div
                  key={widget.id}
                  className="dashboard-add-item"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onAddWidget(widget.id)}
                >
                  <div className="dashboard-add-icon">{widget.icon}</div>
                  <h4 className="dashboard-add-item-title">{widget.name}</h4>
                  <p className="dashboard-add-item-desc">{widget.description}</p>
                </motion.div>
              ))}
            </div>
            <button 
              className="dashboard-add-close glass glass--button"
              onClick={() => onAddWidget(null)}
            >
              Annuler
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

DashboardContainer.propTypes = {
  children: PropTypes.node,
  onLayoutChange: PropTypes.func,
  addWidgetMode: PropTypes.bool,
  onAddWidget: PropTypes.func
};

DashboardContainer.defaultProps = {
  addWidgetMode: false,
  onLayoutChange: () => {},
  onAddWidget: () => {}
};

/**
 * Composant Widget individuel avec gestion d'états et animations
 * Support pour le redimensionnement et différentes tailles prédéfinies
 * 
 * @component
 */
export const DashboardWidget = ({ 
  id, 
  title, 
  size = 'medium',
  allowResize = true,
  allowRemove = true,
  allowRefresh = true,
  allowSettings = true,
  isLoading = false,
  lastUpdated = null,
  onRefresh,
  onRemove,
  onResize,
  onSettings,
  children 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  // Déterminer le style en fonction de la taille
  const widgetClasses = `dashboard-widget dashboard-widget--${size} glass`;

  // Variantes d'animation
  const widgetVariants = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { 
      opacity: 1, 
      scale: 1, 
      transition: { duration: 0.3, type: 'spring', stiffness: 300, damping: 25 } 
    },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
  };
  
  const handleResize = (newSize) => {
    if (onResize) {
      onResize(id, newSize);
      setMenuOpen(false);
    }
  };
  
  // Formater la date de dernière mise à jour
  const formatUpdatedTime = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const updated = new Date(timestamp);
    const diffMs = now - updated;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'à l\'instant';
    if (diffMins < 60) return `il y a ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `il y a ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `il y a ${diffDays}j`;
  };
  
  return (
    <motion.div
      className={widgetClasses}
      variants={widgetVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMenuOpen(false);
      }}
    >
      <div className="dashboard-widget-header">
        <div className="dashboard-widget-drag-handle">
          <MdDragIndicator />
        </div>
        
        <div className="dashboard-widget-title">{title}</div>
        
        <div className="dashboard-widget-controls">
          {isHovered && (
            <AnimatePresence>
              <motion.div 
                className="dashboard-widget-actions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {allowRefresh && (
                  <button 
                    className="dashboard-widget-action dashboard-widget-refresh"
                    onClick={onRefresh}
                    aria-label="Rafraîchir le widget"
                  >
                    <MdRefresh />
                  </button>
                )}
                
                {allowSettings && (
                  <button 
                    className="dashboard-widget-action dashboard-widget-settings"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Paramètres du widget"
                  >
                    <MdSettings />
                  </button>
                )}
                
                {allowRemove && (
                  <button 
                    className="dashboard-widget-action dashboard-widget-remove"
                    onClick={() => onRemove(id)}
                    aria-label="Supprimer le widget"
                  >
                    <MdClose />
                  </button>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
      
      {menuOpen && (
        <div className="dashboard-widget-menu">
          <div className="dashboard-widget-menu-group">
            <div className="dashboard-widget-menu-title">Taille</div>
            <div className="dashboard-widget-menu-options">
              <button 
                className={`dashboard-widget-menu-option ${size === 'small' ? 'active' : ''}`}
                onClick={() => handleResize('small')}
              >
                Petit
              </button>
              <button 
                className={`dashboard-widget-menu-option ${size === 'medium' ? 'active' : ''}`}
                onClick={() => handleResize('medium')}
              >
                Moyen
              </button>
              <button 
                className={`dashboard-widget-menu-option ${size === 'large' ? 'active' : ''}`}
                onClick={() => handleResize('large')}
              >
                Grand
              </button>
              <button 
                className={`dashboard-widget-menu-option ${size === 'full' ? 'active' : ''}`}
                onClick={() => handleResize('full')}
              >
                Plein
              </button>
            </div>
          </div>
          
          <div className="dashboard-widget-menu-group">
            <button 
              className="dashboard-widget-menu-settings"
              onClick={() => {
                onSettings(id);
                setMenuOpen(false);
              }}
            >
              Paramètres avancés
            </button>
          </div>
        </div>
      )}
      
      <div className="dashboard-widget-content">
        {isLoading ? (
          <div className="dashboard-widget-loading">
            <div className="dashboard-widget-loader"></div>
            <div>Chargement...</div>
          </div>
        ) : children}
      </div>
      
      {lastUpdated && (
        <div className="dashboard-widget-footer">
          <div className="dashboard-widget-updated">
            Mis à jour {formatUpdatedTime(lastUpdated)}
          </div>
        </div>
      )}
    </motion.div>
  );
};

DashboardWidget.propTypes = {
  id: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['small', 'medium', 'large', 'full']),
  allowResize: PropTypes.bool,
  allowRemove: PropTypes.bool,
  allowRefresh: PropTypes.bool,
  allowSettings: PropTypes.bool,
  isLoading: PropTypes.bool,
  lastUpdated: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  onRefresh: PropTypes.func,
  onRemove: PropTypes.func,
  onResize: PropTypes.func,
  onSettings: PropTypes.func,
  children: PropTypes.node
};

DashboardWidget.defaultProps = {
  size: 'medium',
  allowResize: true,
  allowRemove: true,
  allowRefresh: true,
  allowSettings: true,
  isLoading: false,
  onRefresh: () => {},
  onRemove: () => {},
  onResize: () => {},
  onSettings: () => {}
};

/**
 * Composant pour ajouter un nouveau widget au tableau de bord
 * 
 * @component
 */
export const AddWidgetButton = ({ onClick }) => {
  return (
    <motion.button
      className="dashboard-add-widget-button glass"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="Ajouter un widget"
    >
      <MdAdd className="dashboard-add-widget-icon" />
      <span className="dashboard-add-widget-text">Ajouter un widget</span>
    </motion.button>
  );
};

AddWidgetButton.propTypes = {
  onClick: PropTypes.func.isRequired
};

// Liste des widgets disponibles pour l'ajout
const AVAILABLE_WIDGETS = [
  {
    id: 'activity_summary',
    name: 'Résumé d\'activité',
    description: 'Aperçu de vos activités récentes et statistiques',
    icon: <span className="dashboard-widget-icon activity-icon">🚴</span>
  },
  {
    id: 'upcoming_challenges',
    name: 'Défis à venir',
    description: 'Vos prochains défis et événements programmés',
    icon: <span className="dashboard-widget-icon challenge-icon">🏆</span>
  },
  {
    id: 'weather_forecast',
    name: 'Météo cycliste',
    description: 'Prévisions météo optimisées pour le cyclisme',
    icon: <span className="dashboard-widget-icon weather-icon">🌤️</span>
  },
  {
    id: 'training_progress',
    name: 'Progression d\'entraînement',
    description: 'Suivi de vos objectifs d\'entraînement',
    icon: <span className="dashboard-widget-icon training-icon">📈</span>
  },
  {
    id: 'nutrition_tracking',
    name: 'Suivi nutritionnel',
    description: 'Bilan de votre alimentation et hydratation',
    icon: <span className="dashboard-widget-icon nutrition-icon">🍎</span>
  },
  {
    id: 'cycling_tips',
    name: 'Conseils cyclisme',
    description: 'Astuces personnalisées pour améliorer vos performances',
    icon: <span className="dashboard-widget-icon tips-icon">💡</span>
  },
  {
    id: 'strava_feed',
    name: 'Flux Strava',
    description: 'Activités récentes de vos amis Strava',
    icon: <span className="dashboard-widget-icon strava-icon">📱</span>
  },
  {
    id: 'col_progress',
    name: 'Progression cols',
    description: 'Suivi de votre collection de cols gravis',
    icon: <span className="dashboard-widget-icon mountain-icon">⛰️</span>
  }
];
