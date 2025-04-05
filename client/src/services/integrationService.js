import trainingService from './trainingService';
import weatherService from './weatherService';
import routeService from './routeService';

/**
 * Service d'intégration qui coordonne les données entre les différents composants
 * et services de l'application (entraînement, météo, itinéraires, HIIT)
 */
const integrationService = {
  /**
   * Récupère des données d'entraînement enrichies avec des informations météo
   * @param {string} userId - ID de l'utilisateur
   * @param {string} timeframe - Période (week, month, year, all)
   * @returns {Promise<Object>} Données d'entraînement enrichies
   */
  getEnrichedTrainingData: async (userId, timeframe) => {
    try {
      // Récupérer les activités d'entraînement
      const activities = await trainingService.getActivities(userId, timeframe);
      
      // Enrichir chaque activité avec des données météo si des coordonnées sont disponibles
      const enrichedActivities = await Promise.all(
        activities.map(async (activity) => {
          if (activity.startCoordinates) {
            try {
              const weatherData = await weatherService.getHistoricalWeather(
                activity.startCoordinates[0],
                activity.startCoordinates[1],
                new Date(activity.date)
              );
              
              return {
                ...activity,
                weather: weatherData
              };
            } catch (error) {
              console.warn('Impossible de récupérer les données météo:', error);
              return activity;
            }
          }
          return activity;
        })
      );
      
      // Calculer l'impact de la météo sur les performances
      const weatherImpact = calculateWeatherImpact(enrichedActivities);
      
      return {
        activities: enrichedActivities,
        weatherImpact,
        timeframe
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des données enrichies:', error);
      throw error;
    }
  },
  
  /**
   * Récupère des données pour la comparaison de périodes avec des informations contextuelles
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} period1 - Période 1 (startDate, endDate)
   * @param {Object} period2 - Période 2 (startDate, endDate)
   * @returns {Promise<Object>} Données de comparaison enrichies
   */
  getComprehensiveComparisonData: async (userId, period1, period2) => {
    try {
      // Récupérer les données pour les deux périodes
      const [data1, data2] = await Promise.all([
        trainingService.getPeriodData(userId, period1),
        trainingService.getPeriodData(userId, period2)
      ]);
      
      // Enrichir avec des données météo moyennes pour chaque période
      const [weatherContext1, weatherContext2] = await Promise.all([
        getAverageWeatherForActivities(data1.activities),
        getAverageWeatherForActivities(data2.activities)
      ]);
      
      return {
        period1: {
          ...data1,
          weatherContext: weatherContext1
        },
        period2: {
          ...data2,
          weatherContext: weatherContext2
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des données de comparaison:', error);
      throw error;
    }
  },
  
  /**
   * Récupère les données pour le tableau de bord combinant toutes les sources
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Données pour le tableau de bord
   */
  getDashboardData: async (userId) => {
    try {
      // Récupérer les différentes données en parallèle
      const [
        recentActivities,
        goals,
        hiitWorkouts,
        routes,
        weatherForecast
      ] = await Promise.all([
        trainingService.getActivities(userId, 'week'),
        trainingService.getTrainingGoals(userId),
        trainingService.getHiitWorkouts(userId, 5), // Derniers 5 entraînements HIIT
        routeService.getUserRoutes(userId),
        weatherService.getWeatherForecast() // Sans coordonnées = position par défaut de l'utilisateur
      ]);
      
      // Calculer les indicateurs de performance clés (KPIs)
      const kpis = calculateKPIs(recentActivities, goals);
      
      // Créer des recommandations personnalisées basées sur les données
      const recommendations = generateRecommendations(
        recentActivities,
        goals,
        weatherForecast,
        hiitWorkouts
      );
      
      return {
        recentActivities,
        goals,
        hiitWorkouts,
        routes,
        weatherForecast,
        kpis,
        recommendations
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des données du tableau de bord:', error);
      throw error;
    }
  },
  
  /**
   * Met à jour les préférences d'analyse d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} preferences - Préférences d'analyse
   * @returns {Promise<Object>} Préférences mises à jour
   */
  updateAnalysisPreferences: async (userId, preferences) => {
    try {
      // Enregistrer les préférences
      return await trainingService.saveUserPreferences(userId, preferences);
    } catch (error) {
      console.error('Erreur lors de la mise à jour des préférences:', error);
      throw error;
    }
  },
  
  /**
   * Exporte les données d'entraînement dans différents formats
   * @param {string} userId - ID de l'utilisateur
   * @param {string} timeframe - Période (week, month, year, custom)
   * @param {Object} customRange - Plage personnalisée (startDate, endDate)
   * @param {string} format - Format d'export (csv, pdf, json)
   * @returns {Promise<Blob>} Fichier exporté
   */
  exportTrainingData: async (userId, timeframe, customRange, format) => {
    try {
      let activities;
      
      if (timeframe === 'custom' && customRange) {
        activities = await trainingService.getActivitiesByDateRange(
          userId,
          customRange.startDate,
          customRange.endDate
        );
      } else {
        activities = await trainingService.getActivities(userId, timeframe);
      }
      
      // Générer l'export selon le format demandé
      switch (format) {
        case 'csv':
          return generateCSV(activities);
        case 'pdf':
          return generatePDF(activities);
        case 'json':
        default:
          return new Blob([JSON.stringify(activities, null, 2)], {
            type: 'application/json'
          });
      }
    } catch (error) {
      console.error('Erreur lors de l\'exportation des données:', error);
      throw error;
    }
  }
};

/**
 * Calcule l'impact de la météo sur les performances
 * @param {Array} activities - Activités enrichies avec des données météo
 * @returns {Object} Impact de la météo sur les performances
 */
const calculateWeatherImpact = (activities) => {
  // Initialiser les catégories de conditions météo
  const categories = {
    sunny: { activities: [], avgSpeed: 0, avgPower: 0, count: 0 },
    cloudy: { activities: [], avgSpeed: 0, avgPower: 0, count: 0 },
    rainy: { activities: [], avgSpeed: 0, avgPower: 0, count: 0 },
    windy: { activities: [], avgSpeed: 0, avgPower: 0, count: 0 },
    cold: { activities: [], avgSpeed: 0, avgPower: 0, count: 0 },
    hot: { activities: [], avgSpeed: 0, avgPower: 0, count: 0 }
  };
  
  // Catégoriser chaque activité selon la météo
  activities.forEach(activity => {
    if (!activity.weather) return;
    
    const { weather } = activity;
    
    // Déterminer la catégorie principale de météo pour cette activité
    if (weather.temperature > 28) {
      categories.hot.activities.push(activity);
      categories.hot.count++;
    } else if (weather.temperature < 5) {
      categories.cold.activities.push(activity);
      categories.cold.count++;
    } else if (weather.windSpeed > 20) {
      categories.windy.activities.push(activity);
      categories.windy.count++;
    } else if (weather.precipitation > 1) {
      categories.rainy.activities.push(activity);
      categories.rainy.count++;
    } else if (weather.cloudCover > 70) {
      categories.cloudy.activities.push(activity);
      categories.cloudy.count++;
    } else {
      categories.sunny.activities.push(activity);
      categories.sunny.count++;
    }
  });
  
  // Calculer les moyennes pour chaque catégorie
  Object.keys(categories).forEach(key => {
    const category = categories[key];
    if (category.count > 0) {
      category.avgSpeed = category.activities.reduce((sum, act) => sum + act.averageSpeed, 0) / category.count;
      category.avgPower = category.activities.reduce((sum, act) => sum + (act.averagePower || 0), 0) / category.count;
    }
  });
  
  // Trouver les meilleures et pires conditions
  let bestCondition = null;
  let worstCondition = null;
  let bestSpeed = 0;
  let worstSpeed = Infinity;
  
  Object.keys(categories).forEach(key => {
    const category = categories[key];
    if (category.count >= 3) { // Minimum 3 activités pour être significatif
      if (category.avgSpeed > bestSpeed) {
        bestSpeed = category.avgSpeed;
        bestCondition = key;
      }
      if (category.avgSpeed < worstSpeed && category.avgSpeed > 0) {
        worstSpeed = category.avgSpeed;
        worstCondition = key;
      }
    }
  });
  
  return {
    categories,
    bestCondition,
    worstCondition,
    speedDifference: bestSpeed - worstSpeed
  };
};

/**
 * Récupère les données météo moyennes pour une liste d'activités
 * @param {Array} activities - Liste d'activités
 * @returns {Promise<Object>} Données météo moyennes
 */
const getAverageWeatherForActivities = async (activities) => {
  if (!activities || activities.length === 0) {
    return null;
  }
  
  // Filtrer les activités avec des coordonnées
  const activitiesWithCoordinates = activities.filter(
    activity => activity.startCoordinates
  );
  
  if (activitiesWithCoordinates.length === 0) {
    return null;
  }
  
  try {
    // Récupérer les données météo pour chaque activité
    const weatherData = await Promise.all(
      activitiesWithCoordinates.map(activity =>
        weatherService.getHistoricalWeather(
          activity.startCoordinates[0],
          activity.startCoordinates[1],
          new Date(activity.date)
        )
      )
    );
    
    // Calculer les moyennes
    const totalWeather = weatherData.reduce(
      (acc, data) => {
        if (!data) return acc;
        return {
          temperature: acc.temperature + data.temperature,
          humidity: acc.humidity + data.humidity,
          windSpeed: acc.windSpeed + data.windSpeed,
          precipitation: acc.precipitation + data.precipitation,
          cloudCover: acc.cloudCover + data.cloudCover
        };
      },
      { temperature: 0, humidity: 0, windSpeed: 0, precipitation: 0, cloudCover: 0 }
    );
    
    const count = weatherData.filter(Boolean).length;
    
    if (count === 0) {
      return null;
    }
    
    return {
      temperature: totalWeather.temperature / count,
      humidity: totalWeather.humidity / count,
      windSpeed: totalWeather.windSpeed / count,
      precipitation: totalWeather.precipitation / count,
      cloudCover: totalWeather.cloudCover / count
    };
  } catch (error) {
    console.warn('Erreur lors du calcul des données météo moyennes:', error);
    return null;
  }
};

/**
 * Calcule les indicateurs de performance clés (KPIs)
 * @param {Array} activities - Activités récentes
 * @param {Array} goals - Objectifs d'entraînement
 * @returns {Object} KPIs calculés
 */
const calculateKPIs = (activities, goals) => {
  // Calculer les KPIs de base
  const totalDistance = activities.reduce((sum, act) => sum + act.distance, 0);
  const totalDuration = activities.reduce((sum, act) => sum + act.duration, 0);
  const totalElevation = activities.reduce((sum, act) => sum + (act.elevation || 0), 0);
  
  // Calculer les KPIs dérivés
  const averageSpeed = totalDistance / (totalDuration / 3600); // km/h
  const intensityScore = activities.reduce((sum, act) => {
    const heartRateFactor = act.averageHeartRate ? act.averageHeartRate / 180 : 0.5;
    const speedFactor = act.averageSpeed / 25;
    return sum + (heartRateFactor * 0.6 + speedFactor * 0.4);
  }, 0) / (activities.length || 1);
  
  // Calculer la progression vers les objectifs
  const goalProgress = goals.map(goal => {
    let currentValue = 0;
    let progressPercentage = 0;
    
    switch (goal.type) {
      case 'distance':
        currentValue = totalDistance;
        break;
      case 'duration':
        currentValue = totalDuration / 3600; // Convertir en heures
        break;
      case 'elevation':
        currentValue = totalElevation;
        break;
      case 'activities':
        currentValue = activities.length;
        break;
      default:
        break;
    }
    
    progressPercentage = Math.min(100, (currentValue / goal.target) * 100);
    
    return {
      ...goal,
      currentValue,
      progressPercentage
    };
  });
  
  return {
    totalDistance,
    totalDuration,
    totalElevation,
    averageSpeed,
    intensityScore,
    activityCount: activities.length,
    goalProgress
  };
};

/**
 * Génère des recommandations personnalisées basées sur les données
 * @param {Array} activities - Activités récentes
 * @param {Array} goals - Objectifs d'entraînement
 * @param {Object} weather - Prévisions météo
 * @param {Array} hiitWorkouts - Entraînements HIIT récents
 * @returns {Array} Liste de recommandations
 */
const generateRecommendations = (activities, goals, weather, hiitWorkouts) => {
  const recommendations = [];
  
  // Vérifier l'activité récente
  if (activities.length === 0) {
    recommendations.push({
      type: 'activity',
      priority: 'high',
      title: 'Reprenez l\'entraînement',
      description: 'Vous n\'avez pas encore d\'activités enregistrées cette semaine. Planifiez une sortie pour maintenir votre condition physique.'
    });
  } else if (activities.length < 3) {
    recommendations.push({
      type: 'activity',
      priority: 'medium',
      title: 'Augmentez votre fréquence',
      description: `Vous avez ${activities.length} activité(s) cette semaine. Essayez d'atteindre au moins 3 entraînements par semaine pour progresser.`
    });
  }
  
  // Recommandations basées sur les objectifs
  goals.forEach(goal => {
    const daysLeft = Math.ceil((new Date(goal.endDate) - new Date()) / (1000 * 60 * 60 * 24));
    const progress = goal.currentValue / goal.target;
    
    if (daysLeft > 0 && progress < 0.5 && daysLeft < goal.duration / 2) {
      recommendations.push({
        type: 'goal',
        priority: 'high',
        title: `Objectif en retard : ${goal.title}`,
        description: `Vous êtes en retard sur votre objectif. Il reste ${daysLeft} jours pour atteindre ${goal.target} ${goal.unit}.`
      });
    }
  });
  
  // Recommandations basées sur la météo
  if (weather && weather.daily && weather.daily.length > 0) {
    const goodWeatherDays = weather.daily.filter(day => 
      day.precipitation < 1 && day.temperature > 15 && day.temperature < 28
    );
    
    if (goodWeatherDays.length > 0) {
      const bestDay = goodWeatherDays[0];
      recommendations.push({
        type: 'weather',
        priority: 'medium',
        title: 'Conditions météo favorables à venir',
        description: `${bestDay.day} s'annonce idéal pour une sortie vélo avec ${bestDay.temperature.toFixed(1)}°C et peu de précipitations.`
      });
    }
  }
  
  // Recommandations basées sur les entraînements HIIT
  if (hiitWorkouts && hiitWorkouts.length === 0) {
    recommendations.push({
      type: 'hiit',
      priority: 'medium',
      title: 'Essayez un entraînement HIIT',
      description: 'Les entraînements par intervalles à haute intensité peuvent améliorer significativement vos performances. Essayez notre programme HIIT pour cyclistes.'
    });
  }
  
  return recommendations;
};

/**
 * Génère un fichier CSV à partir des activités
 * @param {Array} activities - Liste d'activités
 * @returns {Blob} Fichier CSV
 */
const generateCSV = (activities) => {
  const headers = [
    'Date',
    'Titre',
    'Type',
    'Distance (km)',
    'Durée (s)',
    'Dénivelé (m)',
    'Vitesse moyenne (km/h)',
    'FC moyenne (bpm)',
    'Puissance moyenne (W)',
    'Calories',
    'Température (°C)'
  ].join(',');
  
  const rows = activities.map(activity => [
    activity.date,
    `"${activity.title.replace(/"/g, '""')}"`,
    activity.type,
    activity.distance,
    activity.duration,
    activity.elevation || 0,
    activity.averageSpeed,
    activity.averageHeartRate || '',
    activity.averagePower || '',
    activity.calories || '',
    activity.weather ? activity.weather.temperature : ''
  ].join(','));
  
  const csv = [headers, ...rows].join('\n');
  
  return new Blob([csv], { type: 'text/csv;charset=utf-8' });
};

/**
 * Génère un fichier PDF à partir des activités
 * @param {Array} activities - Liste d'activités
 * @returns {Promise<Blob>} Fichier PDF
 */
const generatePDF = async (activities) => {
  // Cette fonction nécessiterait une bibliothèque comme jsPDF
  // Implémentation simplifiée pour l'exemple
  return new Blob(['PDF content'], { type: 'application/pdf' });
};

export default integrationService;
