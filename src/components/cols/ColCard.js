import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  MdStar, MdStarBorder, MdLocationOn, 
  MdOutlineDirectionsBike, MdTerrain, MdSpeed,
  MdArrowForward, MdWbSunny, MdCloud, MdWaterDrop
} from 'react-icons/md';
import './ColCard.css';

/**
 * Carte de col pour l'explorateur
 * Affiche les informations détaillées d'un col avec les données météo en temps réel
 * 
 * @component
 * @param {Object} props - Les propriétés du composant
 * @param {Object} props.col - Les données du col
 * @param {Function} props.onToggleFavorite - Fonction pour basculer l'état favori
 */
export const ColCard = ({ col, onToggleFavorite }) => {
  // Obtenir l'icône météo en fonction des conditions
  const getWeatherIcon = (conditions) => {
    if (!conditions) return <MdWbSunny />;
    
    const condition = conditions.toLowerCase();
    if (condition.includes('ensoleillé')) return <MdWbSunny />;
    if (condition.includes('nuageux')) return <MdCloud />;
    if (condition.includes('pluie') || condition.includes('pluvieux')) return <MdWaterDrop />;
    
    return <MdWbSunny />;
  };
  
  // Calculer la couleur de pente (gradient) en fonction de la valeur
  const getGradientColor = (gradient) => {
    if (gradient < 6) return 'easy';
    if (gradient < 9) return 'moderate';
    if (gradient < 12) return 'hard';
    return 'extreme';
  };
  
  // Formater l'élévation pour l'affichage
  const formatElevation = (elevation) => {
    return new Intl.NumberFormat('fr-FR').format(elevation) + 'm';
  };
  
  // Animation pour le hover de la carte
  const cardHoverVariants = {
    rest: { scale: 1, y: 0 },
    hover: { scale: 1.02, y: -5 }
  };
  
  // Animation pour le badge "Gravi"
  const completedBadgeVariants = {
    rest: { scale: 0.9, opacity: 0.7 },
    hover: { scale: 1, opacity: 1 }
  };
  
  // Animation pour l'étoile des favoris
  const favoriteStarVariants = {
    rest: { scale: 1, rotate: 0 },
    hover: { scale: 1.2, rotate: 5 }
  };
  
  return (
    <motion.div 
      className="col-card glass"
      variants={cardHoverVariants}
      initial="rest"
      whileHover="hover"
      transition={{ duration: 0.3 }}
    >
      <div className="col-card-image-container">
        <img src={col.image} alt={col.name} className="col-card-image" />
        
        <motion.button 
          className="col-favorite-button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite(col.id);
          }}
          variants={favoriteStarVariants}
          transition={{ duration: 0.2 }}
        >
          {col.favorite ? <MdStar className="col-favorite-icon active" /> : <MdStarBorder className="col-favorite-icon" />}
        </motion.button>
        
        {col.completed && (
          <motion.div 
            className="col-completed-badge"
            variants={completedBadgeVariants}
            transition={{ duration: 0.2 }}
          >
            <MdOutlineDirectionsBike />
            <span>Gravi</span>
          </motion.div>
        )}
        
        <div className="col-card-region">
          <MdLocationOn />
          <span>{col.region}</span>
        </div>
      </div>
      
      <div className="col-card-content">
        <h3 className="col-card-title">{col.name}</h3>
        
        <div className="col-card-stats">
          <div className="col-stat">
            <MdTerrain className="col-stat-icon" />
            <span className="col-stat-value">{formatElevation(col.elevation)}</span>
            <span className="col-stat-label">Altitude</span>
          </div>
          
          <div className="col-stat">
            <MdOutlineDirectionsBike className="col-stat-icon" />
            <span className="col-stat-value">{col.distance}km</span>
            <span className="col-stat-label">Distance</span>
          </div>
          
          <div className="col-stat">
            <MdSpeed className="col-stat-icon" />
            <span className={`col-stat-value gradient-${getGradientColor(col.gradient)}`}>
              {col.gradient}%
            </span>
            <span className="col-stat-label">Pente</span>
          </div>
        </div>
        
        <div className="col-difficulty">
          <span className="col-difficulty-label">Difficulté:</span>
          <div className="col-difficulty-dots">
            {Array(5).fill().map((_, i) => (
              <span 
                key={i} 
                className={`col-difficulty-dot ${i < col.difficulty ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>
        
        <div className="col-card-weather">
          <div className="col-current-weather">
            <div className="col-weather-icon">
              {getWeatherIcon(col.weather?.current?.conditions)}
            </div>
            <div className="col-weather-temp">
              {col.weather?.current?.temp}°C
            </div>
            <div className="col-weather-conditions">
              {col.weather?.current?.conditions}
            </div>
          </div>
          
          <div className="col-weather-forecast">
            {col.weather?.forecast?.slice(0, 3).map((day, index) => (
              <div key={index} className="col-forecast-day">
                <div className="col-forecast-day-name">{day.day}</div>
                <div className="col-forecast-icon">{getWeatherIcon(day.conditions)}</div>
                <div className="col-forecast-temp">{day.temp}°C</div>
              </div>
            ))}
          </div>
        </div>
        
        <Link to={`/cols/${col.id}`} className="col-card-link">
          <span>Voir détails</span>
          <MdArrowForward />
        </Link>
      </div>
    </motion.div>
  );
};
