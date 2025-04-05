import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import './VisualEffectsProvider.css';

/**
 * Composant fournisseur d'effets visuels pour améliorer l'expérience utilisateur globale
 * Ajoute des effets de parallaxe, de curseur personnalisé, et d'autres effets visuels
 * 
 * @param {Object} props - Propriétés du composant
 * @param {React.ReactNode} props.children - Contenu à envelopper
 * @param {boolean} props.enableParallax - Activer les effets de parallaxe
 * @param {boolean} props.enableCustomCursor - Activer le curseur personnalisé
 * @param {boolean} props.enableScrollIndicator - Activer l'indicateur de défilement
 * @param {string} props.theme - Thème visuel (light, dark, colorful)
 */
const VisualEffectsProvider = ({
  children,
  enableParallax = true,
  enableCustomCursor = true,
  enableScrollIndicator = true,
  theme = 'light'
}) => {
  const { t } = useTranslation();
  const [scrollPosition, setScrollPosition] = useState(0);
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [cursorType, setCursorType] = useState('default');
  const [isLoaded, setIsLoaded] = useState(false);

  // Gérer le défilement pour les effets visuels
  useEffect(() => {
    const handleScroll = () => {
      const position = window.pageYOffset;
      setScrollPosition(position);
      
      // Calculer le pourcentage de défilement
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const percentage = (position / height) * 100;
      setScrollPercentage(percentage);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Gérer la position de la souris pour le curseur personnalisé
  useEffect(() => {
    if (!enableCustomCursor) return;

    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [enableCustomCursor]);

  // Détecter les éléments interactifs pour changer le curseur
  useEffect(() => {
    if (!enableCustomCursor) return;

    const handleMouseOver = (e) => {
      // Détecter le type d'élément
      const target = e.target;
      
      if (target.tagName === 'A' || target.tagName === 'BUTTON' || 
          target.role === 'button' || target.classList.contains('interactive')) {
        setCursorType('pointer');
      } else if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setCursorType('text');
      } else {
        setCursorType('default');
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    
    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
    };
  }, [enableCustomCursor]);

  // Animation d'entrée
  useEffect(() => {
    // Simuler un chargement
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Appliquer les effets de parallaxe aux éléments
  useEffect(() => {
    if (!enableParallax) return;

    const parallaxElements = document.querySelectorAll('.parallax-element');
    
    const applyParallax = () => {
      parallaxElements.forEach(element => {
        const speed = element.getAttribute('data-parallax-speed') || 0.2;
        const direction = element.getAttribute('data-parallax-direction') || 'vertical';
        
        if (direction === 'vertical') {
          element.style.transform = `translateY(${scrollPosition * speed}px)`;
        } else {
          element.style.transform = `translateX(${scrollPosition * speed}px)`;
        }
      });
    };

    // Appliquer immédiatement et à chaque défilement
    applyParallax();
    window.addEventListener('scroll', applyParallax, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', applyParallax);
    };
  }, [enableParallax, scrollPosition]);

  return (
    <div className={`visual-effects-provider theme-${theme} ${isLoaded ? 'loaded' : 'loading'}`}>
      {/* Écran de chargement */}
      <div className={`loading-screen ${isLoaded ? 'hidden' : ''}`}>
        <div className="loading-spinner"></div>
        <div className="loading-text">{t('loading')}</div>
      </div>
      
      {/* Contenu principal */}
      <div className="visual-effects-content">
        {children}
      </div>
      
      {/* Curseur personnalisé */}
      {enableCustomCursor && (
        <div 
          className={`custom-cursor cursor-${cursorType}`}
          style={{
            left: `${mousePosition.x}px`,
            top: `${mousePosition.y}px`
          }}
        >
          <div className="cursor-dot"></div>
          <div className="cursor-ring"></div>
        </div>
      )}
      
      {/* Indicateur de défilement */}
      {enableScrollIndicator && (
        <div className="scroll-indicator">
          <div 
            className="scroll-progress"
            style={{ width: `${scrollPercentage}%` }}
          ></div>
        </div>
      )}
      
      {/* Effet de grain */}
      <div className="grain-effect"></div>
      
      {/* Effet de vignette */}
      <div className="vignette-effect"></div>
    </div>
  );
};

VisualEffectsProvider.propTypes = {
  children: PropTypes.node.isRequired,
  enableParallax: PropTypes.bool,
  enableCustomCursor: PropTypes.bool,
  enableScrollIndicator: PropTypes.bool,
  theme: PropTypes.oneOf(['light', 'dark', 'colorful'])
};

export default VisualEffectsProvider;
