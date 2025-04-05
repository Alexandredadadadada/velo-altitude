import React from 'react';
import PropTypes from 'prop-types';
import WeatherDashboard from '../weather/WeatherDashboard';

/**
 * Widget adaptateur pour la fonctionnalité météo
 * Redirige vers les composants météo existants pour maintenir la compatibilité
 */
const WeatherWidget = ({ data }) => {
  return <WeatherDashboard weatherData={data} />;
};

WeatherWidget.propTypes = {
  data: PropTypes.object
};

export default WeatherWidget;
