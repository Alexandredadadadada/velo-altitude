import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import '../../design-system/styles/glassmorphism.scss';
import './EmptyStates.css';

/**
 * Collection de composants "Empty State" premium
 * 
 * Écrans élégants et informatifs pour les situations où aucune donnée n'est disponible
 * ou lorsque l'utilisateur doit effectuer une action spécifique
 */

// État vide basique avec icône, titre, description et action optionnelle
export const BasicEmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default', // 'default', 'compact', 'centered', 'fullscreen'
  background = true,
  className = ''
}) => {
  const emptyVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
    }
  };
  
  const variantClass = `empty-state--${variant}`;
  
  return (
    <motion.div 
      className={`empty-state ${variantClass} ${background ? 'glass glass--subtle' : ''} ${className}`}
      variants={emptyVariants}
      initial="hidden"
      animate="visible"
    >
      {icon && (
        <motion.div className="empty-state__icon" variants={itemVariants}>
          {typeof icon === 'string' ? (
            <span className="empty-state__emoji">{icon}</span>
          ) : (
            icon
          )}
        </motion.div>
      )}
      
      {title && (
        <motion.h3 className="empty-state__title" variants={itemVariants}>
          {title}
        </motion.h3>
      )}
      
      {description && (
        <motion.p className="empty-state__description" variants={itemVariants}>
          {description}
        </motion.p>
      )}
      
      {actionLabel && onAction && (
        <motion.button 
          className="empty-state__action glass glass--button"
          onClick={onAction}
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
};

BasicEmptyState.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.node,
  description: PropTypes.node,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
  variant: PropTypes.oneOf(['default', 'compact', 'centered', 'fullscreen']),
  background: PropTypes.bool,
  className: PropTypes.string
};

// État vide pour les profils non connectés
export const ProfileEmptyState = ({
  onConnect,
  onSignUp,
  serviceName = 'Strava',
  className = ''
}) => {
  return (
    <div className={`profile-empty-state glass glass--premium ${className}`}>
      <div className="profile-empty-state__content">
        <div className="profile-empty-state__avatar-placeholder">
          <span>👤</span>
        </div>
        
        <h3 className="profile-empty-state__title">
          Bienvenue sur Velo-Altitude
        </h3>
        
        <p className="profile-empty-state__description">
          Connectez votre compte ou inscrivez-vous pour suivre vos performances et découvrir des parcours adaptés à votre niveau.
        </p>
        
        <div className="profile-empty-state__actions">
          {onConnect && (
            <button 
              className="profile-empty-state__connect-button"
              onClick={onConnect}
            >
              <div className="profile-empty-state__service-icon">
                {serviceName === 'Strava' ? (
                  <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="#FC4C02" d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                  </svg>
                ) : (
                  <span>🔄</span>
                )}
              </div>
              <span>Connecter {serviceName}</span>
            </button>
          )}
          
          {onSignUp && (
            <button 
              className="profile-empty-state__signup-button glass glass--button"
              onClick={onSignUp}
            >
              Créer un compte
            </button>
          )}
        </div>
      </div>
      
      <div className="profile-empty-state__benefits">
        <div className="profile-empty-state__benefit">
          <div className="profile-empty-state__benefit-icon">🗺️</div>
          <div className="profile-empty-state__benefit-text">
            <h4>Parcours personnalisés</h4>
            <p>Découvrez des cols et routes adaptés à votre niveau</p>
          </div>
        </div>
        
        <div className="profile-empty-state__benefit">
          <div className="profile-empty-state__benefit-icon">📊</div>
          <div className="profile-empty-state__benefit-text">
            <h4>Suivi de progression</h4>
            <p>Analysez vos performances et améliorez vos résultats</p>
          </div>
        </div>
        
        <div className="profile-empty-state__benefit">
          <div className="profile-empty-state__benefit-icon">🏆</div>
          <div className="profile-empty-state__benefit-text">
            <h4>Défis et récompenses</h4>
            <p>Fixez-vous des objectifs et obtenez des distinctions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

ProfileEmptyState.propTypes = {
  onConnect: PropTypes.func,
  onSignUp: PropTypes.func,
  serviceName: PropTypes.string,
  className: PropTypes.string
};

// État vide pour les recherches sans résultats
export const SearchEmptyState = ({
  query = '',
  suggestions = [],
  onReset,
  onSuggestionClick,
  className = ''
}) => {
  return (
    <div className={`search-empty-state glass glass--subtle ${className}`}>
      <div className="search-empty-state__icon">🔍</div>
      
      <h3 className="search-empty-state__title">
        Aucun résultat trouvé
      </h3>
      
      <p className="search-empty-state__description">
        {query ? (
          <>Aucun résultat ne correspond à <strong>"{query}"</strong></>
        ) : (
          'Aucun résultat ne correspond à votre recherche'
        )}
      </p>
      
      {suggestions.length > 0 && (
        <div className="search-empty-state__suggestions">
          <p className="search-empty-state__suggestions-title">
            Suggestions:
          </p>
          
          <ul className="search-empty-state__suggestions-list">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="search-empty-state__suggestion">
                <button 
                  className="search-empty-state__suggestion-button"
                  onClick={() => onSuggestionClick(suggestion)}
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {onReset && (
        <button 
          className="search-empty-state__reset glass glass--button"
          onClick={onReset}
        >
          Réinitialiser la recherche
        </button>
      )}
    </div>
  );
};

SearchEmptyState.propTypes = {
  query: PropTypes.string,
  suggestions: PropTypes.array,
  onReset: PropTypes.func,
  onSuggestionClick: PropTypes.func,
  className: PropTypes.string
};

// État vide pour les listes d'éléments
export const CollectionEmptyState = ({
  type = 'generic', // 'generic', 'routes', 'activities', 'achievements', 'favorites'
  actionLabel,
  onAction,
  isLoading = false,
  error = null,
  className = ''
}) => {
  // Configuration selon le type
  const config = {
    generic: {
      icon: '📋',
      title: 'Aucun élément disponible',
      description: 'Aucun élément n'a été trouvé dans cette collection.'
    },
    routes: {
      icon: '🗺️',
      title: 'Aucun parcours disponible',
      description: 'Vous n\'avez pas encore de parcours enregistrés.'
    },
    activities: {
      icon: '🚴‍♂️',
      title: 'Aucune activité disponible',
      description: 'Vous n\'avez pas encore d\'activités enregistrées.'
    },
    achievements: {
      icon: '🏆',
      title: 'Aucune réalisation disponible',
      description: 'Relevez des défis pour obtenir des réalisations.'
    },
    favorites: {
      icon: '❤️',
      title: 'Aucun favori disponible',
      description: 'Vous n\'avez pas encore ajouté d\'éléments à vos favoris.'
    }
  };
  
  // État en cas d'erreur
  if (error) {
    return (
      <div className={`collection-empty-state collection-empty-state--error glass glass--subtle ${className}`}>
        <div className="collection-empty-state__icon">⚠️</div>
        <h3 className="collection-empty-state__title">Une erreur est survenue</h3>
        <p className="collection-empty-state__description">
          {error.message || 'Impossible de charger les données. Veuillez réessayer.'}
        </p>
        {onAction && (
          <button 
            className="collection-empty-state__action glass glass--button"
            onClick={onAction}
          >
            {actionLabel || 'Réessayer'}
          </button>
        )}
      </div>
    );
  }
  
  // État de chargement
  if (isLoading) {
    return (
      <div className={`collection-empty-state collection-empty-state--loading glass glass--subtle ${className}`}>
        <div className="collection-empty-state__loading">
          <div className="collection-empty-state__loading-spinner"></div>
          <p className="collection-empty-state__loading-text">Chargement en cours...</p>
        </div>
      </div>
    );
  }
  
  // Configuration du type sélectionné
  const { icon, title, description } = config[type];
  
  return (
    <div className={`collection-empty-state glass glass--subtle ${className}`}>
      <div className="collection-empty-state__icon">{icon}</div>
      <h3 className="collection-empty-state__title">{title}</h3>
      <p className="collection-empty-state__description">{description}</p>
      {actionLabel && onAction && (
        <button 
          className="collection-empty-state__action glass glass--button"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

CollectionEmptyState.propTypes = {
  type: PropTypes.oneOf(['generic', 'routes', 'activities', 'achievements', 'favorites']),
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
  isLoading: PropTypes.bool,
  error: PropTypes.object,
  className: PropTypes.string
};

// État vide générique avec illustration personnalisable
export const IllustrationEmptyState = ({
  illustration,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div className={`illustration-empty-state glass glass--premium ${className}`}>
      {illustration && (
        <div className="illustration-empty-state__illustration">
          {illustration}
        </div>
      )}
      
      <div className="illustration-empty-state__content">
        {title && <h3 className="illustration-empty-state__title">{title}</h3>}
        
        {description && (
          <p className="illustration-empty-state__description">{description}</p>
        )}
        
        {actionLabel && onAction && (
          <button 
            className="illustration-empty-state__action glass glass--button"
            onClick={onAction}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
};

IllustrationEmptyState.propTypes = {
  illustration: PropTypes.node,
  title: PropTypes.node,
  description: PropTypes.node,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
  className: PropTypes.string
};

// Exporter tous les composants d'état vide
const EmptyStates = {
  BasicEmptyState,
  ProfileEmptyState,
  SearchEmptyState,
  CollectionEmptyState,
  IllustrationEmptyState
};

export default EmptyStates;
