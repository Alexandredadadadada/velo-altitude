import React from 'react';
import PropTypes from 'prop-types';
import TrainingStats from '../training/TrainingStats';

/**
 * Adaptateur pour le composant StatsSummary
 * Redirige vers le composant TrainingStats existant pour maintenir la compatibilité
 * des importations dans la page d'accueil
 */
const StatsSummary = (props) => {
  return <TrainingStats {...props} isHomePage={true} />;
};

StatsSummary.propTypes = {
  data: PropTypes.object
};

export default StatsSummary;
