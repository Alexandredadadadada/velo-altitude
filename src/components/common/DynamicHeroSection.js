import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import '../../design-system/styles/glassmorphism.scss';
import '../../design-system/styles/animations.scss';
import './DynamicHeroSection.css';

/**
 * Composant Hero Section dynamique premium
 * 
 * Crée une section d'en-tête immersive avec effets parallax, glassmorphism
 * et animations fluides pour une première impression spectaculaire
 */
const DynamicHeroSection = ({
  title,
  subtitle,
  backgroundImage,
  backgroundVideo,
  overlayOpacity = 0.3,
  height = '80vh',
  ctaPrimary,
  ctaSecondary,
  useParallax = true,
  enableGlassmorphism = true,
  children
}) => {
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);
  const contentRef = useRef(null);
  
  // Effet de parallax au scroll
  useEffect(() => {
    if (!useParallax) return;
    
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setScrollY(scrollPosition);
      
      // Effet de parallax sur les éléments
      if (heroRef.current && contentRef.current) {
        // Effet de déplacement différencié selon la position de scroll
        const parallaxRate = scrollPosition * 0.4;
        contentRef.current.style.transform = `translateY(${parallaxRate}px)`;
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [useParallax]);
  
  // Animation d'entrée des éléments
  useEffect(() => {
    const titleElement = document.querySelector('.hero-title');
    const subtitleElement = document.querySelector('.hero-subtitle');
    const actionElements = document.querySelectorAll('.hero-action');
    
    if (titleElement) {
      titleElement.classList.add('animate-parallax-reveal');
    }
    
    if (subtitleElement) {
      subtitleElement.classList.add('animate-parallax-reveal-delay-2');
    }
    
    actionElements.forEach((el, index) => {
      el.classList.add(`animate-parallax-reveal-delay-${index + 4}`);
    });
  }, []);

  return (
    <section 
      className="dynamic-hero-section" 
      ref={heroRef}
      style={{ height }}>
      
      {/* Arrière-plan dynamique */}
      <div className="hero-background">
        {backgroundVideo ? (
          <video 
            autoPlay 
            muted 
            loop 
            className="hero-video"
            style={{ transform: useParallax ? `translateY(${scrollY * 0.2}px)` : 'none' }}>
            <source src={backgroundVideo} type="video/mp4" />
            Votre navigateur ne supporte pas la vidéo.
          </video>
        ) : backgroundImage ? (
          <div 
            className="hero-image"
            style={{ 
              backgroundImage: `url(${backgroundImage})`,
              transform: useParallax ? `translateY(${scrollY * 0.2}px) scale(${1 + scrollY * 0.0005})` : 'none'
            }}
          />
        ) : null}
        
        {/* Overlay */}
        <div 
          className="hero-overlay"
          style={{ opacity: overlayOpacity }}
        />
      </div>
      
      {/* Contenu principal avec effet glassmorphism */}
      <div 
        className="hero-content-wrapper"
        ref={contentRef}>
        <div className={`hero-content ${enableGlassmorphism ? 'glass glass--premium' : ''}`}>
          {title && <h1 className="hero-title">{title}</h1>}
          {subtitle && <p className="hero-subtitle">{subtitle}</p>}
          
          {(ctaPrimary || ctaSecondary) && (
            <div className="hero-actions">
              {ctaPrimary && (
                <button 
                  className="hero-action button-glass button-glass--primary button-glass--rounded">
                  {ctaPrimary.text}
                </button>
              )}
              
              {ctaSecondary && (
                <button 
                  className="hero-action button-glass button-glass--rounded">
                  {ctaSecondary.text}
                </button>
              )}
            </div>
          )}
          
          {children && (
            <div className="hero-custom-content">
              {children}
            </div>
          )}
        </div>
      </div>
      
      {/* Indicateur de scroll */}
      <div className="scroll-indicator animate-bounce">
        <div className="scroll-arrow"></div>
      </div>
    </section>
  );
};

DynamicHeroSection.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  backgroundImage: PropTypes.string,
  backgroundVideo: PropTypes.string,
  overlayOpacity: PropTypes.number,
  height: PropTypes.string,
  ctaPrimary: PropTypes.shape({
    text: PropTypes.string.isRequired,
    action: PropTypes.func
  }),
  ctaSecondary: PropTypes.shape({
    text: PropTypes.string.isRequired,
    action: PropTypes.func
  }),
  useParallax: PropTypes.bool,
  enableGlassmorphism: PropTypes.bool,
  children: PropTypes.node
};

export default DynamicHeroSection;
