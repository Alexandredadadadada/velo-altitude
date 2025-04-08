import React from 'react';
import { motion } from 'framer-motion';
import { 
  MdFilterAlt, MdClose, MdOutlineDirectionsBike, 
  MdTerrain, MdSpeed, MdLocationOn, MdCheck,
  MdStar, MdRefresh, MdDone
} from 'react-icons/md';
import './ColFilterPanel.css';

/**
 * Panneau de filtres pour l'explorateur de cols
 * Interface premium avec contrôles intuitifs et animations fluides
 * 
 * @component
 * @param {Object} props - Les propriétés du composant
 * @param {Object} props.activeFilters - L'état actuel des filtres
 * @param {Function} props.onFilterChange - Fonction pour mettre à jour les filtres
 * @param {Function} props.onReset - Fonction pour réinitialiser tous les filtres
 * @param {Array} props.regions - Liste des régions disponibles
 */
export const ColFilterPanel = ({ activeFilters, onFilterChange, onReset, regions }) => {
  // Gérer les changements de difficulté
  const handleDifficultyChange = (level) => {
    const newDifficulty = [...activeFilters.difficulty];
    
    if (newDifficulty.includes(level)) {
      // Retirer la difficulté si elle est déjà sélectionnée
      const index = newDifficulty.indexOf(level);
      newDifficulty.splice(index, 1);
    } else {
      // Ajouter la difficulté
      newDifficulty.push(level);
    }
    
    onFilterChange('difficulty', newDifficulty);
  };
  
  // Gérer les changements de région
  const handleRegionChange = (region) => {
    const newRegions = [...activeFilters.regions];
    
    if (newRegions.includes(region)) {
      // Retirer la région si elle est déjà sélectionnée
      const index = newRegions.indexOf(region);
      newRegions.splice(index, 1);
    } else {
      // Ajouter la région
      newRegions.push(region);
    }
    
    onFilterChange('regions', newRegions);
  };
  
  // Gérer les changements dans les sliders
  const handleRangeChange = (filter, value) => {
    onFilterChange(filter, value);
  };
  
  // Formater la valeur d'élévation pour l'affichage
  const formatElevation = (value) => `${value}m`;
  
  // Formater la valeur de distance pour l'affichage
  const formatDistance = (value) => `${value}km`;
  
  // Formater la valeur de pente pour l'affichage
  const formatGradient = (value) => `${value}%`;
  
  return (
    <div className="col-filter-panel glass">
      <div className="col-filter-header">
        <div className="col-filter-title">
          <MdFilterAlt />
          <h3>Filtres</h3>
        </div>
        <div className="col-filter-actions">
          <button className="col-filter-reset-button" onClick={onReset}>
            <MdRefresh />
            <span>Réinitialiser</span>
          </button>
        </div>
      </div>
      
      <div className="col-filter-content">
        <div className="col-filter-section">
          <div className="col-filter-section-header">
            <h4>
              <MdTerrain />
              <span>Difficulté</span>
            </h4>
          </div>
          <div className="col-difficulty-filter">
            {[1, 2, 3, 4, 5].map(level => (
              <button
                key={level}
                className={`col-difficulty-button ${activeFilters.difficulty.includes(level) ? 'active' : ''}`}
                onClick={() => handleDifficultyChange(level)}
                aria-pressed={activeFilters.difficulty.includes(level)}
              >
                {Array(level).fill().map((_, i) => (
                  <span key={i} className="col-difficulty-dot"></span>
                ))}
                <span className="col-difficulty-label">{level}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="col-filter-section">
          <div className="col-filter-section-header">
            <h4>
              <MdOutlineDirectionsBike />
              <span>Parcours</span>
            </h4>
          </div>
          
          <div className="col-range-filter">
            <label>
              <span className="col-range-label">Altitude</span>
              <span className="col-range-value">
                {formatElevation(activeFilters.elevation[0])} - {formatElevation(activeFilters.elevation[1])}
              </span>
            </label>
            <div className="col-range-inputs">
              <input
                type="range"
                min={0}
                max={3000}
                step={100}
                value={activeFilters.elevation[0]}
                onChange={(e) => handleRangeChange('elevation', [
                  parseInt(e.target.value), 
                  activeFilters.elevation[1]
                ])}
                className="col-range-input col-range-input-min"
              />
              <input
                type="range"
                min={0}
                max={3000}
                step={100}
                value={activeFilters.elevation[1]}
                onChange={(e) => handleRangeChange('elevation', [
                  activeFilters.elevation[0], 
                  parseInt(e.target.value)
                ])}
                className="col-range-input col-range-input-max"
              />
            </div>
          </div>
          
          <div className="col-range-filter">
            <label>
              <span className="col-range-label">Distance</span>
              <span className="col-range-value">
                {formatDistance(activeFilters.distance[0])} - {formatDistance(activeFilters.distance[1])}
              </span>
            </label>
            <div className="col-range-inputs">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={activeFilters.distance[0]}
                onChange={(e) => handleRangeChange('distance', [
                  parseInt(e.target.value), 
                  activeFilters.distance[1]
                ])}
                className="col-range-input col-range-input-min"
              />
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={activeFilters.distance[1]}
                onChange={(e) => handleRangeChange('distance', [
                  activeFilters.distance[0], 
                  parseInt(e.target.value)
                ])}
                className="col-range-input col-range-input-max"
              />
            </div>
          </div>
          
          <div className="col-range-filter">
            <label>
              <span className="col-range-label">Pente moyenne</span>
              <span className="col-range-value">
                {formatGradient(activeFilters.gradient[0])} - {formatGradient(activeFilters.gradient[1])}
              </span>
            </label>
            <div className="col-range-inputs">
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={activeFilters.gradient[0]}
                onChange={(e) => handleRangeChange('gradient', [
                  parseInt(e.target.value), 
                  activeFilters.gradient[1]
                ])}
                className="col-range-input col-range-input-min"
              />
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={activeFilters.gradient[1]}
                onChange={(e) => handleRangeChange('gradient', [
                  activeFilters.gradient[0], 
                  parseInt(e.target.value)
                ])}
                className="col-range-input col-range-input-max"
              />
            </div>
          </div>
        </div>
        
        <div className="col-filter-section">
          <div className="col-filter-section-header">
            <h4>
              <MdLocationOn />
              <span>Régions</span>
            </h4>
          </div>
          <div className="col-region-filter">
            {regions.map(region => (
              <button
                key={region}
                className={`col-region-button ${activeFilters.regions.includes(region) ? 'active' : ''}`}
                onClick={() => handleRegionChange(region)}
                aria-pressed={activeFilters.regions.includes(region)}
              >
                {region}
                {activeFilters.regions.includes(region) && (
                  <span className="col-region-check">
                    <MdCheck />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        
        <div className="col-filter-section">
          <div className="col-filter-section-header">
            <h4>
              <MdDone />
              <span>Statut</span>
            </h4>
          </div>
          <div className="col-status-filter">
            <button
              className={`col-status-button ${activeFilters.completed === true ? 'active' : ''}`}
              onClick={() => onFilterChange('completed', activeFilters.completed === true ? null : true)}
              aria-pressed={activeFilters.completed === true}
            >
              <MdDone />
              <span>Cols gravis</span>
            </button>
            <button
              className={`col-status-button ${activeFilters.completed === false ? 'active' : ''}`}
              onClick={() => onFilterChange('completed', activeFilters.completed === false ? null : false)}
              aria-pressed={activeFilters.completed === false}
            >
              <MdOutlineDirectionsBike />
              <span>À découvrir</span>
            </button>
            <button
              className={`col-status-button ${activeFilters.favorite ? 'active' : ''}`}
              onClick={() => onFilterChange('favorite', !activeFilters.favorite)}
              aria-pressed={activeFilters.favorite}
            >
              <MdStar />
              <span>Favoris</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
