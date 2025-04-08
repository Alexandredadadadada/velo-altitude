import React from 'react';
import './OptimizedSkeletons.css';

/**
 * Composants squelettes optimisés pour Velo-Altitude
 * Ces composants s'affichent pendant le chargement des données et du contenu
 * pour améliorer la perception de la performance par l'utilisateur
 */

/**
 * Squelette pour une carte de col de montagne
 */
export const MountainPassCardSkeleton = ({ width = '100%', height = '300px' }) => (
  <div className="skeleton-card" style={{ width, height }}>
    <div className="skeleton-image"></div>
    <div className="skeleton-content">
      <div className="skeleton-title"></div>
      <div className="skeleton-text"></div>
      <div className="skeleton-text"></div>
      <div className="skeleton-stats">
        <div className="skeleton-stat"></div>
        <div className="skeleton-stat"></div>
        <div className="skeleton-stat"></div>
      </div>
    </div>
  </div>
);

/**
 * Squelette pour une grille de cartes
 */
export const CardsGridSkeleton = ({ count = 6, columns = 3 }) => (
  <div className="skeleton-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
    {Array.from({ length: count }).map((_, index) => (
      <MountainPassCardSkeleton key={index} />
    ))}
  </div>
);

/**
 * Squelette pour un profil d'élévation
 */
export const ElevationProfileSkeleton = ({ width = '100%', height = '200px' }) => (
  <div className="skeleton-elevation-profile" style={{ width, height }}>
    <div className="skeleton-graph"></div>
    <div className="skeleton-axis-x"></div>
    <div className="skeleton-axis-y"></div>
  </div>
);

/**
 * Squelette pour un tableau de données
 */
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="skeleton-table">
    <div className="skeleton-table-header">
      {Array.from({ length: columns }).map((_, index) => (
        <div key={`header-${index}`} className="skeleton-table-header-cell"></div>
      ))}
    </div>
    <div className="skeleton-table-body">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="skeleton-table-row">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={`cell-${rowIndex}-${colIndex}`} className="skeleton-table-cell"></div>
          ))}
        </div>
      ))}
    </div>
  </div>
);

/**
 * Squelette pour une section de profil utilisateur
 */
export const ProfileSkeleton = () => (
  <div className="skeleton-profile">
    <div className="skeleton-profile-header">
      <div className="skeleton-avatar"></div>
      <div className="skeleton-profile-info">
        <div className="skeleton-profile-name"></div>
        <div className="skeleton-profile-subtitle"></div>
      </div>
    </div>
    <div className="skeleton-profile-stats">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="skeleton-profile-stat"></div>
      ))}
    </div>
    <div className="skeleton-profile-content">
      <div className="skeleton-text"></div>
      <div className="skeleton-text"></div>
      <div className="skeleton-text"></div>
    </div>
  </div>
);

/**
 * Squelette pour la visualisation 3D
 */
export const Visualization3DSkeleton = ({ width = '100%', height = '400px' }) => (
  <div className="skeleton-3d" style={{ width, height }}>
    <div className="skeleton-3d-overlay">
      <div className="skeleton-3d-loading-indicator"></div>
    </div>
  </div>
);

/**
 * Squelette pour le dashboard
 */
export const DashboardSkeleton = () => (
  <div className="skeleton-dashboard">
    <div className="skeleton-dashboard-header">
      <div className="skeleton-title"></div>
      <div className="skeleton-actions">
        <div className="skeleton-action"></div>
        <div className="skeleton-action"></div>
      </div>
    </div>
    <div className="skeleton-dashboard-metrics">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="skeleton-metric-card"></div>
      ))}
    </div>
    <div className="skeleton-dashboard-content">
      <div className="skeleton-dashboard-main">
        <div className="skeleton-chart-container"></div>
      </div>
      <div className="skeleton-dashboard-sidebar">
        <div className="skeleton-sidebar-item"></div>
        <div className="skeleton-sidebar-item"></div>
        <div className="skeleton-sidebar-item"></div>
      </div>
    </div>
  </div>
);

/**
 * Squelette pour la météo
 */
export const WeatherSkeleton = () => (
  <div className="skeleton-weather">
    <div className="skeleton-weather-header"></div>
    <div className="skeleton-weather-current">
      <div className="skeleton-weather-icon"></div>
      <div className="skeleton-weather-temp"></div>
    </div>
    <div className="skeleton-weather-forecast">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="skeleton-weather-day"></div>
      ))}
    </div>
  </div>
);

/**
 * Squelette générique et configurable
 */
export const GenericSkeleton = ({ 
  width = '100%', 
  height = '100px',
  variant = 'rect',
  animate = true,
  borderRadius = '4px'
}) => (
  <div 
    className={`skeleton-generic ${animate ? 'skeleton-animate' : ''}`} 
    style={{ 
      width, 
      height, 
      borderRadius: variant === 'circle' ? '50%' : borderRadius
    }}
  ></div>
);

/**
 * Groupe de squelettes génériques
 */
export const SkeletonGroup = ({ 
  count = 3,
  direction = 'column',
  spacing = '10px',
  children
}) => (
  <div 
    className="skeleton-group"
    style={{ 
      display: 'flex', 
      flexDirection: direction,
      gap: spacing
    }}
  >
    {children || Array.from({ length: count }).map((_, index) => (
      <GenericSkeleton key={index} height={direction === 'column' ? '60px' : '100%'} />
    ))}
  </div>
);

// Exportation d'un composant par défaut qui sélectionne le squelette approprié
const OptimizedSkeleton = ({ type = 'generic', ...props }) => {
  switch (type) {
    case 'card':
      return <MountainPassCardSkeleton {...props} />;
    case 'grid':
      return <CardsGridSkeleton {...props} />;
    case 'elevation':
      return <ElevationProfileSkeleton {...props} />;
    case 'table':
      return <TableSkeleton {...props} />;
    case 'profile':
      return <ProfileSkeleton {...props} />;
    case '3d':
      return <Visualization3DSkeleton {...props} />;
    case 'dashboard':
      return <DashboardSkeleton {...props} />;
    case 'weather':
      return <WeatherSkeleton {...props} />;
    default:
      return <GenericSkeleton {...props} />;
  }
};

export default OptimizedSkeleton;
