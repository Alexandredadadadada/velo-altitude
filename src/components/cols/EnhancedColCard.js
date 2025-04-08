import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../../design-system/styles/glassmorphism.scss';
import '../../design-system/styles/animations.scss';
import './EnhancedColCard.css';

/**
 * Carte Col Premium avec effets visuels avancés
 * 
 * Affiche un col avec effet de profondeur, glassmorphism, et interactions
 * dynamiques pour créer une expérience visuelle immersive
 */
const EnhancedColCard = ({
  col,
  index = 0,
  showWeather = true,
  showDifficulty = true,
  enableDepthEffect = true,
  enableHoverEffects = true,
  weatherService,
  aspectRatio = '16/9',
  className = '',
  onClick
}) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);
  
  // Données du col avec valeurs par défaut pour éviter les erreurs
  const {
    id,
    name = 'Col sans nom',
    altitude = 0,
    image = '',
    difficulty = 'Facile',
    gradient = 0,
    length = 0,
    region = '',
    slug = '',
  } = col || {};
  
  // Formatage de l'URL de détail du col
  const colDetailUrl = slug 
    ? `/cols/${slug}` 
    : `/cols/${id}`;
  
  // Effet pour charger les données météo
  useEffect(() => {
    const fetchWeatherData = async () => {
      if (!showWeather || !weatherService || !id) return;
      
      try {
        setLoading(true);
        const data = await weatherService.getColWeather(id);
        setWeather(data);
      } catch (error) {
        console.error(`Erreur lors du chargement de la météo pour ${name}:`, error);
        // Données mockées en cas d'échec
        setWeather({
          temperature: Math.floor(15 + Math.random() * 10),
          condition: 'Ensoleillé',
          icon: '☀️'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchWeatherData();
  }, [id, name, showWeather, weatherService]);
  
  // Gestion de l'effet 3D au survol
  const handleMouseMove = (e) => {
    if (!enableHoverEffects || !cardRef.current) return;
    
    const { left, top, width, height } = cardRef.current.getBoundingClientRect();
    
    // Calculer la position relative de la souris
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;
    
    setMousePosition({ x, y });
  };
  
  const handleMouseLeave = () => {
    setMousePosition({ x: 0.5, y: 0.5 });
  };
  
  // Calculer l'angle de rotation basé sur la position de la souris
  const rotateX = enableHoverEffects ? (mousePosition.y - 0.5) * 10 : 0;
  const rotateY = enableHoverEffects ? (mousePosition.x - 0.5) * -10 : 0;
  
  // Déterminer la classe de difficulté
  const getDifficultyClass = () => {
    if (!difficulty) return 'difficulty--na';
    
    const difficultyLower = difficulty.toLowerCase();
    if (difficultyLower.includes('facile')) return 'difficulty--easy';
    if (difficultyLower.includes('moyen')) return 'difficulty--medium';
    if (difficultyLower.includes('difficile')) return 'difficulty--hard';
    if (difficultyLower.includes('très difficile') || difficultyLower.includes('extrême')) 
      return 'difficulty--extreme';
    
    return 'difficulty--medium';
  };
  
  // Animation d'entrée
  const cardVariants = {
    hidden: { 
      opacity: 0,
      y: 50,
      scale: 0.95
    },
    visible: { 
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { 
        type: "spring",
        stiffness: 100,
        damping: 15,
        delay: index * 0.1,
        duration: 0.5
      }
    }
  };

  return (
    <motion.div
      ref={cardRef}
      className={`enhanced-col-card ${className} ${enableDepthEffect ? 'depth-effect' : ''}`}
      style={{ aspectRatio }}
      initial="hidden"
      animate="visible"
      variants={cardVariants}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={enableHoverEffects ? { scale: 1.02, transition: { duration: 0.3 } } : {}}
      onClick={onClick}
    >
      <Link to={colDetailUrl} className="enhanced-col-card__link">
        <div 
          className="enhanced-col-card__inner card-glass card-glass--animated"
          style={{ 
            transform: enableHoverEffects ? `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)` : 'none'
          }}
        >
          {/* Image d'arrière-plan */}
          <div className="enhanced-col-card__image-container">
            {image ? (
              <img 
                src={image} 
                alt={name} 
                className="enhanced-col-card__image"
                loading="lazy"
              />
            ) : (
              <div className="enhanced-col-card__image-placeholder">
                <span>🏔️</span>
              </div>
            )}
            <div className="enhanced-col-card__gradient-overlay"></div>
          </div>
          
          {/* Informations du col */}
          <div className="enhanced-col-card__content">
            <div className="enhanced-col-card__header">
              <h3 className="enhanced-col-card__name">{name}</h3>
              <div className="enhanced-col-card__altitude">{altitude} m</div>
            </div>
            
            <div className="enhanced-col-card__details">
              {/* Indicateur de difficulté */}
              {showDifficulty && difficulty && (
                <div className={`enhanced-col-card__difficulty ${getDifficultyClass()}`}>
                  {difficulty}
                </div>
              )}
              
              {/* Localisation */}
              {region && (
                <div className="enhanced-col-card__location">
                  <span className="enhanced-col-card__location-icon">📍</span>
                  {region}
                </div>
              )}
              
              {/* Météo */}
              {showWeather && (
                <div className="enhanced-col-card__weather">
                  {loading ? (
                    <div className="enhanced-col-card__weather-loading">
                      <span className="loading-spinner"></span>
                    </div>
                  ) : weather ? (
                    <>
                      <span className="enhanced-col-card__weather-icon">{weather.icon}</span>
                      <span className="enhanced-col-card__weather-temp">{weather.temperature}°C</span>
                    </>
                  ) : null}
                </div>
              )}
            </div>
            
            {/* Statistiques */}
            <div className="enhanced-col-card__stats">
              <div className="enhanced-col-card__stat">
                <span className="enhanced-col-card__stat-label">Longueur</span>
                <span className="enhanced-col-card__stat-value">{length} km</span>
              </div>
              <div className="enhanced-col-card__stat">
                <span className="enhanced-col-card__stat-label">Pente</span>
                <span className="enhanced-col-card__stat-value">{gradient}%</span>
              </div>
            </div>
          </div>
          
          {/* Badge "Découvrir" */}
          <div className="enhanced-col-card__discover-badge">
            Découvrir
            <span className="enhanced-col-card__discover-arrow">→</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

EnhancedColCard.propTypes = {
  col: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    altitude: PropTypes.number,
    image: PropTypes.string,
    difficulty: PropTypes.string,
    gradient: PropTypes.number,
    length: PropTypes.number,
    region: PropTypes.string,
    slug: PropTypes.string
  }).isRequired,
  index: PropTypes.number,
  showWeather: PropTypes.bool,
  showDifficulty: PropTypes.bool,
  enableDepthEffect: PropTypes.bool,
  enableHoverEffects: PropTypes.bool,
  weatherService: PropTypes.object,
  aspectRatio: PropTypes.string,
  className: PropTypes.string,
  onClick: PropTypes.func
};

export default EnhancedColCard;
