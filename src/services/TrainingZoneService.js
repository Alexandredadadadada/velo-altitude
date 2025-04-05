/**
 * TrainingZoneService
 * Service pour gérer les calculs et l'intégration des zones d'entraînement
 * dans l'ensemble de l'application Dashboard-Velo
 */

/**
 * Calcule les zones d'entraînement basées sur le FTP
 * @param {number} ftp - Functional Threshold Power en watts
 * @returns {Object} Zones d'entraînement avec limites min/max et descriptions
 */
export const calculateTrainingZones = (ftp) => {
  if (!ftp || isNaN(ftp) || ftp <= 0) {
    throw new Error('FTP invalide pour le calcul des zones');
  }
  
  return {
    z1: { 
      min: 0, 
      max: Math.round(ftp * 0.55), 
      name: 'Récupération active', 
      description: 'Très facile, récupération',
      color: 'rgba(53, 162, 235, 0.7)', // Bleu
      range: '0-55% FTP',
      trainingEffect: 'Récupération, augmentation du flux sanguin, élimination des toxines'
    },
    z2: { 
      min: Math.round(ftp * 0.56), 
      max: Math.round(ftp * 0.75), 
      name: 'Endurance', 
      description: 'Longues sorties, rythme modéré',
      color: 'rgba(75, 192, 192, 0.7)', // Turquoise
      range: '56-75% FTP',
      trainingEffect: 'Amélioration de l\'endurance aérobie et utilisation des graisses'
    },
    z3: { 
      min: Math.round(ftp * 0.76), 
      max: Math.round(ftp * 0.9), 
      name: 'Tempo', 
      description: 'Effort soutenu mais contrôlé',
      color: 'rgba(102, 205, 170, 0.7)', // Vert
      range: '76-90% FTP',
      trainingEffect: 'Développement du seuil aérobie, efficacité énergétique'
    },
    z4: { 
      min: Math.round(ftp * 0.91), 
      max: Math.round(ftp * 1.05), 
      name: 'Seuil', 
      description: 'Proche de la limite, développe le seuil',
      color: 'rgba(255, 205, 86, 0.7)', // Jaune
      range: '91-105% FTP',
      trainingEffect: 'Développement du seuil anaérobie, tolérance au lactate'
    },
    z5: { 
      min: Math.round(ftp * 1.06), 
      max: Math.round(ftp * 1.2), 
      name: 'VO2 Max', 
      description: 'Intervalles intensifs, développe VO2max',
      color: 'rgba(255, 159, 64, 0.7)', // Orange
      range: '106-120% FTP',
      trainingEffect: 'Amélioration du VO2max, capacité cardiovasculaire'
    },
    z6: { 
      min: Math.round(ftp * 1.21), 
      max: Math.round(ftp * 1.5), 
      name: 'Anaérobie', 
      description: 'Efforts courts et très intenses',
      color: 'rgba(255, 99, 132, 0.7)', // Rouge
      range: '121-150% FTP',
      trainingEffect: 'Développement de la puissance anaérobie, capacité lactique'
    },
    z7: { 
      min: Math.round(ftp * 1.51), 
      max: Math.round(ftp * 2.0), 
      name: 'Neuromuscular', 
      description: 'Sprints et efforts maximaux',
      color: 'rgba(153, 102, 255, 0.7)', // Violet
      range: '>150% FTP',
      trainingEffect: 'Force musculaire pure, puissance maximale, recrutement neuromusculaire'
    }
  };
};

/**
 * Générer des entraînements basés sur les zones
 * @param {Object} userProfile - Profil de l'utilisateur avec FTP
 * @param {string} workoutType - Type d'entraînement (sweetspot, threshold, vo2max, etc.)
 * @param {number} duration - Durée souhaitée en minutes
 * @returns {Object} Séance d'entraînement structurée
 */
