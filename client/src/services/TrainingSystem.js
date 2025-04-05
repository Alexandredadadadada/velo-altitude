/**
 * Service centralisé pour le système d'entraînement
 * Gère la cohérence entre les différents types d'entraînement
 * et sert de point d'entrée unifié pour toutes les fonctionnalités liées
 */

import FTPService from './FTPEstimationService';

// Types d'entraînement disponibles
export const TRAINING_TYPES = {
  ENDURANCE: 'endurance',           // Endurance fondamentale (Z1-Z2)
  TEMPO: 'tempo',                   // Tempo (Z3)
  THRESHOLD: 'threshold',           // Seuil (Z4)
  VO2MAX: 'vo2max',                 // VO2max (Z5)
  ANAEROBIC: 'anaerobic',           // Capacité anaérobie (Z6)
  SPRINT: 'sprint',                 // Sprint/Neuromuscular (Z7)
  HIIT: 'hiit',                     // Entraînement par intervalles haute intensité (mixte)
  RECOVERY: 'recovery',             // Récupération active (Z1)
  STRENGTH: 'strength',             // Force spécifique (faible cadence, Z3-Z4)
  TECHNIQUE: 'technique',           // Technique de pédalage, agilité, etc.
  CLIMBING: 'climbing',             // Entraînement en montée
  LONG_RIDE: 'longRide'             // Sortie longue
};

// Objectifs d'entraînement
export const TRAINING_GOALS = {
  GENERAL_FITNESS: 'generalFitness',    // Forme générale et santé
  ENDURANCE: 'enduranceBuilding',       // Construction d'endurance
  POWER: 'powerDevelopment',            // Développement de puissance
  SPEED: 'speedDevelopment',            // Développement de vitesse
  WEIGHT_LOSS: 'weightLoss',            // Perte de poids
  EVENT_PREP: 'eventPreparation',       // Préparation à un événement
  RACE_PREP: 'racePreparation',         // Préparation à la compétition
  RECOVERY: 'activeRecovery'            // Récupération active
};

// Profils de cycliste
export const CYCLIST_PROFILES = {
  ALL_ROUND: 'allRound',            // Polyvalent
  CLIMBER: 'climber',               // Grimpeur
  ROULEUR: 'rouleur',               // Rouleur
  SPRINTER: 'sprinter',             // Sprinteur
  PUNCHEUR: 'puncheur',             // Puncheur
  TIME_TRIAL: 'timeTrial',          // Spécialiste du contre-la-montre
  RECREATIONAL: 'recreational',     // Cycliste récréatif
  TOURING: 'touring'                // Cyclotouriste
};

// Niveaux de cycliste
export const CYCLIST_LEVELS = {
  BEGINNER: 'beginner',             // Débutant
  INTERMEDIATE: 'intermediate',     // Intermédiaire
  ADVANCED: 'advanced',             // Avancé
  ELITE: 'elite'                    // Élite
};

/**
 * Calcule les métriques d'entraînement globales
 * @param {Object} workout - Séance d'entraînement avec intervalles
 * @param {number} ftp - FTP du cycliste
 * @returns {Object} Métriques calculées (TSS, IF, etc.)
 */
