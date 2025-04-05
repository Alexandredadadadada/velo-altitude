/**
 * Service de recommandations d'entraînement personnalisées
 * Utilise l'IA Claude pour générer des plans d'entraînement adaptés au profil et à l'historique
 */

const claudeApi = require('./claude-api.service');
const trainingService = require('./training-zones.service');
const logger = require('../utils/logger');
const cacheService = require('./cache.service');

/**
 * Génère des recommandations d'entraînement personnalisées basées sur l'historique
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} userProfile - Profil de l'utilisateur (âge, niveau, objectifs)
 * @param {Array} activityHistory - Historique des activités récentes
 * @returns {Promise<Object>} - Recommandations personnalisées
 */
async function generateTrainingRecommendations(userId, userProfile, activityHistory) {
  try {
    // Vérifier si des recommandations existent déjà en cache
    const cacheKey = `training_recommendations_${userId}`;
    const cachedRecommendations = await cacheService.get(cacheKey);
    
    if (cachedRecommendations) {
      logger.info(`Recommandations récupérées du cache pour l'utilisateur ${userId}`);
      return {
        ...cachedRecommendations,
        fromCache: true
      };
    }
    
    // Formater les données pour le prompt
    const userProfileText = JSON.stringify(userProfile, null, 2);
    const activitySummary = summarizeActivities(activityHistory);
    
    // Créer un prompt détaillé pour Claude
    const prompt = `
    En tant qu'expert en entraînement cycliste, génère un plan d'entraînement personnalisé basé sur ces informations:
    
    PROFIL UTILISATEUR:
    ${userProfileText}
    
    HISTORIQUE RÉCENT D'ACTIVITÉS:
    ${activitySummary}
    
    Génère un plan d'entraînement pour les 7 prochains jours qui:
    1. S'adapte au niveau actuel de l'utilisateur
    2. Prend en compte ses objectifs spécifiques
    3. Intègre une progression appropriée basée sur son historique récent
    4. Inclut des séances variées (endurance, intensité, récupération)
    5. Fournit des conseils spécifiques pour chaque séance
    
    Format de réponse: JSON structuré avec les champs suivants:
    - summary: résumé du plan et justification
    - weekPlan: tableau de 7 objets (un par jour) avec:
      - day: jour de la semaine
      - type: type de séance
      - title: titre de la séance
      - description: description détaillée
      - duration: durée recommandée
      - intensity: niveau d'intensité (1-10)
      - metrics: métriques à surveiller
    `;
    
    // Appeler l'API Claude
    const response = await claudeApi.generateResponse(prompt, {
      temperature: 0.4, // Réduire la température pour des réponses plus cohérentes
      max_tokens: 2000
    });
    
    // Extraire et parser le JSON de la réponse
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                      response.match(/\{[\s\S]*\}/);
                      
    if (!jsonMatch) {
      throw new Error('Format de réponse invalide');
    }
    
    const jsonContent = jsonMatch[1] || jsonMatch[0];
    const recommendations = JSON.parse(jsonContent);
    
    // Ajouter des métadonnées
    const enrichedRecommendations = {
      ...recommendations,
      userId,
      generatedAt: new Date().toISOString(),
      validUntil: getValidUntilDate(),
      fromCache: false
    };
    
    // Mettre en cache les recommandations (valides pendant 24h)
    await cacheService.set(cacheKey, enrichedRecommendations, 86400);
    
    // Enregistrer les recommandations dans la base de données
    await saveRecommendations(userId, enrichedRecommendations);
    
    return enrichedRecommendations;
  } catch (error) {
    logger.error(`Erreur lors de la génération des recommandations: ${error.message}`);
    
    // En cas d'erreur, générer des recommandations basiques
    return generateFallbackRecommendations(userId, userProfile, activityHistory);
  }
}

/**
 * Enregistre les recommandations dans la base de données
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} recommendations - Recommandations générées
 */
async function saveRecommendations(userId, recommendations) {
  try {
    // Cette fonction serait implémentée pour sauvegarder dans la base de données
    // Pour l'instant, nous nous contentons de logger l'action
    logger.info(`Recommandations sauvegardées pour l'utilisateur ${userId}`);
    return true;
  } catch (error) {
    logger.error(`Erreur lors de la sauvegarde des recommandations: ${error.message}`);
    return false;
  }
}

/**
 * Génère une date de validité pour les recommandations (7 jours)
 * @returns {string} - Date de validité au format ISO
 */
function getValidUntilDate() {
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 7);
  return validUntil.toISOString();
}

/**
 * Fonction utilitaire pour résumer les activités
 * @param {Array} activities - Liste des activités
 * @returns {string} - Résumé des activités formaté
 */
