import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import './EnhancedNavigation.css';
import AnimatedTransition from './AnimatedTransition';

/**
 * Composant de navigation amélioré avec effets visuels et animations
 * Fournit une expérience utilisateur fluide et moderne
 * 
 * @param {Object} props - Propriétés du composant
 * @param {Array} props.items - Éléments de navigation
 * @param {string} props.activeItem - Élément actif
 * @param {Function} props.onItemClick - Fonction appelée au clic sur un élément
 * @param {string} props.variant - Variante de style (horizontal, vertical, tabs, pills)
 * @param {string} props.size - Taille (small, medium, large)
 * @param {boolean} props.animated - Si la navigation doit être animée
 * @param {string} props.className - Classes CSS additionnelles
 */
const EnhancedNavigation = ({
  items,
  activeItem,
  onItemClick,
  variant = 'horizontal',
  size = 'medium',
  animated = true,
  className = '',
  logo,
  userMenu,
  mobileBreakpoint = 768
}) => {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  const [isVisible, setIsVisible] = useState(false);

  // Détecter le défilement pour les effets visuels
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Détecter la largeur de la fenêtre pour le responsive
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth > mobileBreakpoint) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [mobileBreakpoint]);

  // Animation d'entrée
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Déterminer si on est en mode mobile
  const isMobile = windowWidth <= mobileBreakpoint;

  // Gérer le clic sur un élément de navigation
  const handleItemClick = (item) => {
    onItemClick(item);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  // Basculer le menu mobile
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Classes CSS dynamiques
  const navClasses = `
    enhanced-navigation 
    nav-${variant} 
    nav-${size} 
    ${isScrolled ? 'scrolled' : ''} 
    ${className}
  `;

  // Rendu du composant
  return (
    <nav className={navClasses}>
      <div className="nav-container">
        {/* Logo */}
        {logo && (
          <div className="nav-logo">
            {logo}
          </div>
        )}

        {/* Bouton de menu mobile */}
        {isMobile && (
          <button 
            className={`mobile-menu-toggle ${isMobileMenuOpen ? 'open' : ''}`}
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? t('closeMenu') : t('openMenu')}
            aria-expanded={isMobileMenuOpen}
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        )}

        {/* Menu de navigation */}
        <AnimatedTransition
          type={isMobile ? 'slide' : 'fade'}
          direction={isMobile ? 'right' : 'down'}
          isVisible={!isMobile || isMobileMenuOpen}
          duration={0.3}
        >
          <ul 
            className={`nav-items ${isMobileMenuOpen ? 'mobile-open' : ''}`}
            role="menubar"
            aria-orientation={variant === 'horizontal' ? 'horizontal' : 'vertical'}
          >
            {items.map((item, index) => (
              <li 
                key={item.id || index}
                className={`nav-item ${activeItem === item.id ? 'active' : ''}`}
                role="none"
              >
                <button
                  className="nav-link"
                  onClick={() => handleItemClick(item)}
                  role="menuitem"
                  aria-current={activeItem === item.id ? 'page' : undefined}
                >
                  {item.icon && (
                    <span className="nav-icon">{item.icon}</span>
                  )}
                  <span className="nav-text">{item.label}</span>
                  
                  {/* Indicateur d'élément actif */}
                  {animated && (
                    <span className="nav-active-indicator"></span>
                  )}
                  
                  {/* Badge (si présent) */}
                  {item.badge && (
                    <span className="nav-badge">{item.badge}</span>
                  )}
                </button>
                
                {/* Sous-menu (si présent) */}
                {item.subItems && item.subItems.length > 0 && (
                  <ul className="nav-submenu">
                    {item.subItems.map((subItem, subIndex) => (
                      <li 
                        key={subItem.id || `${index}-${subIndex}`}
                        className={`nav-subitem ${activeItem === subItem.id ? 'active' : ''}`}
                      >
                        <button
                          className="nav-sublink"
                          onClick={() => handleItemClick(subItem)}
                        >
                          {subItem.icon && (
                            <span className="nav-icon">{subItem.icon}</span>
                          )}
                          <span className="nav-text">{subItem.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </AnimatedTransition>

        {/* Menu utilisateur */}
        {userMenu && (
          <div className="nav-user-menu">
            {userMenu}
          </div>
        )}
      </div>
      
      {/* Effet de flou en arrière-plan lors du défilement */}
      {isScrolled && (
        <div className="nav-backdrop-blur"></div>
      )}
    </nav>
  );
};

EnhancedNavigation.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.node,
      badge: PropTypes.node,
      subItems: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
          icon: PropTypes.node
        })
      )
    })
  ).isRequired,
  activeItem: PropTypes.string,
  onItemClick: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['horizontal', 'vertical', 'tabs', 'pills']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  animated: PropTypes.bool,
  className: PropTypes.string,
  logo: PropTypes.node,
  userMenu: PropTypes.node,
  mobileBreakpoint: PropTypes.number
};

export default EnhancedNavigation;