export const calculateTrainingMetrics = (workout, ftp) => {
  if (!workout || !workout.intervals || !Array.isArray(workout.intervals) || !ftp) {
    console.error('Données insuffisantes pour calculer les métriques', { workout, ftp });
    return {
      tss: 0,
      if: 0,
      work: 0,
      avgPower: 0,
      normalizedPower: 0,
      duration: 0
    };
  }

  try {
    // Calcul de la durée en secondes
    const totalDuration = workout.intervals.reduce((total, interval) => {
      return total + (interval.duration || 0) + (interval.restDuration || 0);
    }, 0);
    
    // Calcul du travail total en joules
    const totalWork = workout.intervals.reduce((total, interval) => {
      const workDuration = interval.duration || 0;
      const power = interval.power || 0;
      return total + (workDuration * power);
    }, 0);
    
    // Puissance moyenne
    const avgPower = totalWork / totalDuration || 0;
    
    // Calcul de la puissance normalisée (simplifiée)
    // Normalement nécessite un algorithme plus complexe avec échantillonnage aux 30s
    // Cette simplification est une approximation
    const normalizedPower = Math.pow(
      workout.intervals.reduce((total, interval) => {
        const workDuration = interval.duration || 0;
        const power = interval.power || 0;
        return total + (workDuration * Math.pow(power, 4));
      }, 0) / totalDuration,
      0.25
    ) || 0;
    
    // Intensité relative
    const intensityFactor = normalizedPower / ftp;
    
    // Training Stress Score
    const tss = (totalDuration * normalizedPower * intensityFactor) / (ftp * 3600) * 100;
    
    return {
      tss: Math.round(tss),
      if: parseFloat(intensityFactor.toFixed(2)),
      work: Math.round(totalWork / 1000), // kJ
      avgPower: Math.round(avgPower),
      normalizedPower: Math.round(normalizedPower),
      duration: Math.round(totalDuration / 60) // minutes
    };
  } catch (error) {
    console.error('Erreur lors du calcul des métriques d\'entraînement', error);
    return {
      tss: 0,
      if: 0,
      work: 0,
      avgPower: 0,
      normalizedPower: 0,
      duration: 0
    };
  }
};

/**
 * Calcule la charge d'entraînement chronique (CTL), aiguë (ATL) et l'équilibre (TSB)
 * @param {Array} activities - Historique des activités avec TSS
 * @param {number} days - Nombre de jours à analyser
 * @returns {Object} CTL, ATL et TSB pour chaque jour
 */
export const calculateTrainingLoad = (activities, days = 42) => {
  if (!activities || !Array.isArray(activities)) {
    return { ctl: [], atl: [], tsb: [] };
  }

  // Trier les activités par date
  const sortedActivities = [...activities].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  // Créer un tableau de jours avec TSS
  const now = new Date();
  const daysList = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    // Trouver les activités pour ce jour
    const dayActivities = sortedActivities.filter(a => 
      a.date.startsWith(dateString)
    );
    
    // Calculer le TSS total pour ce jour
    const dayTSS = dayActivities.reduce((sum, activity) => 
      sum + (activity.tss || 0), 0
    );
    
    daysList.push({
      date: dateString,
      tss: dayTSS
    });
  }
  
  // Calculer CTL (42 jours), ATL (7 jours) et TSB
  const result = daysList.map((day, index) => {
    // Calculer CTL (constante de temps de 42 jours)
    let ctlSum = 0;
    let ctlDays = 0;
    
    for (let i = 0; i <= Math.min(index, 41); i++) {
      const factor = Math.exp(-i / 42);
      ctlSum += daysList[index - i].tss * factor;
      ctlDays += factor;
    }
    
    const ctl = ctlSum / ctlDays;
    
    // Calculer ATL (constante de temps de 7 jours)
    let atlSum = 0;
    let atlDays = 0;
    
    for (let i = 0; i <= Math.min(index, 6); i++) {
      const factor = Math.exp(-i / 7);
      atlSum += daysList[index - i].tss * factor;
      atlDays += factor;
    }
    
    const atl = atlSum / atlDays;
    
    // TSB = CTL - ATL
    const tsb = ctl - atl;
    
    return {
      date: day.date,
      ctl: parseFloat(ctl.toFixed(1)),
      atl: parseFloat(atl.toFixed(1)),
      tsb: parseFloat(tsb.toFixed(1)),
      tss: day.tss
    };
  });
  
  return result;
};

/**
 * Détermine les recommandations d'entraînement basées sur le profil et l'historique
 * @param {Object} userProfile - Profil de l'utilisateur
 * @param {Array} trainingHistory - Historique des entraînements
 * @returns {Object} Recommandations personnalisées
 */
