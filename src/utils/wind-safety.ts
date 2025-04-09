/**
 * Wind Safety Utilities for Velo-Altitude
 * 
 * Provides utilities for assessing wind safety for cyclists
 * Based on Beaufort scale and cycling-specific safety guidelines
 */

import { WindData } from '../services/weather/types/wind-types';

/**
 * Beaufort scale for wind speeds (adapted for cycling)
 * Provides standard wind force classifications with cycling-specific descriptions
 */
export const BEAUFORT_SCALE = [
  { force: 0, name: 'Calme', minSpeed: 0, maxSpeed: 1, description: 'Conditions idéales pour le cyclisme.' },
  { force: 1, name: 'Très légère brise', minSpeed: 1, maxSpeed: 5, description: 'Vent à peine perceptible. Excellent pour le cyclisme.' },
  { force: 2, name: 'Légère brise', minSpeed: 6, maxSpeed: 11, description: 'Vent léger. Très bon pour le cyclisme.' },
  { force: 3, name: 'Petite brise', minSpeed: 12, maxSpeed: 19, description: 'Vent notable mais confortable. Bon pour le cyclisme.' },
  { force: 4, name: 'Jolie brise', minSpeed: 20, maxSpeed: 28, description: 'Vent modéré. Commence à influencer la vitesse et l\'effort.' },
  { force: 5, name: 'Bonne brise', minSpeed: 29, maxSpeed: 38, description: 'Vent soutenu. Demande un effort supplémentaire, surtout de face.' },
  { force: 6, name: 'Vent frais', minSpeed: 39, maxSpeed: 49, description: 'Vent fort. Difficile pour le cyclisme, particulièrement sur les cols.' },
  { force: 7, name: 'Grand frais', minSpeed: 50, maxSpeed: 61, description: 'Vent très fort. Dangereux pour le cyclisme, surtout en descente.' },
  { force: 8, name: 'Coup de vent', minSpeed: 62, maxSpeed: 74, description: 'Vent violent. Très dangereux, cyclisme déconseillé.' },
  { force: 9, name: 'Fort coup de vent', minSpeed: 75, maxSpeed: 88, description: 'Vent très violent. Extrêmement dangereux, ne pas rouler.' },
  { force: 10, name: 'Tempête', minSpeed: 89, maxSpeed: 102, description: 'Conditions tempétueuses. Rester à l\'abri.' },
  { force: 11, name: 'Violente tempête', minSpeed: 103, maxSpeed: 117, description: 'Violente tempête. Danger extrême.' },
  { force: 12, name: 'Ouragan', minSpeed: 118, maxSpeed: Infinity, description: 'Force ouragan. Danger extrême.' }
];

/**
 * Wind safety thresholds for cycling
 * Different thresholds based on rider experience and terrain
 */
export const CYCLING_WIND_THRESHOLDS = {
  BEGINNER: {
    warning: 20, // km/h
    danger: 30   // km/h
  },
  INTERMEDIATE: {
    warning: 30, // km/h
    danger: 45   // km/h
  },
  ADVANCED: {
    warning: 40, // km/h
    danger: 55   // km/h
  },
  // Terrain-specific thresholds
  MOUNTAIN_DESCENT: {
    warning: 25, // km/h
    danger: 35   // km/h
  },
  MOUNTAIN_COL: {
    warning: 30, // km/h
    danger: 40   // km/h
  },
  EXPOSED_ROAD: {
    warning: 35, // km/h
    danger: 50   // km/h
  }
};

/**
 * Get Beaufort scale information for a given wind speed
 * 
 * @param speed Wind speed in km/h
 * @returns Beaufort scale information
 */
export function getBeaufortScale(speed: number) {
  return BEAUFORT_SCALE.find(
    scale => speed >= scale.minSpeed && speed <= scale.maxSpeed
  ) || BEAUFORT_SCALE[BEAUFORT_SCALE.length - 1]; // Default to highest if beyond scale
}

/**
 * Get appropriate thresholds based on rider experience and terrain
 * 
 * @param experience Rider experience level
 * @param terrain Terrain type
 * @returns Wind thresholds
 */
export function getWindThresholds(
  experience: 'beginner' | 'intermediate' | 'advanced' = 'intermediate',
  terrain: 'flat' | 'mountain_descent' | 'mountain_col' | 'exposed_road' = 'flat'
) {
  // Start with experience-based thresholds
  let thresholds = { ...CYCLING_WIND_THRESHOLDS.INTERMEDIATE };
  
  // Adjust based on experience
  if (experience === 'beginner') {
    thresholds = { ...CYCLING_WIND_THRESHOLDS.BEGINNER };
  } else if (experience === 'advanced') {
    thresholds = { ...CYCLING_WIND_THRESHOLDS.ADVANCED };
  }
  
  // Further adjust based on terrain (more restrictive)
  if (terrain === 'mountain_descent') {
    thresholds = {
      warning: Math.min(thresholds.warning, CYCLING_WIND_THRESHOLDS.MOUNTAIN_DESCENT.warning),
      danger: Math.min(thresholds.danger, CYCLING_WIND_THRESHOLDS.MOUNTAIN_DESCENT.danger)
    };
  } else if (terrain === 'mountain_col') {
    thresholds = {
      warning: Math.min(thresholds.warning, CYCLING_WIND_THRESHOLDS.MOUNTAIN_COL.warning),
      danger: Math.min(thresholds.danger, CYCLING_WIND_THRESHOLDS.MOUNTAIN_COL.danger)
    };
  } else if (terrain === 'exposed_road') {
    thresholds = {
      warning: Math.min(thresholds.warning, CYCLING_WIND_THRESHOLDS.EXPOSED_ROAD.warning),
      danger: Math.min(thresholds.danger, CYCLING_WIND_THRESHOLDS.EXPOSED_ROAD.danger)
    };
  }
  
  return thresholds;
}

