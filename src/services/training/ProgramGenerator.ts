/**
 * Service de génération de programmes d'entraînement
 * Corrige les problèmes de génération de programmes et ajoute un suivi des progrès
 */

import api from '../api';
import { TrainingZones } from '../../types/training';

// Types pour le profile utilisateur
interface UserProfile {
  id: string;
  ftp?: number;
  weight?: number;
  age?: number;
  level?: string;
  cyclingType?: string;
  recoveryMode?: boolean;
  specializations?: string[];
  preferredDuration?: number;
  [key: string]: any;
}

// Types pour les objectifs d'entraînement
interface TrainingGoals {
  primary: string;
  secondary?: string;
  duration: number; // en semaines
  frequency?: number; // séances par semaine
  targetEvent?: {
    name: string;
    date: string;
    type: string;
  };
  customPreferences?: {
    [key: string]: any;
  };
}

// Interface pour le suivi des entraînements
interface CompletionData {
  completed: boolean;
  actualPower?: number;
  actualDuration?: number;
  perceivedExertion?: number;
  heartRate?: {
    average: number;
    max: number;
  };
  notes?: string;
  feelingScore?: number;
  metrics?: {
    [key: string]: number | string;
  };
}

// Client API pour les requêtes
const apiClient = {
  post: (url: string, data: any) => api.post(url, data)
};

/**
 * Classe de génération de programmes d'entraînement
 */
export class ProgramGenerator {
  /**
   * Estimation de la FTP si elle n'est pas fournie
   */
  private estimateFTP(userProfile: UserProfile): number {
    // Estimation basée sur le niveau et l'âge
    const { age = 35, weight = 70, level = 'intermediate' } = userProfile;
    
    // Valeurs de base par niveau
    const baseFTP: Record<string, number> = {
      'beginner': 2.5,
      'intermediate': 3.2,
      'advanced': 3.8,
      'elite': 4.5
    };
    
    // Facteur d'âge (diminution progressive après 30 ans)
    const ageFactor = age > 30 ? 1 - ((age - 30) * 0.005) : 1;
    
    // Calcul de la FTP estimée (W/kg × poids × facteur d'âge)
    const ftpEstimate = baseFTP[level] * weight * ageFactor;
    
    return Math.round(ftpEstimate);
  }
  
  /**
   * Calcul des zones d'entraînement basées sur la FTP
   */
  private calculateTrainingZones(ftp: number): TrainingZones {
    return {
      z1: { min: Math.round(ftp * 0.0), max: Math.round(ftp * 0.55) },
      z2: { min: Math.round(ftp * 0.56), max: Math.round(ftp * 0.75) },
      z3: { min: Math.round(ftp * 0.76), max: Math.round(ftp * 0.90) },
      z4: { min: Math.round(ftp * 0.91), max: Math.round(ftp * 1.05) },
      z5: { min: Math.round(ftp * 1.06), max: Math.round(ftp * 1.20) },
      z6: { min: Math.round(ftp * 1.21), max: Math.round(ftp * 1.50) },
      z7: { min: Math.round(ftp * 1.51), max: Math.round(ftp * 2.00) }
    };
  }
  
