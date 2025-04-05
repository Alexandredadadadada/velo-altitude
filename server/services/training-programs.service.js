/**
 * Service de programmes d'entraînement
 * Génère des programmes d'entraînement personnalisés basés sur différents paramètres
 */

const logger = require('../utils/logger');
const cacheService = require('./cache.service');
const trainingZonesService = require('./training-zones.service');

/**
 * Service de programmes d'entraînement
 */
class TrainingProgramsService {
  constructor() {
    this.programTemplates = {
      endurance: {
        name: "Programme d'endurance de base",
        description: "Développe les capacités d'endurance fondamentale",
        weeklyHours: {
          min: 6,
          default: 8,
          max: 12
        },
        phaseDuration: 4, // semaines
        phases: [
          {
            name: "Développement de l'endurance de base",
            focusAreas: ["Endurance aérobie", "Économie de pédalage"],
            workoutTemplates: [
              {
                type: "Sortie longue",
                description: "Sortie à intensité modérée pour développer l'endurance de base",
                zoneRange: { min: 1, max: 2 },
                duration: { min: 120, default: 180, max: 240 }, // minutes
                frequency: 1, // par semaine
                parameters: {
                  cadence: "Variée, 80-95 rpm",
                  terrain: "Plat à vallonné",
                  focusPoints: ["Économie de pédalage", "Alimentation pendant l'effort"]
                }
              },
              {
                type: "Endurance tempo",
                description: "Travail de l'endurance à intensité moyenne",
                zoneRange: { min: 2, max: 3 },
                duration: { min: 60, default: 90, max: 120 },
                frequency: 2,
                parameters: {
                  cadence: "90-100 rpm",
                  terrain: "Vallonné",
                  focusPoints: ["Régularité de l'effort", "Respiration"]
                }
              },
              {
                type: "Récupération active",
                description: "Sortie très légère pour favoriser la récupération",
                zoneRange: { min: 1, max: 1 },
                duration: { min: 30, default: 45, max: 60 },
                frequency: 1,
                parameters: {
                  cadence: "Élevée, >95 rpm",
                  terrain: "Plat",
                  focusPoints: ["Technique de pédalage", "Relaxation"]
                }
              }
            ]
          }
        ]
      },
      
      performance: {
        name: "Programme de performance",
        description: "Améliore les performances en compétition",
        weeklyHours: {
          min: 8,
          default: 10,
          max: 15
        },
        phaseDuration: 3, // semaines
        phases: [
          {
            name: "Développement de la puissance",
            focusAreas: ["Seuil", "VO2max", "Force"],
            workoutTemplates: [
              {
                type: "Sortie longue avec intervalles",
                description: "Sortie longue incluant des efforts au seuil",
                zoneRange: { min: 2, max: 4 },
                duration: { min: 120, default: 180, max: 240 },
                frequency: 1,
                parameters: {
                  cadence: "Variée selon les segments",
                  terrain: "Vallonné avec quelques montées",
                  intervals: [
                    { duration: 8, intensity: 4, recovery: 4, repetitions: 4 }
                  ]
                }
              },
              {
                type: "Intervalles haute intensité",
                description: "Développement du VO2max et de la tolérance au lactate",
                zoneRange: { min: 5, max: 6 },
                duration: { min: 60, default: 75, max: 90 },
                frequency: 1,
                parameters: {
                  cadence: "90-105 rpm",
                  terrain: "Plat ou montée régulière",
                  intervals: [
                    { duration: 3, intensity: 5, recovery: 3, repetitions: 6 },
                    { duration: 1, intensity: 6, recovery: 1, repetitions: 10 }
                  ]
                }
              },
              {
                type: "Sweet spot",
                description: "Entraînement juste sous le seuil pour développer l'endurance au seuil",
                zoneRange: { min: 3, max: 4 },
                duration: { min: 60, default: 90, max: 120 },
                frequency: 1,
                parameters: {
                  cadence: "85-95 rpm",
                  terrain: "Plat à vallonné",
                  intervals: [
                    { duration: 15, intensity: 3.5, recovery: 5, repetitions: 3 }
                  ]
                }
              },
              {
                type: "Récupération",
                description: "Récupération active",
                zoneRange: { min: 1, max: 1 },
                duration: { min: 30, default: 40, max: 60 },
                frequency: 1,
                parameters: {
                  cadence: ">95 rpm",
                  terrain: "Plat",
                  focusPoints: ["Relaxation", "Technique"]
                }
              }
            ]
          }
        ]
      },
      
      climbing: {
        name: "Programme de grimpeur",
        description: "Améliore les capacités en montagne",
        weeklyHours: {
          min: 7,
          default: 9,
          max: 14
        },
        phaseDuration: 4,
        phases: [
          {
            name: "Développement de la force en montée",
            focusAreas: ["Force", "Endurance en montée", "Gestion de l'effort"],
            workoutTemplates: [
              {
                type: "Sortie en montagne",
                description: "Sortie longue avec dénivelé significatif",
                zoneRange: { min: 2, max: 4 },
                duration: { min: 120, default: 180, max: 240 },
                frequency: 1,
                parameters: {
                  cadence: "Variée, adaptée au terrain",
                  terrain: "Montagneux",
                  focusPoints: ["Gestion de l'effort en montée", "Position sur le vélo"]
                }
              },
              {
                type: "Répétitions de côtes",
                description: "Intervalles en montée pour développer la force et la puissance",
                zoneRange: { min: 4, max: 5 },
                duration: { min: 60, default: 90, max: 120 },
                frequency: 1,
                parameters: {
                  cadence: "60-80 rpm (force) et 90-100 rpm (vélocité)",
                  terrain: "Côtes de 5-8% sur 3-5 minutes",
                  intervals: [
                    { duration: 4, intensity: 4, recovery: 4, repetitions: 5 }
                  ]
                }
              },
              {
                type: "Sweet spot en montée",
                description: "Travail au sweet spot sur terrain vallonné",
                zoneRange: { min: 3, max: 4 },
                duration: { min: 60, default: 90, max: 120 },
                frequency: 1,
                parameters: {
                  cadence: "80-90 rpm",
                  terrain: "Vallonné avec montées moyennes",
                  intervals: [
                    { duration: 10, intensity: 3.5, recovery: 5, repetitions: 3 }
                  ]
                }
              },
              {
                type: "Récupération",
                description: "Récupération active sur terrain plat",
                zoneRange: { min: 1, max: 1 },
                duration: { min: 30, default: 45, max: 60 },
                frequency: 1,
                parameters: {
                  cadence: ">95 rpm",
                  terrain: "Plat",
                  focusPoints: ["Récupération", "Technique"]
                }
              }
            ]
          }
        ]
      }
    };
  }

