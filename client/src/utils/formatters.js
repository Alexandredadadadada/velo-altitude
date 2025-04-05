/**
 * Utilitaires de formatage pour l'application
 */

/**
 * Formate une distance en km avec l'unité appropriée
 * @param {number} distance - Distance en kilomètres
 * @param {boolean} [includeUnit=true] - Inclure l'unité dans le résultat
 * @returns {string} - Distance formatée
 */
export const formatDistance = (distance, includeUnit = true) => {
  if (distance === undefined || distance === null) return '-';
  
  if (distance < 1) {
    // Convertir en mètres pour les petites distances
    return `${Math.round(distance * 1000)}${includeUnit ? ' m' : ''}`;
  } else if (distance >= 1000) {
    // Pour les très grandes distances (plus de 1000 km)
    return `${(distance / 1000).toFixed(1)}${includeUnit ? ' Mm' : ''}`;
  } else {
    // Format standard pour la plupart des distances cyclistes
    return `${distance.toFixed(1)}${includeUnit ? ' km' : ''}`;
  }
};

/**
 * Formate une durée en secondes en format lisible
 * @param {number} seconds - Durée en secondes
 * @param {string} [format='long'] - Format d'affichage ('long' ou 'short')
 * @returns {string} - Durée formatée
 */
export const formatDuration = (seconds, format = 'long') => {
  if (seconds === undefined || seconds === null) return '-';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (format === 'short') {
    // Format court (ex: 2h 30m)
    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}m`;
    } else {
      return `${minutes}m ${remainingSeconds.toString().padStart(2, '0')}s`;
    }
  } else {
    // Format long (ex: 2 heures 30 minutes)
    let result = [];
    
    if (hours > 0) {
      result.push(`${hours} ${hours === 1 ? 'heure' : 'heures'}`);
    }
    
    if (minutes > 0 || hours === 0) {
      result.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
    }
    
    if (hours === 0 && minutes === 0) {
      result.push(`${remainingSeconds} ${remainingSeconds === 1 ? 'seconde' : 'secondes'}`);
    }
    
    return result.join(' ');
  }
};

/**
 * Formate une date en format lisible
 * @param {string|Date} date - Date à formater
 * @param {string} [format='medium'] - Format d'affichage ('short', 'medium', 'long')
 * @returns {string} - Date formatée
 */
export const formatDate = (date, format = 'medium') => {
  if (!date) return '-';
  
  const dateObj = new Date(date);
  const now = new Date();
  const isToday = dateObj.setHours(0, 0, 0, 0) === now.setHours(0, 0, 0, 0);
  
  const options = { 
    day: 'numeric', 
    month: format === 'short' ? 'numeric' : 'long', 
    year: format === 'long' || dateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  };
  
  let formattedDate;
  
  if (format === 'short') {
    // Format court (ex: 01/02/2023)
    formattedDate = dateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  } else {
    // Format medium ou long
    formattedDate = dateObj.toLocaleDateString('fr-FR', options);
  }
  
  if (isToday && format !== 'short') {
    return 'Aujourd\'hui';
  }
  
  return formattedDate;
};

/**
 * Formate un pourcentage
 * @param {number} value - Valeur (0-1)
 * @param {number} [decimals=0] - Nombre de décimales
 * @returns {string} - Pourcentage formaté
 */
export const formatPercentage = (value, decimals = 0) => {
  if (value === undefined || value === null) return '-';
  
  const percentage = value * 100;
  return `${percentage.toFixed(decimals)}%`;
};

/**
 * Calcule l'intensité moyenne d'un ensemble d'activités
 * @param {Array} activities - Liste des activités
 * @returns {number} - Score d'intensité (0-5)
 */
export const calculateIntensity = (activities) => {
  if (!activities || activities.length === 0) return 0;
  
  // Calculer un score d'intensité basé sur plusieurs facteurs
  let totalIntensity = 0;
  
  activities.forEach(activity => {
    // Facteurs influençant l'intensité
    const speedFactor = activity.average_speed / 25; // Normalisé à 25 km/h
    const heartRateFactor = activity.average_heart_rate ? activity.average_heart_rate / 180 : 0.5; // Normalisé à 180 bpm
    const elevationFactor = activity.elevation_gain ? (activity.elevation_gain / activity.distance) / 20 : 0; // m/km, normalisé à 20m/km
    
    // Calcul du score pour cette activité
    const activityIntensity = (speedFactor * 0.3) + (heartRateFactor * 0.5) + (elevationFactor * 0.2);
    totalIntensity += activityIntensity;
  });
  
  // Moyenne d'intensité (0-5)
  return Math.min(5, Math.max(0, (totalIntensity / activities.length) * 5));
};

/**
 * Formate un score d'intensité en texte descriptif
 * @param {number} intensity - Score d'intensité (0-5)
 * @returns {string} - Description de l'intensité
 */
export const formatIntensity = (intensity) => {
  if (intensity < 1) return 'Très faible';
  if (intensity < 2) return 'Faible';
  if (intensity < 3) return 'Modérée';
  if (intensity < 4) return 'Élevée';
  return 'Très élevée';
};