  /**
   * Recherche d'un modèle correspondant aux objectifs
   */
  private findMatchingTemplate(goals: TrainingGoals): any {
    // Templates d'entraînement basés sur les objectifs primaires
    const templates: Record<string, any> = {
      'endurance': {
        name: 'Programme d\'endurance',
        focus: 'Volume et zones basses',
        progression: 'progressive',
        weeklyStructure: [
          { day: 1, type: 'rest' },
          { day: 2, type: 'endurance', intensity: 'low' },
          { day: 3, type: 'endurance', intensity: 'medium' },
          { day: 4, type: 'active_recovery' },
          { day: 5, type: 'endurance', intensity: 'low' },
          { day: 6, type: 'endurance', intensity: 'high' },
          { day: 7, type: 'long_ride' }
        ]
      },
      'climbing': {
        name: 'Programme d\'ascension',
        focus: 'Force et puissance en montée',
        progression: 'stepped',
        weeklyStructure: [
          { day: 1, type: 'rest' },
          { day: 2, type: 'strength', intensity: 'medium' },
          { day: 3, type: 'climbing_intervals', intensity: 'high' },
          { day: 4, type: 'active_recovery' },
          { day: 5, type: 'climbing_simulation', intensity: 'medium' },
          { day: 6, type: 'endurance', intensity: 'low' },
          { day: 7, type: 'long_climbing_ride' }
        ]
      },
      'power': {
        name: 'Programme de puissance',
        focus: 'Force et puissance maximale',
        progression: 'block',
        weeklyStructure: [
          { day: 1, type: 'rest' },
          { day: 2, type: 'power_intervals', intensity: 'high' },
          { day: 3, type: 'endurance', intensity: 'low' },
          { day: 4, type: 'threshold', intensity: 'medium' },
          { day: 5, type: 'active_recovery' },
          { day: 6, type: 'sprint_intervals', intensity: 'max' },
          { day: 7, type: 'endurance', intensity: 'medium' }
        ]
      },
      'weight_loss': {
        name: 'Programme de perte de poids',
        focus: 'Volume et intervalles brûleurs de graisse',
        progression: 'linear',
        weeklyStructure: [
          { day: 1, type: 'fasted_ride', intensity: 'low' },
          { day: 2, type: 'sweet_spot', intensity: 'medium' },
          { day: 3, type: 'hiit', intensity: 'high' },
          { day: 4, type: 'active_recovery' },
          { day: 5, type: 'tempo', intensity: 'medium' },
          { day: 6, type: 'endurance', intensity: 'low' },
          { day: 7, type: 'long_ride', intensity: 'low' }
        ]
      },
      'event_preparation': {
        name: 'Préparation d\'événement',
        focus: 'Spécificité et périodisation',
        progression: 'periodized',
        weeklyStructure: [
          { day: 1, type: 'rest' },
          { day: 2, type: 'specific', intensity: 'medium' },
          { day: 3, type: 'vo2max', intensity: 'high' },
          { day: 4, type: 'active_recovery' },
          { day: 5, type: 'race_simulation', intensity: 'high' },
          { day: 6, type: 'endurance', intensity: 'low' },
          { day: 7, type: 'brick', intensity: 'medium' }
        ]
      }
    };
    
    // Recherche du template correspondant à l'objectif principal
    const template = templates[goals.primary] || templates['endurance'];
    
    // Ajustements en fonction de l'objectif secondaire si présent
    if (goals.secondary && templates[goals.secondary]) {
      const secondaryTemplate = templates[goals.secondary];
      
      // Fusion des aspects du template secondaire (25% d'influence)
      template.name = `${template.name} avec focus ${secondaryTemplate.name.toLowerCase()}`;
      
      // Ajustement de la structure hebdomadaire (1-2 séances adaptées)
      const dayToModify = [3, 5]; // Jours à modifier pour inclure l'objectif secondaire
      dayToModify.forEach((day, index) => {
        if (index < 2) { // Limiter à 2 modifications maximum
          const secondaryDay = secondaryTemplate.weeklyStructure.find((d: any) => 
            d.type !== 'rest' && d.type !== 'active_recovery'
          );
          
          if (secondaryDay) {
            template.weeklyStructure[day - 1] = { ...secondaryDay };
          }
        }
      });
    }
    
    return template;
  }
  