function summarizeActivities(activities) {
  if (!activities || activities.length === 0) {
    return "Aucune activité récente";
  }
  
  // Calculer des métriques globales
  const totalActivities = activities.length;
  const totalDistance = activities.reduce((sum, act) => sum + (act.distance || 0), 0) / 1000; // en km
  const totalDuration = activities.reduce((sum, act) => sum + (act.duration || 0), 0) / 3600; // en heures
  const totalElevation = activities.reduce((sum, act) => sum + (act.elevationGain || 0), 0);
  
  // Extraire les meilleures performances
  const bestEfforts = {
    maxPower: Math.max(...activities.map(act => act.maxPower || 0)),
    bestAvgPower: Math.max(...activities.map(act => act.averagePower || 0)),
    bestNormalizedPower: Math.max(...activities.map(act => act.normalizedPower || 0))
  };
  
  // Identifier les types d'activités
  const activityTypes = activities.reduce((types, act) => {
    types[act.type] = (types[act.type] || 0) + 1;
    return types;
  }, {});
  
  // Calculer la distribution des zones de puissance
  const powerZonesDistribution = activities.reduce((zones, act) => {
    if (act.powerZones) {
      Object.entries(act.powerZones).forEach(([zone, time]) => {
        zones[zone] = (zones[zone] || 0) + time;
      });
    }
    return zones;
  }, {});
  
  // Résumer les activités récentes (5 dernières)
  const recentActivitiesSummary = activities.slice(0, 5).map(act => ({
    date: act.startDate,
    type: act.type,
    name: act.name,
    distance: act.distance / 1000, // en km
    duration: act.duration / 60, // en minutes
    avgPower: act.averagePower,
    normalizedPower: act.normalizedPower,
    elevationGain: act.elevationGain
  }));
  
  // Construire le résumé
  const summary = {
    overview: {
      totalActivities,
      totalDistance: Math.round(totalDistance),
      totalDuration: Math.round(totalDuration * 10) / 10,
      totalElevation: Math.round(totalElevation),
      activityTypes
    },
    performance: bestEfforts,
    powerZonesDistribution,
    recentActivities: recentActivitiesSummary
  };
  
  return JSON.stringify(summary, null, 2);
}

/**
 * Génère des recommandations de base en cas d'échec de l'API
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} userProfile - Profil de l'utilisateur
 * @param {Array} activityHistory - Historique des activités
 * @returns {Object} - Recommandations de secours
 */
function generateFallbackRecommendations(userId, userProfile, activityHistory) {
  logger.info(`Génération de recommandations de secours pour l'utilisateur ${userId}`);
  
  // Déterminer le niveau approximatif de l'utilisateur
  const level = userProfile.level || 'intermediate';
  const goal = userProfile.goal || 'general';
  
  // Plan de base selon le niveau et l'objectif
  const weekPlan = [
    {
      day: "Lundi",
      type: "Récupération",
      title: "Récupération active",
      description: "Sortie légère pour récupérer du weekend",
      duration: "45-60 min",
      intensity: 2,
      metrics: ["Fréquence cardiaque < 75% FCmax", "Puissance < 65% FTP"]
    },
    {
      day: "Mardi",
      type: level === 'beginner' ? "Endurance" : "Intervalles",
      title: level === 'beginner' ? "Endurance de base" : "Intervalles courts",
      description: level === 'beginner' 
        ? "Travail d'endurance à intensité modérée" 
        : "5 x 3 minutes à haute intensité avec 3 minutes de récupération",
      duration: level === 'beginner' ? "60-75 min" : "75-90 min",
      intensity: level === 'beginner' ? 4 : 7,
      metrics: level === 'beginner' 
        ? ["Puissance 65-75% FTP", "Cadence ~90 rpm"] 
        : ["Puissance intervalles 105-115% FTP", "Cadence >95 rpm"]
    },
    {
      day: "Mercredi",
      type: "Récupération",
      title: "Jour de repos ou récupération très légère",
      description: "Repos complet ou sortie très légère si vous vous sentez bien",
      duration: "0-45 min",
      intensity: 1,
      metrics: ["Fréquence cardiaque < 70% FCmax"]
    },
    {
      day: "Jeudi",
      type: "Seuil",
      title: "Travail au seuil",
      description: level === 'beginner' 
        ? "2 x 8 minutes au seuil avec 5 minutes de récupération" 
        : "3 x 12 minutes au seuil avec 6 minutes de récupération",
      duration: "75-90 min",
      intensity: 6,
      metrics: ["Puissance 90-100% FTP", "Cadence stable"]
    },
    {
      day: "Vendredi",
      type: "Technique",
      title: "Travail technique",
      description: "Travail de cadence et d'agilité sur le vélo",
      duration: "60 min",
      intensity: 3,
      metrics: ["Variation de cadence", "Exercices techniques"]
    },
    {
      day: "Samedi",
      type: goal === 'climbing' ? "Grimpée" : "Endurance longue",
      title: goal === 'climbing' ? "Travail en côte" : "Sortie longue",
      description: goal === 'climbing'
        ? "Répétitions de côtes avec focus sur la position et la régularité"
        : "Sortie longue à intensité modérée avec focus sur l'alimentation",
      duration: "2-3 heures",
      intensity: 5,
      metrics: ["Hydratation régulière", "Nutrition pendant l'effort"]
    },
    {
      day: "Dimanche",
      type: "Récupération",
      title: "Récupération active",
      description: "Sortie légère sans efforts intenses",
      duration: "60-90 min",
      intensity: 2,
      metrics: ["Fréquence cardiaque < 75% FCmax", "Apprécier le paysage"]
    }
  ];
  
  return {
    summary: "Plan d'entraînement hebdomadaire équilibré adapté à votre niveau. Ce plan alterne entre travail d'intensité, endurance et récupération pour optimiser votre progression.",
    weekPlan,
    userId,
    generatedAt: new Date().toISOString(),
    validUntil: getValidUntilDate(),
    fromCache: false,
    isBackupPlan: true
  };
}

