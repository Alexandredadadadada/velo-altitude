/**
 * hiitWorkouts.js
 * Bibliothèque structurée de séances HIIT pour Velo-Altitude
 * Séances organisées par durée et dépense calorique pour faciliter la recherche
 */

import { brandConfig } from '../config/branding';

// Utilitaires pour les calculs énergétiques
const calculateTotalIntensity = (intervals) => {
  return intervals.reduce((total, interval) => {
    const duration = interval.duration || 0;
    const intensity = interval.intensity || 0;
    const repeat = interval.repeat || 1;
    
    if (interval.recovery && interval.recoveryIntensity) {
      const recoveryEffort = interval.recovery * interval.recoveryIntensity * repeat;
      return total + (duration * intensity * repeat) + recoveryEffort;
    }
    
    return total + (duration * intensity * repeat);
  }, 0);
};

/**
 * Calcule les calories approximatives brûlées pendant une séance
 * @param {Number} totalIntensity - Intensité cumulée de la séance
 * @param {Number} userWeight - Poids de l'utilisateur en kg
 * @param {Number} userFTP - FTP de l'utilisateur en watts
 * @return {Number} - Calories estimées
 */
export const calculateCalories = (totalIntensity, userWeight = 70, userFTP = 200) => {
  // Coefficient adapté en fonction du poids et du FTP
  const calorieCoefficient = (userWeight / 70) * (userFTP / 200) * 3.5;
  return Math.round(totalIntensity * calorieCoefficient);
};

/**
 * Séances HIIT organisées par durée
 * Chaque séance contient:
 * - id: identifiant unique
 * - name: nom de la séance
 * - duration: durée en minutes
 * - caloriesBurned: calories approximatives pour un cycliste de 70kg avec FTP 200W
 * - intensity: niveau d'intensité global (low, medium, medium-high, high, very-high)
 * - type: catégorie de séance (endurance, power, recovery, mountain)
 * - badgeType: type de badge visuel (express, burn, power, climb)
 * - format: structure détaillée des intervalles
 */