export const generateZoneBasedWorkout = (userProfile, workoutType, duration) => {
  if (!userProfile || !userProfile.ftp) {
    throw new Error('Profil utilisateur incomplet - FTP requis');
  }

  const { ftp } = userProfile;
  const zones = calculateTrainingZones(ftp);
  const workout = {
    name: '',
    description: '',
    duration: duration,
    tss: 0,
    segments: []
  };

  switch (workoutType) {
    case 'sweetspot':
      workout.name = 'Entraînement Sweet Spot';
      workout.description = 'Séance optimisée pour développer le seuil avec un impact fatigue/bénéfice optimal';
      
      // Échauffement progressif
      workout.segments.push({
        type: 'warmup',
        duration: 10 * 60, // 10 minutes en secondes
        startPower: Math.round(0.5 * ftp),
        endPower: Math.round(0.75 * ftp),
        description: 'Échauffement progressif'
      });
      
      // Intervalles Sweet Spot (88-94% du FTP)
      const sweetspotIntervals = Math.floor((duration - 20) / 15); // -20min pour échauffement et récup
      for (let i = 0; i < sweetspotIntervals; i++) {
        // Intervalle de travail
        workout.segments.push({
          type: 'interval',
          duration: 8 * 60, // 8 minutes
          power: Math.round(0.91 * ftp),
          description: `Intervalle Sweet Spot #${i+1}`,
          zone: 'z4',
          intensity: 0.91
        });
        
        // Récupération active
        workout.segments.push({
          type: 'recovery',
          duration: 3 * 60, // 3 minutes
          power: Math.round(0.65 * ftp),
          description: 'Récupération active',
          zone: 'z2',
          intensity: 0.65
        });
      }
      
      // Récupération finale
      workout.segments.push({
        type: 'cooldown',
        duration: 10 * 60, // 10 minutes
        startPower: Math.round(0.65 * ftp),
        endPower: Math.round(0.5 * ftp),
        description: 'Récupération'
      });
      
      break;
      
    case 'threshold':
      workout.name = 'Développement du Seuil';
      workout.description = 'Travail au seuil pour augmenter votre FTP';
      
      // Échauffement progressif
      workout.segments.push({
        type: 'warmup',
        duration: 12 * 60, // 12 minutes
        startPower: Math.round(0.5 * ftp),
        endPower: Math.round(0.75 * ftp),
        description: 'Échauffement progressif'
      });
      
      // Blocs au seuil (95-105% du FTP)
      const thresholdBlocks = Math.floor((duration - 20) / 20); // -20min pour échauffement et récup
      for (let i = 0; i < thresholdBlocks; i++) {
        // Bloc de travail au seuil
        workout.segments.push({
          type: 'interval',
          duration: 10 * 60, // 10 minutes
          power: Math.round(1.0 * ftp),
          description: `Bloc seuil #${i+1}`,
          zone: 'z4',
          intensity: 1.0
        });
        
        // Récupération active
        workout.segments.push({
          type: 'recovery',
          duration: 5 * 60, // 5 minutes
          power: Math.round(0.6 * ftp),
          description: 'Récupération active',
          zone: 'z2',
          intensity: 0.6
        });
      }
      
      // Récupération finale
      workout.segments.push({
        type: 'cooldown',
        duration: 8 * 60, // 8 minutes
        startPower: Math.round(0.65 * ftp),
        endPower: Math.round(0.5 * ftp),
        description: 'Récupération'
      });
      
      break;
      
    case 'vo2max':
      workout.name = 'Développement VO2 Max';
      workout.description = 'Intervalles haute intensité pour améliorer votre VO2 Max';
      
      // Échauffement progressif
      workout.segments.push({
        type: 'warmup',
        duration: 15 * 60, // 15 minutes
        startPower: Math.round(0.5 * ftp),
        endPower: Math.round(0.8 * ftp),
        description: 'Échauffement progressif'
      });
      
      // Intervalles VO2 Max (110-120% du FTP)
      const vo2Intervals = Math.floor((duration - 25) / 7.5); // -25min pour échauffement et récup
      for (let i = 0; i < vo2Intervals; i++) {
        // Intervalle VO2 Max
        workout.segments.push({
          type: 'interval',
          duration: 3 * 60, // 3 minutes
          power: Math.round(1.15 * ftp),
          description: `Intervalle VO2 Max #${i+1}`,
          zone: 'z5',
          intensity: 1.15
        });
        
        // Récupération active
        workout.segments.push({
          type: 'recovery',
          duration: 3 * 60, // 3 minutes
          power: Math.round(0.5 * ftp),
          description: 'Récupération active',
          zone: 'z1',
          intensity: 0.5
        });
      }
      
      // Récupération finale
      workout.segments.push({
        type: 'cooldown',
        duration: 10 * 60, // 10 minutes
        startPower: Math.round(0.6 * ftp),
        endPower: Math.round(0.4 * ftp),
        description: 'Récupération'
      });
      
      break;
      
    case 'endurance':
      workout.name = 'Endurance de Base';
      workout.description = 'Développement de l\'endurance aérobie fondamentale';
      
      // Échauffement progressif
      workout.segments.push({
        type: 'warmup',
        duration: 10 * 60, // 10 minutes
        startPower: Math.round(0.5 * ftp),
        endPower: Math.round(0.65 * ftp),
        description: 'Échauffement progressif'
      });
      
      // Bloc d'endurance principal
      workout.segments.push({
        type: 'steady',
        duration: (duration - 15) * 60, // Durée totale - 15min pour échauffement/récup
        power: Math.round(0.7 * ftp),
        description: 'Tempo d\'endurance',
        zone: 'z2',
        intensity: 0.7
      });
      
      // Récupération finale
      workout.segments.push({
        type: 'cooldown',
        duration: 5 * 60, // 5 minutes
        startPower: Math.round(0.6 * ftp),
        endPower: Math.round(0.5 * ftp),
        description: 'Récupération'
      });
      
      break;
      
    case 'anaerobic':
      workout.name = 'Capacité Anaérobie';
      workout.description = 'Développement de la puissance anaérobie et de la capacité lactique';
      
      // Échauffement progressif
      workout.segments.push({
        type: 'warmup',
        duration: 15 * 60, // 15 minutes
        startPower: Math.round(0.5 * ftp),
        endPower: Math.round(0.85 * ftp),
        description: 'Échauffement progressif'
      });
      
      // Intervalles anaérobies (130-150% du FTP)
      const anaerobicIntervals = Math.floor((duration - 25) / 4); // -25min pour échauffement et récup
      for (let i = 0; i < anaerobicIntervals; i++) {
        // Intervalle anaérobie
        workout.segments.push({
          type: 'interval',
          duration: 1 * 60, // 1 minute
          power: Math.round(1.35 * ftp),
          description: `Intervalle anaérobie #${i+1}`,
          zone: 'z6',
          intensity: 1.35
        });
        
        // Récupération active
        workout.segments.push({
          type: 'recovery',
          duration: 3 * 60, // 3 minutes
          power: Math.round(0.5 * ftp),
          description: 'Récupération active',
          zone: 'z1',
          intensity: 0.5
        });
      }
      
      // Récupération finale
      workout.segments.push({
        type: 'cooldown',
        duration: 10 * 60, // 10 minutes
        startPower: Math.round(0.6 * ftp),
        endPower: Math.round(0.4 * ftp),
        description: 'Récupération'
      });
      
      break;
      
    default:
      throw new Error(`Type d'entraînement non reconnu: ${workoutType}`);
  }

  // Calculer le TSS (Training Stress Score) approximatif
  workout.tss = calculateWorkoutTSS(workout, ftp);
  
  return workout;
};

