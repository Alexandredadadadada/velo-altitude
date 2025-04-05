/**
 * Service d'entraînement HIIT (High-Intensity Interval Training)
 * Génère et gère des programmes d'entraînement par intervalles à haute intensité
 */
const NodeCache = require('node-cache');
const logger = require('../utils/logger');
const trainingService = require('./training.service');

// Cache avec TTL de 24 heures
const hiitCache = new NodeCache({ stdTTL: 86400 });

/**
 * Service d'entraînement HIIT
 */
class HIITTrainingService {
  constructor() {
    this.cache = hiitCache;
    this.workoutTemplates = {
      tabata: {
        name: 'Tabata',
        description: 'Intervalles de 20 secondes d\'effort à intensité maximale suivis de 10 secondes de récupération',
        warmupTime: 300, // 5 minutes
        intervals: { work: 20, rest: 10 },
        sets: 8,
        rounds: 1,
        restBetweenRounds: 60,
        cooldownTime: 300, // 5 minutes
        intensity: 'max',
        targetZone: 5,
        terrain: 'any',
        totalTime: 640 // 10m40s
      },
      vo2max: {
        name: 'VO2max',
        description: 'Intervalles de 3-5 minutes à haute intensité pour développer votre capacité aérobie maximale',
        warmupTime: 600, // 10 minutes
        intervals: { work: 180, rest: 180 },
        sets: 5,
        rounds: 1,
        restBetweenRounds: 0,
        cooldownTime: 600, // 10 minutes
        intensity: 'high',
        targetZone: 5,
        terrain: 'flat',
        totalTime: 2400 // 40 minutes
      },
      pyramide: {
        name: 'Pyramide',
        description: 'Séance où la durée des intervalles augmente puis diminue',
        warmupTime: 600, // 10 minutes
        intervals: 'custom', // Défini dans createWorkout
        customIntervals: [
          { work: 30, rest: 30 },
          { work: 60, rest: 30 },
          { work: 90, rest: 45 },
          { work: 120, rest: 60 },
          { work: 90, rest: 45 },
          { work: 60, rest: 30 },
          { work: 30, rest: 30 }
        ],
        sets: 1,
        rounds: 1,
        restBetweenRounds: 0,
        cooldownTime: 600, // 10 minutes
        intensity: 'high',
        targetZone: 4,
        terrain: 'rolling',
        totalTime: 1830 // 30m30s
      },
      sprint: {
        name: 'Sprint',
        description: 'Sprints courts et intenses pour développer la puissance anaérobie',
        warmupTime: 600, // 10 minutes
        intervals: { work: 15, rest: 45 },
        sets: 10,
        rounds: 1,
        restBetweenRounds: 0,
        cooldownTime: 600, // 10 minutes
        intensity: 'max',
        targetZone: 6,
        terrain: 'flat',
        totalTime: 1200 // 20 minutes
      },
      threshold: {
        name: 'Sweet Spot',
        description: 'Intervalles au seuil pour améliorer l\'endurance et la puissance soutenue',
        warmupTime: 600, // 10 minutes
        intervals: { work: 480, rest: 120 },
        sets: 3,
        rounds: 1,
        restBetweenRounds: 0,
        cooldownTime: 600, // 10 minutes
        intensity: 'medium-high',
        targetZone: 4,
        terrain: 'flat',
        totalTime: 3000 // 50 minutes
      },
      microBurst: {
        name: 'Micro-Bursts',
        description: 'Série d\'intervalles très courts pour améliorer la capacité de récupération',
        warmupTime: 600, // 10 minutes
        intervals: { work: 15, rest: 15 },
        sets: 20,
        rounds: 2,
        restBetweenRounds: 300,
        cooldownTime: 600, // 10 minutes
        intensity: 'very-high',
        targetZone: 5,
        terrain: 'flat',
        totalTime: 2100 // 35 minutes
      }
    };
  }

