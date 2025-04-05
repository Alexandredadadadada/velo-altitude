import React from 'react';
import PropTypes from 'prop-types';
import MapComponent from '../cols/MapComponent';

/**
 * Adaptateur pour le composant RegionMap
 * Redirige vers le composant MapComponent existant pour maintenir la compatibilité
 * des importations dans la page d'accueil
 */
const RegionMap = (props) => {
  // Définir les coordonnées par défaut pour la région Grand Est si non spécifiées
  const defaultProps = {
    center: [48.7, 6.2], // Coordonnées approximatives de Nancy (centre du Grand Est)
    zoom: 7,
    ...props
  };
  
  return <MapComponent {...defaultProps} isRegionMap={true} />;
};

RegionMap.propTypes = {
  center: PropTypes.array,
  zoom: PropTypes.number,
  markers: PropTypes.array,
  routes: PropTypes.array
};

export default RegionMap;