export const hiitWorkoutsByTime = [
  // Séances Express (15 minutes)
  {
    id: "quick15",
    name: "Express 15",
    description: "Séance courte et intense pour maximiser l'effet en minimum de temps",
    duration: 15,
    caloriesBurned: 200,
    intensity: "high",
    type: "power",
    badgeType: "express",
    focusArea: ["cardio", "lactate"],
    format: [
      { type: "warmup", duration: 3, intensity: 50 },
      { type: "interval", duration: 0.5, intensity: 95, repeat: 10, recovery: 0.5, recoveryIntensity: 40 },
      { type: "cooldown", duration: 2, intensity: 40 }
    ]
  },
  {
    id: "tabata15",
    name: "Tabata Express",
    description: "Protocole Tabata classique adapté pour les cyclistes pressés",
    duration: 15,
    caloriesBurned: 220,
    intensity: "very-high",
    type: "power",
    badgeType: "express",
    focusArea: ["anaerobic", "vo2max"],
    format: [
      { type: "warmup", duration: 4, intensity: 60 },
      { type: "interval", duration: 0.33, intensity: 100, repeat: 8, recovery: 0.67, recoveryIntensity: 30 },
      { type: "interval", duration: 0.33, intensity: 100, repeat: 8, recovery: 0.67, recoveryIntensity: 30 },
      { type: "cooldown", duration: 3, intensity: 40 }
    ]
  },
  
  // Séances Standard (30 minutes)
  {
    id: "standard30",
    name: "Classique 30",
    description: "Séance équilibrée de 30 minutes pour améliorer votre endurance et puissance",
    duration: 30,
    caloriesBurned: 450,
    intensity: "medium-high",
    type: "endurance",
    badgeType: "balanced",
    focusArea: ["threshold", "vo2max"],
    format: [
      { type: "warmup", duration: 5, intensity: 60 },
      { type: "interval", duration: 2, intensity: 85, repeat: 5, recovery: 1, recoveryIntensity: 50 },
      { type: "interval", duration: 1, intensity: 95, repeat: 5, recovery: 1, recoveryIntensity: 40 },
      { type: "cooldown", duration: 5, intensity: 50 }
    ]
  },
  {
    id: "pyramid30",
    name: "Pyramide 30",
    description: "Structure pyramidale pour travailler progressivement jusqu'au pic d'intensité",
    duration: 30,
    caloriesBurned: 420,
    intensity: "medium-high",
    type: "endurance",
    badgeType: "structured",
    focusArea: ["lactate", "threshold"],
    format: [
      { type: "warmup", duration: 5, intensity: 55 },
      { type: "interval", duration: 1, intensity: 75, repeat: 1, recovery: 1, recoveryIntensity: 50 },
      { type: "interval", duration: 2, intensity: 80, repeat: 1, recovery: 1, recoveryIntensity: 50 },
      { type: "interval", duration: 3, intensity: 85, repeat: 1, recovery: 1, recoveryIntensity: 45 },
      { type: "interval", duration: 4, intensity: 90, repeat: 1, recovery: 2, recoveryIntensity: 40 },
      { type: "interval", duration: 3, intensity: 85, repeat: 1, recovery: 1, recoveryIntensity: 45 },
      { type: "interval", duration: 2, intensity: 80, repeat: 1, recovery: 1, recoveryIntensity: 50 },
      { type: "interval", duration: 1, intensity: 75, repeat: 1, recovery: 1, recoveryIntensity: 50 },
      { type: "cooldown", duration: 3, intensity: 45 }
    ]
  },
  
  // Séances Complètes (45 minutes)
  {
    id: "complete45",
    name: "Progressive 45",
    description: "Séance complète avec progression d'intensité pour améliorer votre endurance lactique",
    duration: 45,
    caloriesBurned: 650,
    intensity: "medium",
    type: "endurance",
    badgeType: "complete",
    focusArea: ["endurance", "threshold"],
    format: [
      { type: "warmup", duration: 8, intensity: 60 },
      { type: "interval", duration: 3, intensity: 75, repeat: 3, recovery: 2, recoveryIntensity: 50 },
      { type: "interval", duration: 2, intensity: 85, repeat: 4, recovery: 1, recoveryIntensity: 45 },
      { type: "interval", duration: 1, intensity: 95, repeat: 5, recovery: 1, recoveryIntensity: 40 },
      { type: "cooldown", duration: 5, intensity: 50 }
    ]
  },
  {
    id: "mountain45",
    name: "Col Virtuel 45",
    description: "Simulation d'ascension de col avec variations d'intensité comme sur un vrai col",
    duration: 45,
    caloriesBurned: 680,
    intensity: "medium-high",
    type: "mountain",
    badgeType: "climb",
    focusArea: ["climbing", "threshold"],
    format: [
      { type: "warmup", duration: 7, intensity: 60 },
      { type: "interval", duration: 3, intensity: 80, repeat: 1, recovery: 0, recoveryIntensity: 0 },
      { type: "interval", duration: 2, intensity: 90, repeat: 1, recovery: 0, recoveryIntensity: 0 },
      { type: "interval", duration: 1, intensity: 70, repeat: 1, recovery: 0, recoveryIntensity: 0 },
      { type: "interval", duration: 3, intensity: 85, repeat: 1, recovery: 0, recoveryIntensity: 0 },
      { type: "interval", duration: 2, intensity: 95, repeat: 1, recovery: 0, recoveryIntensity: 0 },
      { type: "interval", duration: 1, intensity: 75, repeat: 1, recovery: 0, recoveryIntensity: 0 },
      { type: "interval", duration: 4, intensity: 85, repeat: 1, recovery: 0, recoveryIntensity: 0 },
      { type: "interval", duration: 3, intensity: 100, repeat: 1, recovery: 0, recoveryIntensity: 0 },
      { type: "interval", duration: 2, intensity: 70, repeat: 1, recovery: 0, recoveryIntensity: 0 },
      { type: "interval", duration: 5, intensity: 80, repeat: 1, recovery: 0, recoveryIntensity: 0 },
      { type: "interval", duration: 2, intensity: 95, repeat: 1, recovery: 0, recoveryIntensity: 0 },
      { type: "cooldown", duration: 5, intensity: 50 }
    ]
  },
  
  // Séances Longues (60 minutes)
  {
    id: "endurance60",
    name: "Endurance 60",
    description: "Travail d'endurance avec intervalles longs pour préparer les longues ascensions",
    duration: 60,
    caloriesBurned: 800,
    intensity: "medium",
    type: "endurance",
    badgeType: "endurance",
    focusArea: ["endurance", "fatigue_resistance"],
    format: [
      { type: "warmup", duration: 10, intensity: 60 },
      { type: "interval", duration: 8, intensity: 75, repeat: 2, recovery: 4, recoveryIntensity: 55 },
      { type: "interval", duration: 5, intensity: 85, repeat: 3, recovery: 3, recoveryIntensity: 50 },
      { type: "interval", duration: 3, intensity: 90, repeat: 1, recovery: 2, recoveryIntensity: 45 },
      { type: "cooldown", duration: 8, intensity: 50 }
    ]
  },
  {
    id: "power60",
    name: "Puissance 60",
    description: "Séance orientée développement de la puissance maximale et résistance à la fatigue",
    duration: 60,
    caloriesBurned: 900,
    intensity: "high",
    type: "power",
    badgeType: "burn",
    focusArea: ["power", "lactate_tolerance"],
    format: [
      { type: "warmup", duration: 10, intensity: 60 },
      { type: "interval", duration: 1, intensity: 120, repeat: 5, recovery: 3, recoveryIntensity: 40 },
      { type: "interval", duration: 2, intensity: 110, repeat: 5, recovery: 2, recoveryIntensity: 40 },
      { type: "interval", duration: 5, intensity: 90, repeat: 3, recovery: 2, recoveryIntensity: 50 },
      { type: "cooldown", duration: 8, intensity: 45 }
    ]
  }
];

