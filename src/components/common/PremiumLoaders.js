import React from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import '../../design-system/styles/glassmorphism.scss';
import './PremiumLoaders.css';

/**
 * Collection de loaders premium pour les états de chargement
 * 
 * Composants avec animations et styles premium pour améliorer
 * l'expérience utilisateur pendant les temps de chargement.
 */

// Loader avec effet glassmorphism et pulsation
export const PulseLoader = ({ size = 'medium', variant = 'primary', className = '' }) => {
  const sizeClass = `premium-loader--${size}`;
  const variantClass = `premium-loader--${variant}`;
  
  return (
    <div className={`premium-loader premium-loader--pulse ${sizeClass} ${variantClass} ${className}`}>
      <div className="premium-loader__pulse glass glass--subtle"></div>
    </div>
  );
};

PulseLoader.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'accent']),
  className: PropTypes.string
};

// Loader linéaire avec progression
export const ProgressLoader = ({ 
  progress = -1, // -1 pour indéterminé
  variant = 'primary',
  height = 4,
  className = '',
  showValue = false
}) => {
  const isIndeterminate = progress < 0 || progress > 100;
  const variantClass = `premium-loader--${variant}`;
  
  return (
    <div className={`premium-loader premium-loader--progress ${variantClass} ${className}`}>
      <div 
        className="premium-loader__track"
        style={{ height: `${height}px` }}
      >
        <motion.div 
          className="premium-loader__bar"
          initial={{ width: isIndeterminate ? '0%' : `${progress}%` }}
          animate={{ 
            width: isIndeterminate ? ['20%', '60%', '20%'] : `${progress}%`,
            left: isIndeterminate ? ['-20%', '100%', '-20%'] : 0
          }}
          transition={isIndeterminate ? {
            repeat: Infinity,
            duration: 2,
            ease: "easeInOut"
          } : {
            duration: 0.4,
            ease: "easeOut"
          }}
        />
      </div>
      {!isIndeterminate && showValue && (
        <div className="premium-loader__value">{Math.round(progress)}%</div>
      )}
    </div>
  );
};

ProgressLoader.propTypes = {
  progress: PropTypes.number,
  variant: PropTypes.oneOf(['primary', 'secondary', 'accent']),
  height: PropTypes.number,
  className: PropTypes.string,
  showValue: PropTypes.bool
};

// Skeleton loader pour texte et cartes
export const SkeletonElement = ({ 
  type = 'text', // 'text', 'title', 'avatar', 'thumbnail', 'rectangle', 'circle', 'button'
  size = 'medium', // 'small', 'medium', 'large'
  width,
  height,
  count = 1,
  className = ''
}) => {
  const elements = Array.from({ length: count }, (_, index) => {
    const typeClass = `skeleton--${type}`;
    const sizeClass = `skeleton--${size}`;
    
    return (
      <div 
        key={index}
        className={`skeleton ${typeClass} ${sizeClass} ${className}`}
        style={{ 
          width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
          height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined
        }}
      >
        <div className="skeleton__animation"></div>
      </div>
    );
  });
  
  return <>{elements}</>;
};