  /**
   * Crée une séance HIIT personnalisée
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} params - Paramètres de la séance
   * @returns {Promise<Object>} - Séance HIIT créée
   */
  async createWorkout(userId, params = {}) {
    try {
      logger.info(`[HIITService] Création d'une séance HIIT pour l'utilisateur ${userId}`);
      
      // Récupérer le profil utilisateur pour la personnalisation
      const userProfile = await trainingService._getUserProfile(userId);
      
      // Déterminer le template à utiliser
      const template = params.template ? 
        this.workoutTemplates[params.template] : 
        this.chooseTemplate(params);
        
      if (!template) {
        throw new Error('Template HIIT non valide');
      }
      
      // Créer la séance HIIT de base
      const workout = this.generateWorkoutFromTemplate(template, params);
      
      // Ajouter métadonnées et personnalisation
      workout.id = `hiit_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      workout.userId = userId;
      workout.createdAt = new Date().toISOString();
      workout.name = params.name || template.name;
      workout.description = params.description || template.description;
      
      // Personnaliser la séance en fonction du niveau de l'utilisateur
      this.personalizeWorkout(workout, userProfile, params);
      
      // Sauvegarder la séance dans la base de données via le service d'entraînement
      return trainingService.saveWorkout(userId, workout);
    } catch (error) {
      logger.error(`[HIITService] Erreur lors de la création de la séance HIIT: ${error.message}`);
      throw new Error(`Échec de la création de la séance HIIT: ${error.message}`);
    }
  }

  /**
   * Génère une séance d'entraînement basée sur un modèle
   * @param {Object} template - Modèle de séance
   * @param {Object} params - Paramètres de personnalisation
   * @returns {Object} - Séance générée
   */
  generateWorkoutFromTemplate(template, params = {}) {
    const workout = {
      type: 'hiit',
      template: template.name.toLowerCase(),
      structure: {
        warmup: {
          duration: params.warmupTime || template.warmupTime,
          description: 'Échauffement progressif'
        },
        main: [],
        cooldown: {
          duration: params.cooldownTime || template.cooldownTime,
          description: 'Récupération active et retour au calme'
        }
      },
      intensity: params.intensity || template.intensity,
      targetZone: params.targetZone || template.targetZone,
      terrain: params.terrain || template.terrain,
      totalTime: 0
    };
    
    // Calculer la structure des intervalles
    if (template.intervals === 'custom' && template.customIntervals) {
      // Pour les séances avec des intervalles personnalisés (ex: pyramide)
      template.customIntervals.forEach((interval, index) => {
        workout.structure.main.push({
          set: 1,
          rep: index + 1,
          work: {
            duration: interval.work,
            intensity: template.intensity,
            zone: template.targetZone
          },
          rest: {
            duration: interval.rest,
            intensity: 'low',
            zone: 1
          }
        });
      });
    } else {
      // Pour les séances avec intervalles réguliers
      for (let round = 1; round <= (params.rounds || template.rounds); round++) {
        for (let set = 1; set <= (params.sets || template.sets); set++) {
          workout.structure.main.push({
            round,
            set,
            work: {
              duration: template.intervals.work,
              intensity: template.intensity,
              zone: template.targetZone
            },
            rest: {
              duration: template.intervals.rest,
              intensity: 'low',
              zone: 1
            }
          });
        }
        
        // Ajouter la récupération entre les rounds (sauf pour le dernier)
        if (round < (params.rounds || template.rounds)) {
          workout.structure.main.push({
            type: 'rest',
            duration: template.restBetweenRounds,
            description: 'Récupération entre les séries'
          });
        }
      }
    }
    
    // Calculer le temps total
    workout.totalTime = this.calculateTotalTime(workout, template);
    
    return workout;
  }

  /**
   * Personnalise une séance HIIT en fonction du niveau de l'utilisateur
   * @param {Object} workout - Séance HIIT
   * @param {Object} userProfile - Profil de l'utilisateur
   * @param {Object} params - Paramètres additionnels
   */
  personalizeWorkout(workout, userProfile, params = {}) {
    // Ajuster l'intensité en fonction du niveau
    const level = params.level || userProfile.fitnessLevel || 'intermediate';
    
    switch (level) {
      case 'beginner':
        // Réduire l'intensité et augmenter la récupération
        workout.structure.main = workout.structure.main.map(interval => {
          if (interval.work) {
            interval.work.intensity = this.decreaseIntensity(interval.work.intensity);
            interval.work.zone = Math.max(interval.work.zone - 1, 1);
            interval.rest.duration = Math.round(interval.rest.duration * 1.5);
          }
          return interval;
        });
        workout.difficultyLevel = 'beginner';
        break;
        
      case 'intermediate':
        // Garder les valeurs par défaut
        workout.difficultyLevel = 'intermediate';
        break;
        
      case 'advanced':
        // Augmenter l'intensité et réduire la récupération
        workout.structure.main = workout.structure.main.map(interval => {
          if (interval.work) {
            interval.work.intensity = this.increaseIntensity(interval.work.intensity);
            interval.work.zone = Math.min(interval.work.zone + 1, 7);
            interval.rest.duration = Math.round(interval.rest.duration * 0.8);
          }
          return interval;
        });
        workout.difficultyLevel = 'advanced';
        break;
        
      case 'elite':
        // Maximiser l'intensité et minimiser la récupération
        workout.structure.main = workout.structure.main.map(interval => {
          if (interval.work) {
            interval.work.intensity = 'max';
            interval.work.zone = Math.min(interval.work.zone + 2, 7);
            interval.rest.duration = Math.round(interval.rest.duration * 0.6);
          }
          return interval;
        });
        workout.difficultyLevel = 'elite';
        break;
    }
    
    // Recalculer le temps total après personnalisation
    workout.totalTime = this.calculateTotalTime(workout);
  }

  /**
   * Augmente le niveau d'intensité
   * @param {string} intensity - Niveau d'intensité actuel
   * @returns {string} - Nouveau niveau d'intensité
   */
  increaseIntensity(intensity) {
    const levels = ['low', 'medium', 'medium-high', 'high', 'very-high', 'max'];
    const currentIndex = levels.indexOf(intensity);
    
    if (currentIndex === -1 || currentIndex === levels.length - 1) {
      return intensity;
    }
    
    return levels[currentIndex + 1];
  }

  /**
   * Diminue le niveau d'intensité
   * @param {string} intensity - Niveau d'intensité actuel
   * @returns {string} - Nouveau niveau d'intensité
   */
  decreaseIntensity(intensity) {
    const levels = ['low', 'medium', 'medium-high', 'high', 'very-high', 'max'];
    const currentIndex = levels.indexOf(intensity);
    
    if (currentIndex <= 0) {
      return intensity;
    }
    
    return levels[currentIndex - 1];
  }

  /**
   * Calcule le temps total de la séance
   * @param {Object} workout - Séance HIIT
   * @returns {number} - Temps total en secondes
   */
  calculateTotalTime(workout) {
    let total = workout.structure.warmup.duration + workout.structure.cooldown.duration;
    
    // Ajouter la durée des intervalles
    workout.structure.main.forEach(interval => {
      if (interval.work && interval.rest) {
        total += interval.work.duration + interval.rest.duration;
      } else if (interval.type === 'rest') {
        total += interval.duration;
      }
    });
    
    return total;
  }

  /**
   * Choisit un modèle adapté aux paramètres fournis
   * @param {Object} params - Paramètres de la séance
   * @returns {Object} - Modèle choisi
   */
  chooseTemplate(params = {}) {
    // Si un objectif spécifique est fourni
    if (params.goal) {
      switch (params.goal.toLowerCase()) {
        case 'power':
          return this.workoutTemplates.tabata;
        case 'endurance':
          return this.workoutTemplates.threshold;
        case 'vo2max':
          return this.workoutTemplates.vo2max;
        case 'sprint':
          return this.workoutTemplates.sprint;
        case 'recovery':
          return this.workoutTemplates.microBurst;
      }
    }
    
    // Si une durée maximale est fournie
    if (params.maxDuration) {
      const maxDuration = parseInt(params.maxDuration, 10);
      
      // Filtrer les templates par durée
      const eligibleTemplates = Object.values(this.workoutTemplates)
        .filter(template => template.totalTime <= maxDuration);
      
      if (eligibleTemplates.length > 0) {
        // Retourner le template le plus long dans la limite de temps
        return eligibleTemplates.sort((a, b) => b.totalTime - a.totalTime)[0];
      }
    }
    
    // Par défaut, retourner la séance Tabata
    return this.workoutTemplates.tabata;
  }

  /**
   * Génère un plan d'entraînement HIIT sur plusieurs semaines
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} params - Paramètres du plan
   * @returns {Promise<Object>} - Plan d'entraînement HIIT
   */
  async generateProgram(userId, params = {}) {
    try {
      logger.info(`[HIITService] Génération d'un programme HIIT pour l'utilisateur ${userId}`);
      
      const userProfile = await trainingService._getUserProfile(userId);
      const duration = params.duration || 4; // Nombre de semaines
      const sessionsPerWeek = params.sessionsPerWeek || 2; // Séances HIIT par semaine
      
      // Créer la structure du programme
      const program = {
        id: `hiit_prog_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        userId,
        name: params.name || 'Programme HIIT progressif',
        description: params.description || 'Programme d\'entraînement HIIT sur plusieurs semaines avec progression adaptée',
        createdAt: new Date().toISOString(),
        duration,
        sessionsPerWeek,
        goal: params.goal || 'general',
        level: params.level || userProfile.fitnessLevel || 'intermediate',
        weeks: []
      };
      
      // Générer le programme semaine par semaine
      for (let week = 1; week <= duration; week++) {
        const weekPlan = {
          week,
          sessions: []
        };
        
        // Déterminer la progression
        const progression = this.calculateProgression(week, duration, params.level || userProfile.fitnessLevel);
        
        // Générer les séances de la semaine
        for (let session = 1; session <= sessionsPerWeek; session++) {
          const sessionTemplate = this.selectSessionForWeek(week, session, program.goal);
          
          // Créer la séance adaptée à la semaine
          const workoutTemplate = this.workoutTemplates[sessionTemplate];
          
          if (workoutTemplate) {
            // Adapter la séance à la progression
            const adaptedWorkout = this.adaptWorkoutToProgression(workoutTemplate, progression);
            
            weekPlan.sessions.push({
              day: this.suggestDayForSession(session, sessionsPerWeek),
              template: sessionTemplate,
              name: workoutTemplate.name,
              description: workoutTemplate.description,
              duration: adaptedWorkout.totalTime,
              intensity: adaptedWorkout.intensity,
              detailsId: `w${week}_s${session}` // ID pour référence future
            });
          }
        }
        
        program.weeks.push(weekPlan);
      }
      
      // Sauvegarder le programme
      return trainingService.saveProgram(userId, program);
    } catch (error) {
      logger.error(`[HIITService] Erreur lors de la génération du programme HIIT: ${error.message}`);
      throw new Error(`Échec de la génération du programme HIIT: ${error.message}`);
    }
  }

  /**
   * Calcule la progression pour une semaine donnée
   * @param {number} week - Numéro de semaine actuelle
   * @param {number} totalWeeks - Nombre total de semaines
   * @param {string} level - Niveau de l'utilisateur
   * @returns {Object} - Facteurs de progression
   */
  calculateProgression(week, totalWeeks, level = 'intermediate') {
    // Facteurs de base
    const baseProgression = {
      intensityFactor: 1.0,
      durationFactor: 1.0,
      recoveryFactor: 1.0
    };
    
    // Calculer la progression en fonction de la semaine
    const progressPercentage = (week - 1) / (totalWeeks - 1);
    
    // Ajuster les facteurs en fonction du niveau et de la progression
    switch (level) {
      case 'beginner':
        // Progression plus lente et plus de récupération
        baseProgression.intensityFactor += progressPercentage * 0.2;
        baseProgression.durationFactor += progressPercentage * 0.3;
        baseProgression.recoveryFactor -= progressPercentage * 0.1;
        break;
        
      case 'intermediate':
        // Progression équilibrée
        baseProgression.intensityFactor += progressPercentage * 0.3;
        baseProgression.durationFactor += progressPercentage * 0.4;
        baseProgression.recoveryFactor -= progressPercentage * 0.2;
        break;
        
      case 'advanced':
        // Progression rapide et moins de récupération
        baseProgression.intensityFactor += progressPercentage * 0.4;
        baseProgression.durationFactor += progressPercentage * 0.5;
        baseProgression.recoveryFactor -= progressPercentage * 0.3;
        break;
        
      case 'elite':
        // Progression maximale
        baseProgression.intensityFactor += progressPercentage * 0.5;
        baseProgression.durationFactor += progressPercentage * 0.6;
        baseProgression.recoveryFactor -= progressPercentage * 0.4;
        break;
    }
    
    // S'assurer que les facteurs restent dans des limites raisonnables
    baseProgression.intensityFactor = Math.min(baseProgression.intensityFactor, 1.5);
    baseProgression.durationFactor = Math.min(baseProgression.durationFactor, 1.8);
    baseProgression.recoveryFactor = Math.max(baseProgression.recoveryFactor, 0.6);
    
    return baseProgression;
  }

  /**
   * Sélectionne un type de séance adapté à une semaine et session spécifique
   * @param {number} week - Numéro de la semaine
   * @param {number} session - Numéro de la session dans la semaine
   * @param {string} goal - Objectif global du programme
   * @returns {string} - Clé du template de séance
   */
  selectSessionForWeek(week, session, goal) {
    // Tableau de progression des séances pour différents objectifs
    const progressions = {
      general: [
        ['tabata', 'vo2max', 'threshold', 'sprint'],
        ['microBurst', 'tabata', 'pyramide', 'threshold'],
        ['sprint', 'threshold', 'vo2max', 'microBurst'],
        ['vo2max', 'pyramide', 'sprint', 'tabata']
      ],
      power: [
        ['sprint', 'tabata', 'microBurst', 'vo2max'],
        ['tabata', 'vo2max', 'sprint', 'pyramide'],
        ['microBurst', 'sprint', 'tabata', 'threshold'],
        ['sprint', 'tabata', 'vo2max', 'microBurst']
      ],
      endurance: [
        ['threshold', 'pyramide', 'vo2max', 'microBurst'],
        ['vo2max', 'threshold', 'pyramide', 'tabata'],
        ['threshold', 'vo2max', 'microBurst', 'pyramide'],
        ['pyramide', 'threshold', 'vo2max', 'sprint']
      ]
    };
    
    // Utiliser la progression générale si l'objectif n'est pas reconnu
    const targetProgression = progressions[goal] || progressions.general;
    
    // Sélectionner la progression pour la semaine actuelle (en boucle si nécessaire)
    const weekIndex = (week - 1) % targetProgression.length;
    const sessionOptions = targetProgression[weekIndex];
    
    // Sélectionner la séance pour la session actuelle (en boucle si nécessaire)
    const sessionIndex = (session - 1) % sessionOptions.length;
    
    return sessionOptions[sessionIndex];
  }

  /**
   * Adapte une séance en fonction des facteurs de progression
   * @param {Object} template - Template de la séance
   * @param {Object} progression - Facteurs de progression
   * @returns {Object} - Séance adaptée
   */
  adaptWorkoutToProgression(template, progression) {
    const adapted = JSON.parse(JSON.stringify(template)); // Deep clone
    
    // Ajuster la durée des efforts
    if (adapted.intervals !== 'custom') {
      adapted.intervals.work = Math.ceil(adapted.intervals.work * progression.durationFactor);
      adapted.intervals.rest = Math.ceil(adapted.intervals.rest * progression.recoveryFactor);
    } else if (adapted.customIntervals) {
      adapted.customIntervals = adapted.customIntervals.map(interval => ({
        work: Math.ceil(interval.work * progression.durationFactor),
        rest: Math.ceil(interval.rest * progression.recoveryFactor)
      }));
    }
    
    // Ajuster le nombre de répétitions
    adapted.sets = Math.ceil(adapted.sets * progression.durationFactor);
    
    // Ajuster l'intensité (on ne peut pas directement multiplier)
    if (progression.intensityFactor > 1.2) {
      adapted.intensity = this.increaseIntensity(adapted.intensity);
      adapted.targetZone = Math.min(adapted.targetZone + 1, 7);
    }
    
    // Recalculer le temps total
    adapted.totalTime = this.calculateAdaptedTotalTime(adapted);
    
    return adapted;
  }

  /**
   * Calcule le temps total d'une séance adaptée
   * @param {Object} adapted - Séance adaptée
   * @returns {number} - Temps total en secondes
   */
  calculateAdaptedTotalTime(adapted) {
    let total = adapted.warmupTime + adapted.cooldownTime;
    
    if (adapted.intervals === 'custom' && adapted.customIntervals) {
      adapted.customIntervals.forEach(interval => {
        total += interval.work + interval.rest;
      });
    } else {
      const intervalsTime = (adapted.intervals.work + adapted.intervals.rest) * adapted.sets;
      total += intervalsTime * adapted.rounds;
      
      // Ajouter le temps de récupération entre les rounds
      if (adapted.rounds > 1) {
        total += adapted.restBetweenRounds * (adapted.rounds - 1);
      }
    }
    
    return total;
  }

  /**
   * Suggère un jour optimal pour une séance dans la semaine
   * @param {number} session - Numéro de la session dans la semaine
   * @param {number} totalSessions - Nombre total de sessions par semaine
   * @returns {string} - Jour suggéré (ex: 'lundi')
   */
  suggestDayForSession(session, totalSessions) {
    const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    
    if (totalSessions === 1) {
      return days[2]; // Mercredi
    }
    
    if (totalSessions === 2) {
      return session === 1 ? days[1] : days[4]; // Mardi et vendredi
    }
    
    if (totalSessions === 3) {
      return session === 1 ? days[1] : (session === 2 ? days[3] : days[5]); // Mardi, jeudi, samedi
    }
    
    // Pour plus de 3 sessions, répartir uniformément
    const interval = Math.floor(7 / totalSessions);
    const dayIndex = ((session - 1) * interval) % 7;
    
    return days[dayIndex];
  }

  /**
   * Récupère toutes les séances HIIT disponibles
   * @returns {Array<Object>} - Liste des templates de séances HIIT
   */
  getAvailableWorkouts() {
    return Object.entries(this.workoutTemplates).map(([key, template]) => ({
      id: key,
      name: template.name,
      description: template.description,
      duration: template.totalTime,
      intensity: template.intensity,
      targetZone: template.targetZone,
      terrain: template.terrain
    }));
  }
}

// Exporter une instance singleton
const hiitTrainingService = new HIITTrainingService();
module.exports = hiitTrainingService;
