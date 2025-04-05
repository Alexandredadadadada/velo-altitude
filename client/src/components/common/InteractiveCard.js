import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import './InteractiveCard.css';

/**
 * Composant de carte interactive avec effets visuels avancés
 * Utilisé pour afficher des informations de manière élégante et interactive
 * 
 * @param {Object} props - Propriétés du composant
 * @param {string} props.title - Titre de la carte
 * @param {string} props.subtitle - Sous-titre de la carte
 * @param {string} props.image - URL de l'image
 * @param {string} props.imageAlt - Texte alternatif pour l'image
 * @param {React.ReactNode} props.children - Contenu de la carte
 * @param {Function} props.onClick - Fonction appelée au clic sur la carte
 * @param {string} props.variant - Variante de style (default, elevated, outlined)
 * @param {boolean} props.interactive - Si la carte doit réagir au survol/clic
 * @param {string} props.size - Taille de la carte (small, medium, large)
 * @param {string} props.className - Classes CSS additionnelles
 */
const InteractiveCard = ({
  title,
  subtitle,
  image,
  imageAlt,
  children,
  onClick,
  variant = 'default',
  interactive = true,
  size = 'medium',
  className = '',
  badge,
  footer
}) => {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Observer pour l'animation d'entrée
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    const currentElement = document.getElementById(`card-${title?.replace(/\s+/g, '-').toLowerCase() || Math.random().toString(36).substring(7)}`);
    
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [title]);

  // Gestion de l'effet 3D au survol
  const handleMouseMove = (e) => {
    if (!interactive) return;
    
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePosition({ x, y });
  };

  // Calculer la rotation 3D basée sur la position de la souris
  const calculateTransform = () => {
    if (!isHovered || !interactive) return '';
    
    const cardWidth = 300; // Largeur approximative
    const cardHeight = 400; // Hauteur approximative
    
    const rotateY = ((mousePosition.x / cardWidth) - 0.5) * 10; // -5 à 5 degrés
    const rotateX = ((mousePosition.y / cardHeight) - 0.5) * -10; // 5 à -5 degrés
    
    return `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  // Calculer l'effet de lumière basé sur la position de la souris
  const calculateLighting = () => {
    if (!isHovered || !interactive) return {};
    
    const cardWidth = 300; // Largeur approximative
    const cardHeight = 400; // Hauteur approximative
    
    const x = (mousePosition.x / cardWidth) * 100;
    const y = (mousePosition.y / cardHeight) * 100;
    
    return {
      background: `radial-gradient(circle at ${x}% ${y}%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 50%)`
    };
  };

  // ID unique pour la carte
  const cardId = `card-${title?.replace(/\s+/g, '-').toLowerCase() || Math.random().toString(36).substring(7)}`;

  return (
    <div
      id={cardId}
      className={`interactive-card ${variant} ${size} ${isVisible ? 'visible' : ''} ${interactive ? 'interactive' : ''} ${className}`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
      style={{
        transform: calculateTransform()
      }}
    >
      <div className="card-lighting" style={calculateLighting()} />
      
      {badge && (
        <div className="card-badge">
          {badge}
        </div>
      )}
      
      {image && (
        <div className="card-image-container">
          <img 
            src={image} 
            alt={imageAlt || title} 
            className="card-image"
          />
          <div className="card-image-overlay" />
        </div>
      )}
      
      <div className="card-content">
        {title && (
          <h3 className="card-title">{title}</h3>
        )}
        
        {subtitle && (
          <h4 className="card-subtitle">{subtitle}</h4>
        )}
        
        <div className="card-body">
          {children}
        </div>
      </div>
      
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
      
      {interactive && onClick && (
        <div className="card-action-hint">
          {t('clickToView')}
        </div>
      )}
    </div>
  );
};

InteractiveCard.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  image: PropTypes.string,
  imageAlt: PropTypes.string,
  children: PropTypes.node,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(['default', 'elevated', 'outlined']),
  interactive: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  className: PropTypes.string,
  badge: PropTypes.node,
  footer: PropTypes.node
};

export default InteractiveCard;