SkeletonElement.propTypes = {
  type: PropTypes.oneOf(['text', 'title', 'avatar', 'thumbnail', 'rectangle', 'circle', 'button']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  count: PropTypes.number,
  className: PropTypes.string
};

// Skeleton pour une liste d'éléments
export const SkeletonList = ({ 
  count = 3, 
  imageSize = 60, 
  itemHeight = 80,
  withImage = true,
  imageType = 'circle', // 'circle', 'rectangle'
  gap = 16,
  className = ''
}) => {
  return (
    <div 
      className={`skeleton-list ${className}`}
      style={{ gap: `${gap}px` }}
    >
      {Array.from({ length: count }, (_, index) => (
        <div 
          key={index} 
          className="skeleton-list__item"
          style={{ height: `${itemHeight}px` }}
        >
          {withImage && (
            <div className="skeleton-list__image">
              <SkeletonElement 
                type={imageType} 
                width={imageSize}
                height={imageSize}
              />
            </div>
          )}
          <div className="skeleton-list__content">
            <SkeletonElement type="title" width="70%" />
            <SkeletonElement type="text" width="90%" />
            <SkeletonElement type="text" width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
};

SkeletonList.propTypes = {
  count: PropTypes.number,
  imageSize: PropTypes.number,
  itemHeight: PropTypes.number,
  withImage: PropTypes.bool,
  imageType: PropTypes.oneOf(['circle', 'rectangle']),
  gap: PropTypes.number,
  className: PropTypes.string
};

// Skeleton pour une grille de cartes
export const SkeletonGrid = ({ 
  columns = 3,
  rows = 2,
  cardHeight = 200,
  cardWidth,
  gap = 20,
  className = ''
}) => {
  return (
    <div 
      className={`skeleton-grid ${className}`}
      style={{ 
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`
      }}
    >
      {Array.from({ length: columns * rows }, (_, index) => (
        <div 
          key={index} 
          className="skeleton-grid__item glass glass--subtle"
          style={{ 
            height: `${cardHeight}px`,
            width: cardWidth ? `${cardWidth}px` : undefined
          }}
        >
          <SkeletonElement type="rectangle" height="60%" />
          <div className="skeleton-grid__content">
            <SkeletonElement type="title" width="80%" />
            <SkeletonElement type="text" width="60%" />
          </div>
        </div>
      ))}
    </div>
  );
};

SkeletonGrid.propTypes = {
  columns: PropTypes.number,
  rows: PropTypes.number,
  cardHeight: PropTypes.number,
  cardWidth: PropTypes.number,
  gap: PropTypes.number,
  className: PropTypes.string
};

// Skeleton pour un tableau de bord
export const SkeletonDashboard = ({ className = '' }) => {
  return (
    <div className={`skeleton-dashboard ${className}`}>
      {/* En-tête */}
      <div className="skeleton-dashboard__header glass glass--subtle">
        <div className="skeleton-dashboard__user">
          <SkeletonElement type="circle" size="large" width={80} height={80} />
          <div className="skeleton-dashboard__user-info">
            <SkeletonElement type="title" width={200} />
            <SkeletonElement type="text" width={300} />
          </div>
        </div>
      </div>
      
      {/* Statistiques */}
      <div className="skeleton-dashboard__stats">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="skeleton-dashboard__stat glass glass--subtle">
            <SkeletonElement type="rectangle" width={50} height={50} />
            <div className="skeleton-dashboard__stat-content">
              <SkeletonElement type="text" width="40%" />
              <SkeletonElement type="title" width="60%" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Graphique */}
      <div className="skeleton-dashboard__chart glass glass--subtle">
        <div className="skeleton-dashboard__chart-header">
          <SkeletonElement type="title" width={150} />
          <div className="skeleton-dashboard__chart-controls">
            <SkeletonElement type="button" width={80} />
            <SkeletonElement type="button" width={80} />
          </div>
        </div>
        <div className="skeleton-dashboard__chart-placeholder">
          <SkeletonElement type="rectangle" height={200} />
        </div>
      </div>
      
      {/* Liste d'activités */}
      <div className="skeleton-dashboard__activities glass glass--subtle">
        <SkeletonElement type="title" width={200} />
        <SkeletonList count={3} />
      </div>
    </div>
  );
};

SkeletonDashboard.propTypes = {
  className: PropTypes.string
};

// Composant loader avec dots animés
export const DotsLoader = ({ size = 'medium', variant = 'primary', className = '' }) => {
  const sizeClass = `premium-loader--${size}`;
  const variantClass = `premium-loader--${variant}`;
  
  const dotVariants = {
    initial: { y: 0 },
    animate: {
      y: [0, -10, 0],
      transition: {
        repeat: Infinity,
        duration: 1
      }
    }
  };
  
  return (
    <div className={`premium-loader premium-loader--dots ${sizeClass} ${variantClass} ${className}`}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="premium-loader__dot"
          variants={dotVariants}
          initial="initial"
          animate="animate"
          transition={{
            delay: index * 0.2
          }}
        />
      ))}
    </div>
  );
};

DotsLoader.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'accent']),
  className: PropTypes.string
};

// Composant loader circulaire
export const SpinnerLoader = ({ 
  size = 'medium', 
  variant = 'primary', 
  thickness = 3,
  className = '' 
}) => {
  const sizeClass = `premium-loader--${size}`;
  const variantClass = `premium-loader--${variant}`;
  
  return (
    <div className={`premium-loader premium-loader--spinner ${sizeClass} ${variantClass} ${className}`}>
      <div 
        className="premium-loader__circle"
        style={{ borderWidth: `${thickness}px` }}
      />
    </div>
  );
};

SpinnerLoader.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf(['primary', 'secondary', 'accent']),
  thickness: PropTypes.number,
  className: PropTypes.string
};

// Exporter tous les loaders
const PremiumLoaders = {
  PulseLoader,
  ProgressLoader,
  SkeletonElement,
  SkeletonList,
  SkeletonGrid,
  SkeletonDashboard,
  DotsLoader,
  SpinnerLoader
};

export default PremiumLoaders;