/**
 * Séances HIIT organisées par dépense calorique
 * Configuration similaire aux séances par temps, mais avec des séances optimisées pour maximiser
 * les calories brûlées dans différentes plages (300, 500, 700, 1000 calories)
 */
export const hiitWorkoutsByCalories = [
  // Séances 300 calories
  {
    id: "burn300_quick",
    name: "Brûle 300 Express",
    description: "Séance rapide concentrée sur la dépense calorique maximale en temps minimum",
    duration: 20,
    caloriesBurned: 300,
    intensity: "high",
    type: "power",
    badgeType: "burn",
    focusArea: ["fat_burning", "cardio"],
    format: [
      { type: "warmup", duration: 3, intensity: 60 },
      { type: "interval", duration: 0.5, intensity: 100, repeat: 12, recovery: 0.5, recoveryIntensity: 50 },
      { type: "interval", duration: 1, intensity: 90, repeat: 5, recovery: 1, recoveryIntensity: 60 },
      { type: "cooldown", duration: 2, intensity: 50 }
    ]
  },
  {
    id: "burn300_balanced",
    name: "Brûle 300 Équilibré",
    description: "Séance équilibrée pour brûler 300 calories avec un niveau d'intensité modéré",
    duration: 25,
    caloriesBurned: 300,
    intensity: "medium",
    type: "endurance",
    badgeType: "balanced",
    focusArea: ["fat_burning", "endurance"],
    format: [
      { type: "warmup", duration: 5, intensity: 60 },
      { type: "interval", duration: 3, intensity: 80, repeat: 3, recovery: 2, recoveryIntensity: 60 },
      { type: "interval", duration: 1, intensity: 90, repeat: 5, recovery: 1, recoveryIntensity: 50 },
      { type: "cooldown", duration: 3, intensity: 50 }
    ]
  },
  
  // Séances 500 calories
  {
    id: "burn500_intense",
    name: "Intense 500",
    description: "Séance à haute intensité conçue pour maximiser la dépense de 500 calories",
    duration: 35,
    caloriesBurned: 500,
    intensity: "high",
    type: "power",
    badgeType: "burn",
    focusArea: ["fat_burning", "vo2max"],
    format: [
      { type: "warmup", duration: 5, intensity: 60 },
      { type: "interval", duration: 1, intensity: 95, repeat: 8, recovery: 1, recoveryIntensity: 50 },
      { type: "interval", duration: 2, intensity: 85, repeat: 5, recovery: 1, recoveryIntensity: 55 },
      { type: "interval", duration: 3, intensity: 90, repeat: 2, recovery: 2, recoveryIntensity: 50 },
      { type: "cooldown", duration: 5, intensity: 45 }
    ]
  },
  {
    id: "burn500_threshold",
    name: "Seuil 500",
    description: "Travail au seuil pour développer l'endurance tout en brûlant 500 calories",
    duration: 40,
    caloriesBurned: 500,
    intensity: "medium-high",
    type: "endurance",
    badgeType: "structured",
    focusArea: ["threshold", "fat_burning"],
    format: [
      { type: "warmup", duration: 8, intensity: 60 },
      { type: "interval", duration: 5, intensity: 85, repeat: 4, recovery: 2, recoveryIntensity: 50 },
      { type: "interval", duration: 1, intensity: 95, repeat: 3, recovery: 1, recoveryIntensity: 45 },
      { type: "cooldown", duration: 5, intensity: 50 }
    ]
  },
  
  // Séances 700 calories
  {
    id: "burn700_mountain",
    name: "Col 700",
    description: "Simulation d'ascension pour brûler 700 calories en travaillant la résistance en montagne",
    duration: 50,
    caloriesBurned: 700,
    intensity: "medium-high",
    type: "mountain",
    badgeType: "climb",
    focusArea: ["climbing", "fat_burning"],
    format: [
      { type: "warmup", duration: 8, intensity: 60 },
      { type: "interval", duration: 8, intensity: 80, repeat: 1, recovery: 0, recoveryIntensity: 0 },
      { type: "interval", duration: 3, intensity: 90, repeat: 1, recovery: 0, recoveryIntensity: 0 },
      { type: "interval", duration: 1, intensity: 70, repeat: 1, recovery: 0, recoveryIntensity: 0 },
      { type: "interval", duration: 6, intensity: 85, repeat: 1, recovery: 0, recoveryIntensity: 0 },
      { type: "interval", duration: 2, intensity: 95, repeat: 1, recovery: 0, recoveryIntensity: 0 },
      { type: "interval", duration: 2, intensity: 75, repeat: 1, recovery: 0, recoveryIntensity: 0 },
      { type: "interval", duration: 8, intensity: 80, repeat: 1, recovery: 0, recoveryIntensity: 0 },
      { type: "interval", duration: 3, intensity: 100, repeat: 1, recovery: 0, recoveryIntensity: 0 },
      { type: "interval", duration: 2, intensity: 70, repeat: 1, recovery: 0, recoveryIntensity: 0 },
      { type: "cooldown", duration: 6, intensity: 50 }
    ]
  },
  {
    id: "burn700_power",
    name: "Puissance 700",
    description: "Séance orientée puissance avec des efforts maximaux pour une dépense de 700 calories",
    duration: 45,
    caloriesBurned: 700,
    intensity: "very-high",
    type: "power",
    badgeType: "burn",
    focusArea: ["power", "fat_burning"],
    format: [
      { type: "warmup", duration: 8, intensity: 60 },
      { type: "interval", duration: 0.5, intensity: 120, repeat: 10, recovery: 1.5, recoveryIntensity: 40 },
      { type: "interval", duration: 1, intensity: 110, repeat: 8, recovery: 1, recoveryIntensity: 40 },
      { type: "interval", duration: 3, intensity: 90, repeat: 3, recovery: 2, recoveryIntensity: 50 },
      { type: "cooldown", duration: 7, intensity: 45 }
    ]
  },
  
  // Séances 1000 calories
  {
    id: "burn1000_endurance",
    name: "Endurance 1000",
    description: "Séance longue pour brûler 1000 calories en développant l'endurance",
    duration: 75,
    caloriesBurned: 1000,
    intensity: "medium",
    type: "endurance",
    badgeType: "endurance",
    focusArea: ["endurance", "fat_burning"],
    format: [
      { type: "warmup", duration: 10, intensity: 60 },
      { type: "interval", duration: 10, intensity: 75, repeat: 3, recovery: 5, recoveryIntensity: 55 },
      { type: "interval", duration: 5, intensity: 85, repeat: 3, recovery: 3, recoveryIntensity: 50 },
      { type: "interval", duration: 2, intensity: 95, repeat: 2, recovery: 2, recoveryIntensity: 45 },
      { type: "cooldown", duration: 10, intensity: 50 }
    ]
  },
  {
    id: "burn1000_complete",
    name: "Complet 1000",
    description: "Séance complète qui travaille tous les systèmes énergétiques tout en brûlant 1000 calories",
    duration: 70,
    caloriesBurned: 1000,
    intensity: "high",
    type: "power",
    badgeType: "burn",
    focusArea: ["complete", "fat_burning"],
    format: [
      { type: "warmup", duration: 10, intensity: 60 },
      // Bloc anaérobie
      { type: "interval", duration: 0.5, intensity: 120, repeat: 6, recovery: 1.5, recoveryIntensity: 40 },
      // Bloc VO2max
      { type: "interval", duration: 3, intensity: 95, repeat: 3, recovery: 2, recoveryIntensity: 40 },
      // Bloc seuil
      { type: "interval", duration: 5, intensity: 85, repeat: 4, recovery: 2, recoveryIntensity: 50 },
      // Bloc endurance
      { type: "interval", duration: 8, intensity: 75, repeat: 1, recovery: 0, recoveryIntensity: 0 },
      { type: "cooldown", duration: 7, intensity: 45 }
    ]
  }
];

