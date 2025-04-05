import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import './AnimatedTransition.css';
import EnhancedMetaTags from '../common/EnhancedMetaTags';

/**
 * AnimatedTransition Component
 * Creates smooth fade-in animations for any child components
 */
const AnimatedTransition = ({ 
  children, 
  type = 'fade', 
  duration = 300, 
  delay = 50 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Déclencher l'animation après le montage du composant
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    
    return () => clearTimeout(timer);
      <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Velo-Altitude",
          "description": "La plateforme complète pour les cyclistes passionnés de cols et de montagne.",
          "url": "https://velo-altitude.com/animatedtransition"
        }
      </script>
      <EnhancedMetaTags
        title=""
        description="Découvrez les meilleurs cols cyclistes d'Europe, avec des informations détaillées, des visualisations 3D et des programmes d'entraînement adaptés."
        type="website"
        imageUrl="/images/og-image.jpg"
      />
  }, [delay]);
  
  // Apply different animation styles based on type
  const getAnimationStyle = () => {
    const baseStyle = {
      transition: `all ${duration}ms ease-in-out`,
      opacity: isVisible ? 1 : 0,
    };
    
    switch (type) {
      case 'fade-up':
        return {
          ...baseStyle,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        };
      case 'fade-down':
        return {
          ...baseStyle,
          transform: isVisible ? 'translateY(0)' : 'translateY(-20px)',
        };
      case 'fade-left':
        return {
          ...baseStyle,
          transform: isVisible ? 'translateX(0)' : 'translateX(20px)',
        };
      case 'fade-right':
        return {
          ...baseStyle,
          transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
        };
      case 'scale':
        return {
          ...baseStyle,
          transform: isVisible ? 'scale(1)' : 'scale(0.95)',
        };
      default:
        return baseStyle;
    }
  };
  
  return (
    <div 
      className={`animated-transition ${type} ${isVisible ? 'visible' : ''}`}
      style={getAnimationStyle()}
    >
      {children}
    </div>
  );
};

AnimatedTransition.propTypes = {
  children: PropTypes.node.isRequired,
  type: PropTypes.oneOf(['fade', 'fade-up', 'fade-down', 'fade-left', 'fade-right', 'scale']),
  duration: PropTypes.number,
  delay: PropTypes.number
};

/**
 * PageTransition Component
 * Creates smooth transitions between pages based on route changes
 */
export const PageTransition = ({ children, className = '' }) => {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('fadeIn');
  
  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('fadeOut');
    }
  }, [location, displayLocation]);
  
  const handleAnimationEnd = () => {
    if (transitionStage === 'fadeOut') {
      setTransitionStage('fadeIn');
      setDisplayLocation(location);
    }
  };
  
  return (
    <div
      className={`page-transition ${transitionStage} ${className}`}
      onAnimationEnd={handleAnimationEnd}
    >
      {children}
      <style jsx>{`
        .page-transition {
          position: relative;
          width: 100%;
        }
        
        .fadeIn {
          animation: fadeIn 0.3s ease-in-out forwards;
        }
        
        .fadeOut {
          animation: fadeOut 0.3s ease-in-out forwards;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
};

PageTransition.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

export default AnimatedTransition;