/**
 * Calcule le TSS (Training Stress Score) d'une séance
 * @param {Object} workout - La séance d'entraînement
 * @param {number} ftp - FTP de l'utilisateur
 * @returns {number} TSS estimé
 */
export const calculateWorkoutTSS = (workout, ftp) => {
  if (!workout || !workout.segments || !ftp) {
    return 0;
  }
  
  let totalTSS = 0;
  let totalWorkInJoules = 0;
  const totalDurationHours = workout.segments.reduce((acc, segment) => acc + segment.duration, 0) / 3600;
  
  // Calculer l'énergie totale de la séance
  workout.segments.forEach(segment => {
    switch(segment.type) {
      case 'warmup':
      case 'cooldown':
        // Puissance moyenne pour les segments à puissance variable
        const avgPower = (segment.startPower + segment.endPower) / 2;
        totalWorkInJoules += avgPower * segment.duration;
        break;
      case 'interval':
      case 'steady':
      case 'recovery':
        totalWorkInJoules += segment.power * segment.duration;
        break;
      default:
        break;
    }
  });
  
  // Puissance normalisée approximative (simplifiée)
  const averagePower = totalWorkInJoules / (totalDurationHours * 3600);
  const intensityFactor = averagePower / ftp;
  
  // Formule TSS = (durée_heures * NP * IF * 100) / FTP
  totalTSS = Math.round((totalDurationHours * averagePower * intensityFactor * 100) / ftp);
  
  return totalTSS;
};

/**
 * Analyse les données d'une sortie pour identifier le temps passé dans chaque zone
 * @param {Array} powerData - Données de puissance d'une sortie (watts)
 * @param {number} ftp - FTP du cycliste
 * @returns {Object} Temps passé dans chaque zone (secondes et pourcentage)
 */
export const analyzeWorkoutZones = (powerData, ftp) => {
  if (!powerData || !powerData.length || !ftp) {
    throw new Error('Données insuffisantes pour analyser les zones');
  }
  
  const zones = calculateTrainingZones(ftp);
  const zoneTime = {
    z1: 0,
    z2: 0,
    z3: 0,
    z4: 0,
    z5: 0,
    z6: 0,
    z7: 0
  };
  
  // Compter le temps passé dans chaque zone
  powerData.forEach(power => {
    if (power <= zones.z1.max) zoneTime.z1++;
    else if (power <= zones.z2.max) zoneTime.z2++;
    else if (power <= zones.z3.max) zoneTime.z3++;
    else if (power <= zones.z4.max) zoneTime.z4++;
    else if (power <= zones.z5.max) zoneTime.z5++;
    else if (power <= zones.z6.max) zoneTime.z6++;
    else zoneTime.z7++;
  });
  
  // Convertir en pourcentage
  const totalPoints = powerData.length;
  const zonePercentage = {};
  
  Object.keys(zoneTime).forEach(zone => {
    zonePercentage[zone] = Math.round((zoneTime[zone] / totalPoints) * 100);
  });
  
  return {
    totalDuration: totalPoints, // En secondes si chaque point = 1 seconde
    zoneTime,
    zonePercentage
  };
};

export default {
  calculateTrainingZones,
  generateZoneBasedWorkout,
  calculateWorkoutTSS,
  analyzeWorkoutZones
};