  /**
   * Construction de la progression de l'entraînement
   */
  private buildProgression(template: any, zones: TrainingZones, userProfile: UserProfile): any {
    const { level = 'intermediate' } = userProfile;
    
    // Facteurs de progression par niveau
    const progressionFactors: Record<string, number> = {
      'beginner': 0.05, // 5% par semaine
      'intermediate': 0.08, // 8% par semaine
      'advanced': 0.1, // 10% par semaine
      'elite': 0.12 // 12% par semaine
    };
    
    // Récupération du facteur de progression
    const progressionFactor = progressionFactors[level] || 0.08;
    
    // Génération des semaines d'entraînement
    const weeks = [];
    const totalWeeks = 8; // Par défaut 8 semaines
    
    for (let weekIndex = 0; weekIndex < totalWeeks; weekIndex++) {
      const weekNumber = weekIndex + 1;
      const weekIntensity = 1 + (progressionFactor * weekIndex);
      
      // Génération des séances pour cette semaine
      const workouts = template.weeklyStructure.map((day: any) => {
        // Personnaliser la séance selon le jour, l'intensité, etc.
        const workout = this.generateWorkout(day, zones, weekIntensity, userProfile);
        
        // Ajouter les données de suivi
        workout.trackingData = {
          completed: false,
          metrics: {},
          notes: "",
          adaptations: []
        };
        
        return workout;
      });
      
      // Ajout de la semaine au programme
      weeks.push({
        weekNumber,
        theme: `Semaine ${weekNumber}: ${this.getWeekTheme(weekIndex, totalWeeks)}`,
        workouts,
        progressionFactor: weekIntensity
      });
    }
    
    return {
      name: template.name,
      description: `Programme personnalisé pour cycliste de niveau ${level}`,
      focus: template.focus,
      duration: totalWeeks,
      weeks,
      zones,
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
  }
  
  /**
   * Génération d'un thème pour chaque semaine
   */
  private getWeekTheme(weekIndex: number, totalWeeks: number): string {
    const phases = [
      'Adaptation',
      'Construction de base',
      'Développement',
      'Construction spécifique',
      'Intensification',
      'Pic de forme',
      'Affûtage',
      'Récupération'
    ];
    
    // Adapter le nombre de phases au nombre de semaines
    const phaseIndex = Math.floor((weekIndex / totalWeeks) * phases.length);
    return phases[Math.min(phaseIndex, phases.length - 1)];
  }
  
  /**
   * Génération d'une séance d'entraînement
   */
  private generateWorkout(day: any, zones: TrainingZones, weekIntensity: number, userProfile: UserProfile): any {
    // Type de base de la séance
    const { type, intensity } = day;
    
    // Conversion de l'intensité textuelle en valeur numérique
    const intensityFactors: Record<string, number> = {
      'low': 0.6,
      'medium': 0.8,
      'high': 1.0,
      'max': 1.2
    };
    
    const intensityFactor = intensityFactors[intensity] || 0.8;
    
    // Durée de base selon le niveau
    const baseDurations: Record<string, number> = {
      'beginner': 45,
      'intermediate': 60,
      'advanced': 75,
      'elite': 90
    };
    
    // Récupération du niveau et calcul de la durée de base
    const { level = 'intermediate' } = userProfile;
    let baseDuration = baseDurations[level] || 60;
    
    // Ajustement pour les types spécifiques
    if (type === 'long_ride' || type === 'long_climbing_ride') {
      baseDuration *= 1.5; // 50% plus long
    } else if (type === 'rest') {
      baseDuration = 0;
    } else if (type === 'active_recovery') {
      baseDuration *= 0.7; // 30% plus court
    }
    
    // Créer la structure de la séance selon le type
    let workout: any = {
      name: this.getWorkoutName(type, intensity),
      type,
      intensity: intensityFactor,
      targetDuration: Math.round(baseDuration * weekIntensity),
      description: this.getWorkoutDescription(type, intensity),
      structure: []
    };
    
    // Générer la structure selon le type de séance
    switch (type) {
      case 'rest':
        workout.structure = [{
          name: 'Repos',
          duration: 0,
          intensity: 0,
          description: 'Journée de récupération complète'
        }];
        break;
        
      case 'endurance':
        workout.structure = [{
          name: 'Échauffement',
          duration: Math.round(baseDuration * 0.1),
          intensity: zones.z1.max,
          description: 'Échauffement progressif'
        }, {
          name: 'Endurance',
          duration: Math.round(baseDuration * 0.8),
          intensity: intensity === 'low' ? zones.z2.min : 
                    intensity === 'medium' ? zones.z2.max : 
                    zones.z3.min,
          description: 'Effort constant en endurance'
        }, {
          name: 'Récupération',
          duration: Math.round(baseDuration * 0.1),
          intensity: zones.z1.max,
          description: 'Récupération active'
        }];
        break;
        
      case 'climbing_intervals':
      case 'power_intervals':
      case 'hiit':
        // Intervalles de haute intensité
        const intervalCount = intensity === 'low' ? 4 : 
                             intensity === 'medium' ? 6 : 
                             intensity === 'high' ? 8 : 10;
        
        const intervalDuration = intensity === 'low' ? 3 : 
                                intensity === 'medium' ? 2 : 
                                intensity === 'high' ? 1 : 0.5;
        
        const restDuration = intervalDuration * (intensity === 'max' ? 2 : 1.5);
        
        const intervalZone = type === 'climbing_intervals' ? zones.z4 :
                            type === 'power_intervals' ? zones.z5 :
                            zones.z6;
        
        workout.structure = [{
          name: 'Échauffement',
          duration: 10,
          intensity: zones.z2.max,
          description: 'Échauffement progressif'
        }];
        
        // Ajouter les intervalles
        for (let i = 0; i < intervalCount; i++) {
          workout.structure.push({
            name: `Intervalle ${i + 1}`,
            duration: intervalDuration,
            intensity: intervalZone.min + ((intervalZone.max - intervalZone.min) * intensityFactor),
            description: `Intervalle à haute intensité`
          }, {
            name: `Récupération ${i + 1}`,
            duration: restDuration,
            intensity: zones.z1.max,
            description: 'Récupération active entre les intervalles'
          });
        }
        
        workout.structure.push({
          name: 'Récupération finale',
          duration: 10,
          intensity: zones.z1.max,
          description: 'Récupération finale'
        });
        
        // Recalculer la durée totale
        workout.targetDuration = workout.structure.reduce((sum: number, segment: any) => 
          sum + segment.duration, 0);
        break;
        
      // Ajouter d'autres types selon les besoins
      default:
        // Structure par défaut
        workout.structure = [{
          name: 'Échauffement',
          duration: Math.round(baseDuration * 0.15),
          intensity: zones.z1.max,
          description: 'Échauffement progressif'
        }, {
          name: 'Corps principal',
          duration: Math.round(baseDuration * 0.7),
          intensity: zones.z2.max,
          description: 'Effort principal de la séance'
        }, {
          name: 'Récupération',
          duration: Math.round(baseDuration * 0.15),
          intensity: zones.z1.max,
          description: 'Récupération active'
        }];
        break;
    }
    
    return workout;
  }
  
  /**
   * Génération de noms de séances
   */
  private getWorkoutName(type: string, intensity: string): string {
    const typeNames: Record<string, string> = {
      'rest': 'Repos',
      'endurance': 'Endurance',
      'climbing_intervals': 'Intervalles en montée',
      'climbing_simulation': 'Simulation d\'ascension',
      'power_intervals': 'Intervalles de puissance',
      'threshold': 'Seuil',
      'active_recovery': 'Récupération active',
      'sprint_intervals': 'Intervalles de sprint',
      'sweet_spot': 'Sweet spot',
      'hiit': 'HIIT',
      'fasted_ride': 'Sortie à jeun',
      'tempo': 'Tempo',
      'long_ride': 'Sortie longue',
      'long_climbing_ride': 'Sortie longue en montagne',
      'specific': 'Entraînement spécifique',
      'vo2max': 'VO2 Max',
      'race_simulation': 'Simulation de course',
      'brick': 'Brick',
      'strength': 'Force'
    };
    
    const intensityNames: Record<string, string> = {
      'low': 'légère',
      'medium': 'modérée',
      'high': 'intense',
      'max': 'maximale'
    };
    
    const typeName = typeNames[type] || 'Entraînement';
    const intensityName = intensityNames[intensity] || '';
    
    return `${typeName}${intensityName ? ' ' + intensityName : ''}`;
  }
  
  /**
   * Génération de descriptions de séances
   */
  private getWorkoutDescription(type: string, intensity: string): string {
    // Descriptions de base par type
    const typeDescriptions: Record<string, string> = {
      'rest': 'Journée de repos complète pour favoriser la récupération.',
      'endurance': 'Développez votre endurance aérobie avec cet entraînement à intensité constante.',
      'climbing_intervals': 'Améliorez votre capacité à grimper avec ces intervalles en montée.',
      'climbing_simulation': 'Simulez une longue ascension pour préparer vos cols.',
      'power_intervals': 'Développez votre puissance maximale avec ces intervalles courts et intenses.',
      'threshold': 'Travaillez au seuil anaérobie pour améliorer votre performance.',
      'active_recovery': 'Séance légère pour favoriser la récupération active entre les entraînements intenses.',
      'sprint_intervals': 'Développez votre vitesse et puissance explosive avec ces sprints.',
      'sweet_spot': 'Entraînement en sweet spot, juste sous votre seuil, pour maximiser les gains.',
      'hiit': 'Intervalles à haute intensité pour améliorer votre VO2 max et votre puissance.',
      'fasted_ride': 'Sortie à jeun pour améliorer l\'utilisation des graisses comme source d\'énergie.',
      'tempo': 'Maintenez un rythme soutenu pour développer votre endurance aérobie.',
      'long_ride': 'Sortie longue pour développer votre endurance et votre résistance.',
      'long_climbing_ride': 'Sortie longue avec de nombreuses ascensions pour préparer les cols.',
      'specific': 'Entraînement spécifique adapté à votre objectif.',
      'vo2max': 'Développez votre capacité aérobie maximale avec ces intervalles intenses.',
      'race_simulation': 'Simulez les conditions de course pour préparer votre événement.',
      'brick': 'Enchaînement d\'activités pour préparer les transitions en compétition.',
      'strength': 'Développez votre force musculaire spécifique au cyclisme.'
    };
    
    // Ajustements d'intensité
    const intensityAdjustments: Record<string, string> = {
      'low': 'Intensité légère pour favoriser la récupération active et le développement de base.',
      'medium': 'Intensité modérée pour un développement équilibré de vos capacités.',
      'high': 'Haute intensité pour stimuler vos adaptations physiologiques maximales.',
      'max': 'Intensité maximale pour repousser vos limites et développer votre puissance.'
    };
    
    // Combinaison de la description de base et de l'ajustement d'intensité
    const baseDescription = typeDescriptions[type] || 'Séance d\'entraînement personnalisée.';
    const intensityDescription = intensityAdjustments[intensity] || '';
    
    return `${baseDescription} ${intensityDescription}`.trim();
  }
  
  /**
   * Programme de fallback en cas d'erreur
   */
  private getFallbackProgram(userProfile: UserProfile, goals: TrainingGoals): any {
    // Programme de base en cas d'échec de la génération
    return {
      name: 'Programme de base',
      description: 'Programme d\'endurance générale',
      focus: 'Développement aérobie',
      duration: 4,
      weeks: Array(4).fill(0).map((_, weekIndex) => ({
        weekNumber: weekIndex + 1,
        theme: `Semaine ${weekIndex + 1}`,
        workouts: [
          {
            name: 'Repos',
            type: 'rest',
            intensity: 0,
            targetDuration: 0,
            description: 'Journée de repos',
            structure: [{
              name: 'Repos',
              duration: 0,
              intensity: 0,
              description: 'Journée de récupération complète'
            }],
            trackingData: {
              completed: false,
              metrics: {},
              notes: "",
              adaptations: []
            }
          },
          {
            name: 'Endurance',
            type: 'endurance',
            intensity: 0.7,
            targetDuration: 60,
            description: 'Développez votre endurance de base',
            structure: [{
              name: 'Échauffement',
              duration: 10,
              intensity: 100,
              description: 'Échauffement progressif'
            }, {
              name: 'Endurance',
              duration: 40,
              intensity: 150,
              description: 'Effort constant en endurance'
            }, {
              name: 'Récupération',
              duration: 10,
              intensity: 100,
              description: 'Récupération active'
            }],
            trackingData: {
              completed: false,
              metrics: {},
              notes: "",
              adaptations: []
            }
          }
          // Autres séances simples par défaut
        ]
      })),
      zones: this.calculateTrainingZones(userProfile.ftp || 200),
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    };
  }
  
  /**
   * Génération d'un programme d'entraînement
   */
  public generateProgram(userProfile: UserProfile, goals: TrainingGoals) {
    try {
      // Déterminer la FTP
      const userFTP = userProfile.ftp || this.estimateFTP(userProfile);
      
      // Calculer les zones d'entraînement
      const zones = this.calculateTrainingZones(userFTP);
      
      // Trouver le template correspondant aux objectifs
      const template = this.findMatchingTemplate(goals);
      
      // Générer la progression
      const program = this.buildProgression(template, zones, userProfile);
      
      // Ajouter les données de suivi
      program.weeks.forEach((week: any) => {
        week.workouts.forEach((workout: any) => {
          workout.trackingData = {
            completed: false,
            metrics: {},
            notes: "",
            adaptations: []
          };
        });
      });
      
      return program;
    } catch (error) {
      console.error("Erreur lors de la génération du programme:", error);
      return this.getFallbackProgram(userProfile, goals);
    }
  }
  
  /**
   * Suivi de l'achèvement d'un entraînement
   */
  public trackWorkoutCompletion(programId: string, weekIndex: number, workoutIndex: number, completionData: CompletionData) {
    return apiClient.post(`/training/programs/${programId}/track`, {
      weekIndex,
      workoutIndex,
      completionData
    });
  }
  
  /**
   * Ajustement du programme en fonction des progrès
   */
  public adjustProgram(programId: string, userFTP: number, adjustmentFactor: number = 0) {
    return apiClient.post(`/training/programs/${programId}/adjust`, {
      userFTP,
      adjustmentFactor
    });
  }
  
  /**
   * Export du programme au format d'entraînement compatible (TCX, etc.)
   */
  public exportWorkout(programId: string, weekIndex: number, workoutIndex: number, format: string = 'tcx') {
    return apiClient.post(`/training/programs/${programId}/export`, {
      weekIndex,
      workoutIndex,
      format
    });
  }
}

export default ProgramGenerator;