export const getTrainingRecommendations = (userProfile, trainingHistory) => {
  if (!userProfile) {
    return { 
      recommendedTypes: [], 
      weeklyStructure: [],
      focusAreas: [],
      message: "Complétez d'abord votre profil pour obtenir des recommandations personnalisées."
    };
  }
  
  // Extraire les informations pertinentes du profil
  const { level, goal, profile, ftp, age, weight, hoursPerWeek } = userProfile;
  
  // Définir les types d'entraînement recommandés selon le niveau et l'objectif
  let recommendedTypes = [];
  let weeklyStructure = [];
  let focusAreas = [];
  let message = "";
  
  // Vérifier et valider la FTP
  const validFtp = FTPService.validateFTP(ftp, userProfile);
  
  // Base pour tous les cyclistes: endurance + récupération
  recommendedTypes.push(TRAINING_TYPES.ENDURANCE, TRAINING_TYPES.RECOVERY);
  
  // Ajuster selon le niveau
  if (level === CYCLIST_LEVELS.BEGINNER) {
    // Débutants: Principalement endurance et technique
    recommendedTypes.push(TRAINING_TYPES.TECHNIQUE);
    message = "Concentrez-vous sur le développement d'une base d'endurance solide et la technique de pédalage.";
    
    weeklyStructure = [
      { day: 1, type: TRAINING_TYPES.ENDURANCE, duration: 60 },
      { day: 3, type: TRAINING_TYPES.TECHNIQUE, duration: 45 },
      { day: 5, type: TRAINING_TYPES.ENDURANCE, duration: 75 },
      { day: 7, type: TRAINING_TYPES.RECOVERY, duration: 45 }
    ];
    
    focusAreas = ["Constance", "Endurance de base", "Technique"];
    
  } else if (level === CYCLIST_LEVELS.INTERMEDIATE) {
    // Intermédiaires: Ajouter seuil et force
    recommendedTypes.push(
      TRAINING_TYPES.THRESHOLD, 
      TRAINING_TYPES.STRENGTH,
      TRAINING_TYPES.TEMPO
    );
    
    message = "Commencez à incorporer des entraînements au seuil et de force spécifique à votre routine.";
    
    weeklyStructure = [
      { day: 1, type: TRAINING_TYPES.ENDURANCE, duration: 90 },
      { day: 3, type: TRAINING_TYPES.THRESHOLD, duration: 60 },
      { day: 5, type: TRAINING_TYPES.STRENGTH, duration: 60 },
      { day: 6, type: TRAINING_TYPES.LONG_RIDE, duration: 120 },
      { day: 7, type: TRAINING_TYPES.RECOVERY, duration: 45 }
    ];
    
    focusAreas = ["Seuil de puissance", "Force spécifique", "Volume d'endurance"];
    
  } else if (level === CYCLIST_LEVELS.ADVANCED || level === CYCLIST_LEVELS.ELITE) {
    // Avancés/Elite: Tous les types d'entraînement
    recommendedTypes.push(
      TRAINING_TYPES.THRESHOLD,
      TRAINING_TYPES.VO2MAX,
      TRAINING_TYPES.HIIT,
      TRAINING_TYPES.ANAEROBIC,
      TRAINING_TYPES.SPRINT,
      TRAINING_TYPES.STRENGTH
    );
    
    message = "Votre niveau vous permet d'utiliser toute la gamme des entraînements spécifiques au cyclisme.";
    
    weeklyStructure = [
      { day: 1, type: TRAINING_TYPES.ENDURANCE, duration: 120 },
      { day: 2, type: TRAINING_TYPES.VO2MAX, duration: 60 },
      { day: 3, type: TRAINING_TYPES.RECOVERY, duration: 45 },
      { day: 4, type: TRAINING_TYPES.THRESHOLD, duration: 90 },
      { day: 5, type: TRAINING_TYPES.HIIT, duration: 60 },
      { day: 6, type: TRAINING_TYPES.LONG_RIDE, duration: 180 },
      { day: 7, type: TRAINING_TYPES.RECOVERY, duration: 60 }
    ];
    
    focusAreas = ["Puissance au seuil", "VO2max", "Capacité anaérobie", "Périodisation"];
  }
  
  // Ajuster selon le profil de cycliste
  if (profile === CYCLIST_PROFILES.CLIMBER) {
    recommendedTypes.push(TRAINING_TYPES.CLIMBING);
    focusAreas.push("Puissance en montée", "Rapport poids/puissance");
  } else if (profile === CYCLIST_PROFILES.SPRINTER) {
    recommendedTypes.push(TRAINING_TYPES.SPRINT);
    focusAreas.push("Puissance maximale", "Accélération");
  } else if (profile === CYCLIST_PROFILES.TOURING) {
    recommendedTypes.push(TRAINING_TYPES.LONG_RIDE);
    focusAreas.push("Endurance longue distance", "Économie d'effort");
  }
  
  // Ajuster selon l'âge
  if (age && age > 50) {
    // Privilégier récupération et limiter haute intensité pour seniors
    focusAreas.push("Récupération optimale", "Intensité contrôlée");
    message += " À votre âge, accordez une attention particulière à la récupération entre les séances.";
  }
  
  // Intégrer l'historique d'entraînement pour les recommandations
  if (trainingHistory && trainingHistory.length > 0) {
    const recentHistory = trainingHistory.slice(0, 14); // Deux dernières semaines
    
    // Analyser la charge d'entraînement récente
    const trainingLoad = calculateTrainingLoad(recentHistory);
    const latestTSB = trainingLoad[trainingLoad.length - 1]?.tsb || 0;
    
    // Ajuster selon la fraîcheur/fatigue
    if (latestTSB < -20) {
      // Fatigue importante
      message += " Votre fatigue est élevée. Privilégiez les séances de récupération cette semaine.";
      recommendedTypes = [TRAINING_TYPES.RECOVERY, TRAINING_TYPES.ENDURANCE];
    } else if (latestTSB > 10) {
      // Bonne fraîcheur
      message += " Votre niveau de fraîcheur est optimal pour des séances de haute intensité.";
    }
    
    // Identifier les lacunes dans l'entraînement
    const typeDistribution = recentHistory.reduce((acc, workout) => {
      const type = workout.type || TRAINING_TYPES.ENDURANCE;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    
    // Recommander les types sous-représentés
    Object.values(TRAINING_TYPES).forEach(type => {
      if (!typeDistribution[type] && recommendedTypes.includes(type)) {
        message += ` Pensez à intégrer des séances de ${type} qui sont absentes de votre entraînement récent.`;
      }
    });
  }
  
  return {
    recommendedTypes: [...new Set(recommendedTypes)], // Éliminer les doublons
    weeklyStructure,
    focusAreas,
    message
  };
};

/**
 * Génère un plan d'entraînement personnalisé
 * @param {Object} userProfile - Profil de l'utilisateur
 * @param {Object} preferences - Préférences d'entraînement
 * @param {number} weeks - Durée du plan en semaines
 * @returns {Object} Plan d'entraînement complet
 */
export const generateTrainingPlan = (userProfile, preferences, weeks = 8) => {
  // Cette fonction sera développée pour générer un plan complet
  // avec périodisation et progression
  
  return {
    // Structure à développer
    startDate: new Date(),
    endDate: new Date(Date.now() + weeks * 7 * 24 * 60 * 60 * 1000),
    phases: [],
    weeklySchedule: []
  };
};

export default {
  TRAINING_TYPES,
  TRAINING_GOALS,
  CYCLIST_PROFILES,
  CYCLIST_LEVELS,
  calculateTrainingMetrics,
  calculateTrainingLoad,
  getTrainingRecommendations,
  generateTrainingPlan
};