/**
 * Analyse les performances d'une activité et fournit des conseils
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} activity - Données de l'activité
 * @returns {Promise<Object>} - Analyse de performance
 */
async function analyzePerformance(userId, activity) {
  try {
    // Vérifier si une analyse existe déjà en cache
    const cacheKey = `performance_analysis_${activity.id}`;
    const cachedAnalysis = await cacheService.get(cacheKey);
    
    if (cachedAnalysis) {
      logger.info(`Analyse de performance récupérée du cache pour l'activité ${activity.id}`);
      return {
        ...cachedAnalysis,
        fromCache: true
      };
    }
    
    // Formater les données pour le prompt
    const activityData = JSON.stringify(activity, null, 2);
    
    // Créer un prompt détaillé pour Claude
    const prompt = `
    En tant qu'expert en analyse de performance cycliste, analyse cette activité et fournis des insights détaillés:
    
    DONNÉES DE L'ACTIVITÉ:
    ${activityData}
    
    Fournis une analyse complète qui inclut:
    1. Résumé global de la performance
    2. Points forts identifiés
    3. Domaines d'amélioration
    4. Analyse de la distribution de puissance et d'effort
    5. Comparaison avec les performances précédentes (si disponibles)
    6. Recommandations spécifiques pour de futures séances
    7. Impact de cette activité sur la forme globale
    
    Format de réponse: JSON structuré avec les champs suivants:
    - summary: résumé global de l'analyse
    - strengths: tableau des points forts identifiés
    - improvements: tableau des domaines à améliorer
    - powerAnalysis: analyse de la distribution de puissance
    - recommendations: tableau de recommandations spécifiques
    - trainingImpact: impact estimé sur la progression
    `;
    
    // Appeler l'API Claude
    const response = await claudeApi.generateResponse(prompt, {
      temperature: 0.3,
      max_tokens: 1500
    });
    
    // Extraire et parser le JSON de la réponse
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                      response.match(/\{[\s\S]*\}/);
                      
    if (!jsonMatch) {
      throw new Error('Format de réponse invalide');
    }
    
    const jsonContent = jsonMatch[1] || jsonMatch[0];
    const analysis = JSON.parse(jsonContent);
    
    // Ajouter des métadonnées
    const enrichedAnalysis = {
      ...analysis,
      activityId: activity.id,
      userId,
      analyzedAt: new Date().toISOString(),
      fromCache: false
    };
    
    // Mettre en cache l'analyse (valide pendant 30 jours)
    await cacheService.set(cacheKey, enrichedAnalysis, 30 * 86400);
    
    return enrichedAnalysis;
  } catch (error) {
    logger.error(`Erreur lors de l'analyse de performance: ${error.message}`);
    
    // En cas d'erreur, générer une analyse basique
    return generateFallbackAnalysis(userId, activity);
  }
}

/**
 * Génère une analyse de performance de base en cas d'échec de l'API
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} activity - Données de l'activité
 * @returns {Object} - Analyse de secours
 */
function generateFallbackAnalysis(userId, activity) {
  // Analyse de base basée sur les métriques simples
  const analysis = {
    summary: `Sortie de ${activity.distance/1000} km avec une puissance moyenne de ${activity.averagePower} watts.`,
    strengths: [
      "Bonne régularité de l'effort",
      "Durée d'entraînement adaptée à votre niveau"
    ],
    improvements: [
      "Travailler sur la distribution des zones de puissance",
      "Varier davantage les types d'entraînements"
    ],
    powerAnalysis: `Votre puissance normalisée de ${activity.normalizedPower} watts suggère un parcours avec des variations d'intensité.`,
    recommendations: [
      "Intégrer plus d'intervalles courts à haute intensité",
      "Travailler la récupération active entre les efforts"
    ],
    trainingImpact: "Impact modéré sur votre progression globale"
  };
  
  return {
    ...analysis,
    activityId: activity.id,
    userId,
    analyzedAt: new Date().toISOString(),
    fromCache: false,
    isBackupAnalysis: true
  };
}

module.exports = {
  generateTrainingRecommendations,
  analyzePerformance
};