// Badges visuels pour les types de séances
export const workoutBadges = {
  express: {
    label: "Express",
    color: "#ff9800", // Orange
    icon: "bolt", // Éclair
    description: "Séance courte et efficace pour les emplois du temps chargés"
  },
  burn: {
    label: "Brûle-graisse",
    color: "#f44336", // Rouge
    icon: "local_fire_department", // Flamme
    description: "Maximise la dépense calorique et la combustion des graisses"
  },
  climb: {
    label: "Grimpeur",
    color: "#4caf50", // Vert
    icon: "terrain", // Montagne
    description: "Simule les conditions d'ascension des cols"
  },
  endurance: {
    label: "Endurance",
    color: "#2196f3", // Bleu
    icon: "watch_later", // Horloge
    description: "Développe l'endurance sur la durée"
  },
  balanced: {
    label: "Équilibré",
    color: "#9c27b0", // Violet
    icon: "balance", // Balance
    description: "Travail équilibré de plusieurs qualités physiques"
  },
  structured: {
    label: "Structuré",
    color: "#3f51b5", // Indigo
    icon: "view_module", // Modules
    description: "Progression structurée avec phases distinctes"
  }
};

// Obtenir toutes les séances combinées
export const getAllWorkouts = () => [...hiitWorkoutsByTime, ...hiitWorkoutsByCalories];

