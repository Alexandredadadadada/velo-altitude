import React from 'react';
import PropTypes from 'prop-types';
import './LoadingStates.css';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

/**
 * Composant de chargement pour afficher un état de chargement cohérent
 * dans toute l'application conformément au design system
 */
export const LoadingOverlay = ({ 
  isLoading, 
  message = "Chargement en cours...", 
  variant = "overlay",
  children
}) => {
  if (!isLoading) return children;

  return (
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/loadingstates"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
    <div className="position-relative">
      {variant === "overlay" && children}
      <div 
        className={`loading-container ${variant}`} 
        role="alert" 
        aria-busy="true" 
        aria-live="polite"
      >
        <div className="loading-spinner">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement</span>
          </div>
        </div>
        {message && <p className="loading-message">{message}</p>}
      </div>
    </div>
  );
};

/**
 * Composant de placeholders pendant le chargement
 * Utilise des animations de type "skeleton" pour indiquer le chargement
 */
export const SkeletonLoader = ({ 
  type = "text", 
  count = 1,
  width,
  height,
  className = "",
  isLoading = true
}) => {
  if (!isLoading) return null;

  const renderSkeleton = () => {
    switch (type) {
      case 'text':
        return <div className={`skeleton-text skeleton ${className}`} style={{ width, height }} />;
      case 'title':
        return <div className={`skeleton-title skeleton ${className}`} style={{ width, height }} />;
      case 'circle':
        return <div className={`skeleton-circle skeleton ${className}`} style={{ width, height }} />;
      case 'rectangle':
        return <div className={`skeleton-rectangle skeleton ${className}`} style={{ width, height }} />;
      case 'card':
        return (
          <div className={`skeleton-card skeleton ${className}`}>
            <div className="skeleton-img skeleton" />
            <div className="skeleton-card-body">
              <div className="skeleton-title skeleton" />
              <div className="skeleton-text skeleton" />
              <div className="skeleton-text skeleton" />
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className={`skeleton-profile skeleton ${className}`}>
            <div className="skeleton-circle skeleton" />
            <div className="skeleton-profile-info">
              <div className="skeleton-title skeleton" />
              <div className="skeleton-text skeleton" />
            </div>
          </div>
        );
      case 'table':
        return (
          <div className={`skeleton-table skeleton ${className}`}>
            {Array(count).fill().map((_, i) => (
              <div key={i} className="skeleton-row">
                {Array(5).fill().map((_, j) => (
                  <div key={j} className="skeleton-cell skeleton" />
                ))}
              </div>
            ))}
          </div>
        );
      case 'chart':
        return (
          <div className={`skeleton-chart skeleton ${className}`} style={{ width, height }}>
            <div className="skeleton-chart-bars">
              {Array(8).fill().map((_, i) => (
                <div key={i} className="skeleton-chart-bar skeleton" 
                  style={{ height: `${20 + Math.random() * 60}%` }} 
                />
              ))}
            </div>
          </div>
        );
      default:
        return <div className={`skeleton-text skeleton ${className}`} style={{ width, height }} />;
    }
  };

  return (
    <main className="skeleton-container" aria-hidden="true">
      {Array(count).fill().map((_, index) => (
        <div key={index} className="skeleton-item">
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};

/**
 * Composant pour indiquer le chargement des visualisations 3D
 */
export const Visualization3DLoader = ({ progress, message }) => {
  return (
    <div 
      className="visualization-loader" 
      role="progressbar" 
      aria-valuemin="0" 
      aria-valuemax="100" 
      aria-valuenow={progress || 0}
      aria-label="Chargement de la visualisation 3D"
    >
      <main className="progress-container">
        <div className="progress-bar" style={{ width: `${progress || 0}%` }}></div>
      </div>
      <p className="loading-message">
        {message || `Chargement de la visualisation: ${progress || 0}%`}
      </p>
      <div className="loading-details">
        <div className="loading-stage">Préparation des données terrain</div>
        <div className="loading-stage">Génération du maillage 3D</div>
        <div className="loading-stage">Application des textures</div>
        <div className="loading-stage">Chargement des points d'intérêt</div>
      </div>
    </div>
  );
};

/**
 * Composant pour afficher les transitions entre les données
 */
export const DataTransition = ({ isLoading, children, type = "fade" }) => {
  return (
    <div className={`data-transition ${type} ${isLoading ? 'loading' : 'loaded'}`}>
      {children}
    </div>
  );
};

LoadingOverlay.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  message: PropTypes.string,
  variant: PropTypes.oneOf(['overlay', 'fullscreen', 'inline']),
  children: PropTypes.node
};

SkeletonLoader.propTypes = {
  type: PropTypes.oneOf(['text', 'title', 'circle', 'rectangle', 'card', 'profile', 'table', 'chart']),
  count: PropTypes.number,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string,
  isLoading: PropTypes.bool
};

Visualization3DLoader.propTypes = {
  progress: PropTypes.number,
  message: PropTypes.string
};

DataTransition.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  children: PropTypes.node,
  type: PropTypes.oneOf(['fade', 'slide', 'zoom'])
};

export default {
  LoadingOverlay,
  SkeletonLoader,
  Visualization3DLoader,
  DataTransition
};
