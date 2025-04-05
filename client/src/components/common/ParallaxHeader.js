import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import './ParallaxHeader.css';

/**
 * Composant d'en-tête avec effet de parallaxe pour les pages principales
 * Crée un effet visuel impressionnant lors du défilement
 * 
 * @param {Object} props - Propriétés du composant
 * @param {string} props.title - Titre principal à afficher
 * @param {string} props.subtitle - Sous-titre à afficher
 * @param {string} props.backgroundImage - URL de l'image de fond
 * @param {string} props.overlayColor - Couleur de superposition (format rgba)
 * @param {number} props.height - Hauteur de l'en-tête (en vh)
 * @param {React.ReactNode} props.action - Élément d'action (bouton, etc.)
 * @param {boolean} props.animated - Si l'en-tête doit être animé
 */
const ParallaxHeader = ({
  title,
  subtitle,
  backgroundImage,
  overlayColor = 'rgba(0, 0, 0, 0.4)',
  height = 60,
  action,
  animated = true
}) => {
  const { t } = useTranslation();
  const [scrollPosition, setScrollPosition] = useState(0);
  const headerRef = useRef(null);
  const titleRef = useRef(null);
  const subtitleRef = useRef(null);
  const actionRef = useRef(null);

  // Gérer le défilement pour l'effet de parallaxe
  useEffect(() => {
    const handleScroll = () => {
      const position = window.pageYOffset;
      setScrollPosition(position);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Calculer les transformations basées sur la position de défilement
  const calculateTransform = (depth) => {
    // La vitesse de parallaxe est inversement proportionnelle à la profondeur
    const parallaxSpeed = 0.5 / depth;
    return `translateY(${scrollPosition * parallaxSpeed}px)`;
  };

  // Animation d'entrée
  useEffect(() => {
    if (animated && headerRef.current) {
      // Animer l'apparition des éléments
      setTimeout(() => {
        if (titleRef.current) {
          titleRef.current.classList.add('visible');
        }
      }, 300);

      setTimeout(() => {
        if (subtitleRef.current) {
          subtitleRef.current.classList.add('visible');
        }
      }, 600);

      setTimeout(() => {
        if (actionRef.current) {
          actionRef.current.classList.add('visible');
        }
      }, 900);
    }
  }, [animated]);

  return (
    <header 
      ref={headerRef}
      className="parallax-header"
      style={{ 
        height: `${height}vh`,
        backgroundImage: `url(${backgroundImage})`,
      }}
    >
      <div 
        className="parallax-background"
        style={{ 
          transform: calculateTransform(1),
          backgroundImage: `url(${backgroundImage})`,
        }}
      />
      
      <div 
        className="parallax-overlay"
        style={{ backgroundColor: overlayColor }}
      />
      
      <div className="parallax-content">
        <h1 
          ref={titleRef}
          className={`parallax-title ${animated ? 'animated' : ''}`}
          style={{ transform: calculateTransform(2) }}
        >
          {title}
        </h1>
        
        <p 
          ref={subtitleRef}
          className={`parallax-subtitle ${animated ? 'animated' : ''}`}
          style={{ transform: calculateTransform(3) }}
        >
          {subtitle}
        </p>
        
        {action && (
          <div 
            ref={actionRef}
            className={`parallax-action ${animated ? 'animated' : ''}`}
            style={{ transform: calculateTransform(4) }}
          >
            {action}
          </div>
        )}
      </div>
      
      <div className="parallax-scroll-indicator">
        <div className="scroll-arrow"></div>
        <div className="scroll-text">{t('scrollToExplore')}</div>
      </div>
    </header>
  );
};

ParallaxHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  backgroundImage: PropTypes.string.isRequired,
  overlayColor: PropTypes.string,
  height: PropTypes.number,
  action: PropTypes.node,
  animated: PropTypes.bool
};

export default ParallaxHeader;