// Recherche de séances
export const findWorkouts = (criteria = {}) => {
  let workouts = getAllWorkouts();
  
  // Filtrer par durée
  if (criteria.minDuration !== undefined) {
    workouts = workouts.filter(w => w.duration >= criteria.minDuration);
  }
  if (criteria.maxDuration !== undefined) {
    workouts = workouts.filter(w => w.duration <= criteria.maxDuration);
  }
  
  // Filtrer par calories
  if (criteria.minCalories !== undefined) {
    workouts = workouts.filter(w => w.caloriesBurned >= criteria.minCalories);
  }
  if (criteria.maxCalories !== undefined) {
    workouts = workouts.filter(w => w.caloriesBurned <= criteria.maxCalories);
  }
  
  // Filtrer par intensité
  if (criteria.intensity) {
    workouts = workouts.filter(w => w.intensity === criteria.intensity);
  }
  
  // Filtrer par type
  if (criteria.type) {
    workouts = workouts.filter(w => w.type === criteria.type);
  }
  
  // Filtrer par badge
  if (criteria.badgeType) {
    workouts = workouts.filter(w => w.badgeType === criteria.badgeType);
  }
  
  // Filtrer par zone d'intérêt
  if (criteria.focusArea) {
    workouts = workouts.filter(w => w.focusArea.includes(criteria.focusArea));
  }
  
  return workouts;
};

export default {
  hiitWorkoutsByTime,
  hiitWorkoutsByCalories,
  workoutBadges,
  getAllWorkouts,
  findWorkouts,
  calculateCalories
};