/**
 * Direction names for cardinal and intercardinal directions
 */
export const WIND_DIRECTION_NAMES = {
  N: 'Nord',
  NNE: 'Nord-Nord-Est',
  NE: 'Nord-Est',
  ENE: 'Est-Nord-Est',
  E: 'Est',
  ESE: 'Est-Sud-Est',
  SE: 'Sud-Est',
  SSE: 'Sud-Sud-Est',
  S: 'Sud',
  SSO: 'Sud-Sud-Ouest',
  SO: 'Sud-Ouest',
  OSO: 'Ouest-Sud-Ouest',
  O: 'Ouest',
  ONO: 'Ouest-Nord-Ouest',
  NO: 'Nord-Ouest',
  NNO: 'Nord-Nord-Ouest'
};

/**
 * Get named direction from degrees
 * 
 * @param degrees Wind direction in degrees
 * @returns Direction name
 */
export function getDirectionName(degrees: number) {
  // Normalize degrees to be between 0 and 360
  const normalizedDegrees = ((degrees % 360) + 360) % 360;
  
  // Convert to 16-point compass
  const val = Math.floor((normalizedDegrees / 22.5) + 0.5) % 16;
  
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'
  ];
  
  return WIND_DIRECTION_NAMES[directions[val]];
}

/**
 * Calculate wind chill temperature
 * 
 * @param tempC Temperature in Celsius
 * @param windSpeedKmh Wind speed in km/h
 * @returns Wind chill temperature in Celsius
 */
export function calculateWindChill(tempC: number, windSpeedKmh: number) {
  // Wind chill is only defined for temperatures at or below 10°C and wind speeds above 4.8 km/h
  if (tempC > 10 || windSpeedKmh < 4.8) {
    return tempC;
  }
  
  // Use Environment Canada's wind chill formula
  return 13.12 + 0.6215 * tempC - 11.37 * Math.pow(windSpeedKmh, 0.16) + 0.3965 * tempC * Math.pow(windSpeedKmh, 0.16);
}

/**
 * Calculate if cycling is safe based on wind conditions
 * 
 * @param windData Wind data object
 * @param experience Rider experience level
 * @param terrain Terrain type
 * @returns Safety assessment
 */
export function assessWindSafety(
  windData: WindData,
  experience: 'beginner' | 'intermediate' | 'advanced' = 'intermediate',
  terrain: 'flat' | 'mountain_descent' | 'mountain_col' | 'exposed_road' = 'flat'
) {
  const thresholds = getWindThresholds(experience, terrain);
  const beaufortInfo = getBeaufortScale(windData.speed);
  
  // Check if gusts are significantly higher than sustained wind
  const gustDifference = windData.gust - windData.speed;
  const gustFactor = gustDifference > 15;
  
  // Determine safety level
  let safetyLevel: 'safe' | 'caution' | 'warning' | 'danger' = 'safe';
  let recommendation = '';
  
  if (windData.speed >= thresholds.danger || windData.gust >= thresholds.danger + 10) {
    safetyLevel = 'danger';
    recommendation = `Conditions de vent dangereuses (${beaufortInfo.name}). Il est fortement déconseillé de rouler aujourd'hui.`;
  } else if (windData.speed >= thresholds.warning || windData.gust >= thresholds.warning + 10) {
    safetyLevel = 'warning';
    recommendation = `Vent fort (${beaufortInfo.name}). Soyez vigilant, particulièrement ${terrain === 'mountain_descent' ? 'en descente' : terrain === 'mountain_col' ? 'sur les cols' : 'dans les zones exposées'}.`;
  } else if (windData.speed >= thresholds.warning * 0.7) {
    safetyLevel = 'caution';
    recommendation = `Vent modéré (${beaufortInfo.name}). ${beaufortInfo.description}`;
  } else {
    recommendation = `Conditions de vent favorables (${beaufortInfo.name}). ${beaufortInfo.description}`;
  }
  
  // Add gust warning if needed
  if (gustFactor && safetyLevel !== 'danger') {
    recommendation += ' Attention aux rafales qui peuvent être imprévisibles.';
  }
  
  // Add direction information
  const directionName = getDirectionName(windData.direction);
  recommendation += ` Le vent vient du ${directionName} (${windData.direction}°).`;
  
  return {
    safetyLevel,
    recommendation,
    beaufort: beaufortInfo,
    speed: windData.speed,
    gust: windData.gust,
    direction: windData.direction,
    directionName
  };
}

/**
 * Get appropriate icon for wind safety level
 * 
 * @param safetyLevel Wind safety level
 * @returns Icon name (for MUI icons)
 */
export function getWindSafetyIcon(safetyLevel: 'safe' | 'caution' | 'warning' | 'danger') {
  switch (safetyLevel) {
    case 'danger':
      return 'Dangerous';
    case 'warning':
      return 'Warning';
    case 'caution':
      return 'Air';
    case 'safe':
    default:
      return 'CheckCircle';
  }
}

/**
 * Get appropriate color for wind safety level
 * 
 * @param safetyLevel Wind safety level
 * @returns Color name (for MUI theme)
 */
export function getWindSafetyColor(safetyLevel: 'safe' | 'caution' | 'warning' | 'danger') {
  switch (safetyLevel) {
    case 'danger':
      return 'error';
    case 'warning':
      return 'warning';
    case 'caution':
      return 'info';
    case 'safe':
    default:
      return 'success';
  }
}