  /**
   * Génère un programme d'entraînement personnalisé
   * @param {Object} userProfile - Profil de l'utilisateur
   * @param {Object} parameters - Paramètres du programme
   * @returns {Promise<Object>} - Programme d'entraînement généré
   */
  async generateProgram(userProfile, parameters) {
    try {
      const cacheKey = `training:program:${userProfile.id}:${JSON.stringify(parameters)}`;
      const cachedProgram = await cacheService.get(cacheKey);
      
      if (cachedProgram) {
        logger.debug(`[TrainingProgramsService] Programme récupéré depuis le cache pour l'utilisateur ${userProfile.id}`);
        return cachedProgram;
      }
      
      logger.info(`[TrainingProgramsService] Génération d'un programme pour l'utilisateur ${userProfile.id}`);
      
      // Sélectionner le template en fonction du type de programme demandé
      const programType = parameters.type || 'endurance';
      const template = this.programTemplates[programType];
      
      if (!template) {
        throw new Error(`Type de programme non pris en charge: ${programType}`);
      }
      
      // Récupérer les zones d'entraînement de l'utilisateur
      let trainingZones;
      if (userProfile.ftp) {
        trainingZones = trainingZonesService.calculatePowerZones(userProfile.ftp);
      } else if (userProfile.hrMax) {
        trainingZones = trainingZonesService.calculateHeartRateZones(userProfile.hrMax);
      } else {
        // Zones par défaut si aucune donnée utilisateur n'est disponible
        trainingZones = trainingZonesService.getDefaultZones();
      }
      
      // Ajuster la durée hebdomadaire en fonction des disponibilités
      const availableHours = parameters.weeklyHours || template.weeklyHours.default;
      const weeklyHours = Math.min(
        Math.max(availableHours, template.weeklyHours.min), 
        template.weeklyHours.max
      );
      
      // Facteur d'ajustement pour la durée des séances
      const durationFactor = weeklyHours / template.weeklyHours.default;
      
      // Générer le programme pour la phase actuelle
      const currentPhase = template.phases[0]; // Pour cette version, on utilise seulement la première phase
      
      // Générer les séances hebdomadaires
      const weeklyWorkouts = [];
      let totalMinutes = 0;
      
      // Créer une copie des templates de séances pour ce programme
      const workoutTemplates = JSON.parse(JSON.stringify(currentPhase.workoutTemplates));
      
      // Trier les séances par priorité (les plus intenses d'abord)
      workoutTemplates.sort((a, b) => b.zoneRange.max - a.zoneRange.max);
      
      // Distribuer les séances dans la semaine
      for (const template of workoutTemplates) {
        for (let i = 0; i < template.frequency; i++) {
          // Ajuster la durée en fonction du facteur d'ajustement tout en respectant les limites
          let adjustedDuration = Math.round(template.duration.default * durationFactor);
          adjustedDuration = Math.min(
            Math.max(adjustedDuration, template.duration.min),
            template.duration.default
          );
          
          // Créer la séance
          const workout = {
            type: template.type,
            description: template.description,
            duration: adjustedDuration,
            intensityZone: {
              min: template.zoneRange.min,
              max: template.zoneRange.max,
              description: this._getZoneDescription(template.zoneRange, trainingZones)
            },
            parameters: template.parameters
          };
          
          weeklyWorkouts.push(workout);
          totalMinutes += adjustedDuration;
        }
      }
      
      // Distribuer les séances sur les jours de la semaine selon les préférences
      const weekDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
      const preferredDays = parameters.preferredDays || weekDays;
      const scheduledWorkouts = {};
      
      // Trier les séances par durée (les plus longues d'abord)
      weeklyWorkouts.sort((a, b) => b.duration - a.duration);
      
      // Planifier les séances sur les jours préférés
      for (let i = 0; i < weeklyWorkouts.length; i++) {
        const dayIndex = i % preferredDays.length;
        const day = preferredDays[dayIndex];
        
        if (!scheduledWorkouts[day]) {
          scheduledWorkouts[day] = [];
        }
        
        scheduledWorkouts[day].push(weeklyWorkouts[i]);
      }
      
      // Créer le programme final
      const program = {
        id: `prog_${Date.now()}_${userProfile.id.substring(0, 6)}`,
        userId: userProfile.id,
        name: `Programme ${template.name} personnalisé`,
        type: programType,
        description: template.description,
        weeklyHours: Math.round(totalMinutes / 60 * 10) / 10, // Arrondi à 1 décimale
        weeklyWorkouts: scheduledWorkouts,
        createdAt: new Date().toISOString(),
        trainingZones: trainingZones,
        duration: parameters.duration || (template.phaseDuration * 7), // en jours
        focusAreas: currentPhase.focusAreas,
        progressionStrategy: {
          initialWeek: "Semaine d'adaptation avec intensité réduite de 10%",
          weeklyProgression: "Augmentation progressive du volume et de l'intensité",
          peakWeek: "Réduction du volume de 30% mais maintien de l'intensité pour la surcompensation"
        },
        nutritionRecommendations: {
          onTrainingDays: "Augmenter l'apport en glucides les jours d'entraînement intense",
          recovery: "Privilégier les protéines après les séances intenses pour la récupération",
          hydration: "0.5-0.75L d'eau par heure d'entraînement, plus en conditions chaudes"
        },
        notes: parameters.notes || []
      };
      
      // Mettre en cache pour 7 jours
      await cacheService.set(cacheKey, program, 7 * 86400);
      
      logger.info(`[TrainingProgramsService] Programme généré avec succès pour l'utilisateur ${userProfile.id}`);
      return program;
    } catch (error) {
      logger.error(`[TrainingProgramsService] Erreur lors de la génération du programme: ${error.message}`);
      throw new Error(`Échec de la génération du programme d'entraînement: ${error.message}`);
    }
  }

  /**
   * Obtient une description textuelle des zones d'intensité
   * @private
   * @param {Object} zoneRange - Plage de zones
   * @param {Array} trainingZones - Zones d'entraînement
   * @returns {string} Description des zones
   */
  _getZoneDescription(zoneRange, trainingZones) {
    if (zoneRange.min === zoneRange.max) {
      return trainingZones[zoneRange.min - 1]?.name || `Zone ${zoneRange.min}`;
    }
    
    const minZone = trainingZones[zoneRange.min - 1]?.name || `Zone ${zoneRange.min}`;
    const maxZone = trainingZones[zoneRange.max - 1]?.name || `Zone ${zoneRange.max}`;
    
    return `${minZone} à ${maxZone}`;
  }
}

module.exports = new TrainingProgramsService();
