/**
 * Service d'assistant virtuel pour l'entraînement (Virtual Coach)
 * Utilise l'API Claude pour fournir des conseils personnalisés et répondre aux questions
 */

const ClaudeApiService = require('./claude-api.service');
const TrainingService = require('./training.service');
const NutritionService = require('./nutrition.service');
const PerformanceAnalysisService = require('./performance-analysis.service');
const CacheService = require('./cache.service');
const fs = require('fs').promises;
const path = require('path');

// Durée de cache par type de requête
const CACHE_TTL = {
  question: 86400, // 24 heures pour les questions générales
  personalizedAdvice: 3600, // 1 heure pour les conseils personnalisés
  workoutReview: 86400, // 24 heures pour les analyses d'entraînement
  planAdjustment: 3600 // 1 heure pour les ajustements de plan
};

/**
 * Service d'assistant virtuel pour l'entraînement
 */
class VirtualCoachService {
  /**
   * Répond à une question sur l'entraînement, la nutrition ou la performance
   * @param {Object} questionData - Données de la question
   * @param {string} questionData.userId - ID de l'utilisateur
   * @param {string} questionData.question - Question posée
   * @param {string} questionData.domain - Domaine de la question (training, nutrition, performance, general)
   * @param {boolean} questionData.includeUserContext - Inclure le contexte utilisateur
   * @returns {Object} Réponse de l'assistant virtuel
   */
  static async answerQuestion(questionData) {
    try {
      const { userId, question, domain = 'general', includeUserContext = true } = questionData;
      
      // Valider les données d'entrée
      if (!question || question.trim().length < 5) {
        throw new Error('Question trop courte ou invalide');
      }

      // Générer une clé de cache unique
      const cacheKey = `virtual_coach_q_${userId}_${this._generateHash(question)}_${domain}_${includeUserContext}`;
      
      // Vérifier dans le cache
      const cachedResponse = CacheService.getCache().get(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }

      // Construire le contexte utilisateur si demandé
      let userContext = '';
      if (includeUserContext) {
        userContext = await this._buildUserContext(userId, domain);
      }

      // Construire le prompt pour Claude
      const prompt = this._buildQuestionPrompt(question, domain, userContext);

      // Appeler Claude API
      const claudeResponse = await ClaudeApiService.generateCompletion({
        prompt,
        max_tokens: 1000,
        temperature: 0.7,
        model: process.env.CLAUDE_MODEL || 'claude-2.0'
      });

      // Formater la réponse
      const response = {
        question,
        answer: claudeResponse.completion.trim(),
        domain,
        timestamp: new Date().toISOString(),
        sources: this._extractSources(claudeResponse.completion),
        confidence: this._estimateConfidence(claudeResponse.completion)
      };

      // Mise en cache
      CacheService.getCache().set(cacheKey, response, CACHE_TTL.question);

      return response;
    } catch (error) {
      console.error(`Erreur lors de la réponse à la question: ${error.message}`);
      throw new Error(`Impossible de répondre à la question: ${error.message}`);
    }
  }

  /**
   * Génère un conseil personnalisé basé sur les données récentes de l'utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} options - Options de génération
   * @returns {Object} Conseil personnalisé
   */
  static async generatePersonalizedAdvice(userId, options = {}) {
    try {
      // Paramètres par défaut
      const defaults = {
        focusArea: 'general', // general, endurance, intensity, recovery, nutrition
        lookbackPeriod: 30, // jours
        targetEventId: null // Si on souhaite se focaliser sur un événement
      };
      
      // Fusionner avec les options fournies
      const adviceOptions = { ...defaults, ...options };
      
      // Générer une clé de cache unique
      const cacheKey = `virtual_coach_advice_${userId}_${adviceOptions.focusArea}_${adviceOptions.lookbackPeriod}_${adviceOptions.targetEventId || 'none'}`;
      
      // Vérifier dans le cache
      const cachedAdvice = CacheService.getCache().get(cacheKey);
      if (cachedAdvice) {
        return cachedAdvice;
      }

      // Collecter les données pour l'analyse
      const userData = await this._collectUserDataForAdvice(userId, adviceOptions);
      
      // Construire le prompt pour Claude
      const prompt = this._buildAdvicePrompt(userData, adviceOptions);

      // Appeler Claude API
      const claudeResponse = await ClaudeApiService.generateCompletion({
        prompt,
        max_tokens: 1500,
        temperature: 0.7,
        model: process.env.CLAUDE_MODEL || 'claude-2.0'
      });

      // Extraire et structurer le conseil
      const structuredAdvice = this._structureAdviceResponse(claudeResponse.completion);
      
      // Format de réponse
      const advice = {
        userId,
        timestamp: new Date().toISOString(),
        focusArea: adviceOptions.focusArea,
        overview: structuredAdvice.overview,
        insights: structuredAdvice.insights,
        recommendations: structuredAdvice.recommendations,
        nextSteps: structuredAdvice.nextSteps,
        dataAnalyzed: {
          period: `${adviceOptions.lookbackPeriod} jours`,
          activityCount: userData.activities.length,
          metrics: Object.keys(userData.metrics || {})
        }
      };

      // Mise en cache
      CacheService.getCache().set(cacheKey, advice, CACHE_TTL.personalizedAdvice);

      return advice;
    } catch (error) {
      console.error(`Erreur lors de la génération de conseil personnalisé: ${error.message}`);
      throw new Error(`Impossible de générer un conseil personnalisé: ${error.message}`);
    }
  }

  /**
   * Analyse un entraînement spécifique et fournit des commentaires
   * @param {string} userId - ID de l'utilisateur
   * @param {string} activityId - ID de l'activité
   * @param {Object} options - Options d'analyse
   * @returns {Object} Analyse de l'entraînement
   */
  static async analyzeWorkout(userId, activityId, options = {}) {
    try {
      // Paramètres par défaut
      const defaults = {
        detailLevel: 'standard', // basic, standard, detailed
        compareToPrevious: true,
        focusAreas: ['technique', 'intensity', 'pacing', 'efficiency']
      };
      
      // Fusionner avec les options fournies
      const analysisOptions = { ...defaults, ...options };
      
      // Générer une clé de cache unique
      const cacheKey = `virtual_coach_workout_${userId}_${activityId}_${analysisOptions.detailLevel}`;
      
      // Vérifier dans le cache
      const cachedAnalysis = CacheService.getCache().get(cacheKey);
      if (cachedAnalysis) {
        return cachedAnalysis;
      }

      // Récupérer les données de l'activité
      const activity = await TrainingService.getActivityById(userId, activityId);
      if (!activity) {
        throw new Error('Activité non trouvée');
      }
      
      // Récupérer des activités précédentes similaires pour comparaison si demandé
      let previousActivities = [];
      if (analysisOptions.compareToPrevious) {
        previousActivities = await TrainingService.getSimilarActivities(userId, activity, 3);
      }
      
      // Récupérer le contexte utilisateur
      const userProfile = await TrainingService.getUserProfile(userId);
      
      // Construire le prompt pour Claude
      const prompt = this._buildWorkoutAnalysisPrompt(
        activity,
        previousActivities,
        userProfile,
        analysisOptions
      );

      // Appeler Claude API
      const claudeResponse = await ClaudeApiService.generateCompletion({
        prompt,
        max_tokens: 1500,
        temperature: 0.7,
        model: process.env.CLAUDE_MODEL || 'claude-2.0'
      });

      // Extraire et structurer l'analyse
      const structuredAnalysis = this._structureWorkoutAnalysis(claudeResponse.completion);
      
      // Format de réponse
      const analysis = {
        userId,
        activityId,
        activityName: activity.name,
        activityDate: activity.date,
        timestamp: new Date().toISOString(),
        overview: structuredAnalysis.overview,
        strengths: structuredAnalysis.strengths,
        improvements: structuredAnalysis.improvements,
        metrics: structuredAnalysis.metrics,
        recommendations: structuredAnalysis.recommendations,
        comparisonWithPrevious: analysisOptions.compareToPrevious ? 
          structuredAnalysis.comparison : null
      };

      // Mise en cache
      CacheService.getCache().set(cacheKey, analysis, CACHE_TTL.workoutReview);

      return analysis;
    } catch (error) {
      console.error(`Erreur lors de l'analyse d'entraînement: ${error.message}`);
      throw new Error(`Impossible d'analyser l'entraînement: ${error.message}`);
    }
  }

  /**
   * Suggère des ajustements à un plan d'entraînement basés sur les progrès et le feedback
   * @param {string} userId - ID de l'utilisateur
   * @param {string} programId - ID du programme d'entraînement
   * @param {Object} feedback - Feedback de l'utilisateur sur le programme
   * @returns {Object} Ajustements suggérés pour le plan d'entraînement
   */
  static async suggestPlanAdjustments(userId, programId, feedback) {
    try {
      // Générer une clé de cache unique
      const feedbackHash = this._generateHash(JSON.stringify(feedback));
      const cacheKey = `virtual_coach_adjustment_${userId}_${programId}_${feedbackHash}`;
      
      // Vérifier dans le cache
      const cachedAdjustment = CacheService.getCache().get(cacheKey);
      if (cachedAdjustment) {
        return cachedAdjustment;
      }

      // Récupérer le programme d'entraînement
      const program = await TrainingService.getTrainingProgramById(userId, programId);
      if (!program) {
        throw new Error('Programme d\'entraînement non trouvé');
      }
      
      // Récupérer les activités récentes (30 jours)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const recentActivities = await TrainingService.getUserActivities(userId, {
        startDate: startDate.toISOString()
      });
      
      // Récupérer le profil utilisateur
      const userProfile = await TrainingService.getUserProfile(userId);
      
      // Construire le prompt pour Claude
      const prompt = this._buildPlanAdjustmentPrompt(
        program,
        recentActivities,
        userProfile,
        feedback
      );

      // Appeler Claude API
      const claudeResponse = await ClaudeApiService.generateCompletion({
        prompt,
        max_tokens: 1500,
        temperature: 0.7,
        model: process.env.CLAUDE_MODEL || 'claude-2.0'
      });

      // Extraire et structurer les ajustements
      const structuredAdjustments = this._structurePlanAdjustments(claudeResponse.completion);
      
      // Format de réponse
      const adjustments = {
        userId,
        programId,
        programName: program.name,
        timestamp: new Date().toISOString(),
        summary: structuredAdjustments.summary,
        weeklyAdjustments: structuredAdjustments.weeklyAdjustments,
        workoutModifications: structuredAdjustments.workoutModifications,
        intensityAdjustments: structuredAdjustments.intensityAdjustments,
        recoveryRecommendations: structuredAdjustments.recoveryRecommendations,
        progressionStrategy: structuredAdjustments.progressionStrategy
      };

      // Mise en cache
      CacheService.getCache().set(cacheKey, adjustments, CACHE_TTL.planAdjustment);

      return adjustments;
    } catch (error) {
      console.error(`Erreur lors de la suggestion d'ajustements au plan: ${error.message}`);
      throw new Error(`Impossible de suggérer des ajustements au plan: ${error.message}`);
    }
  }

  /**
   * Méthodes auxiliaires
   */

  /**
   * Génère un hash simple pour la mise en cache
   * @private
   * @param {string} str - Chaîne à hacher
   * @returns {string} Hash
   */
  static _generateHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hash.toString(36);
  }

  /**
   * Construit le contexte utilisateur pour les requêtes
   * @private
   * @param {string} userId - ID de l'utilisateur
   * @param {string} domain - Domaine concerné
   * @returns {string} Contexte utilisateur formaté
   */
  static async _buildUserContext(userId, domain) {
    // Récupérer les données de base du profil
    const userProfile = await TrainingService.getUserProfile(userId);
    if (!userProfile) {
      return '';
    }

    let context = `Contexte utilisateur:\n`;
    context += `- Cycliste: ${userProfile.gender === 'male' ? 'Homme' : 'Femme'}, ${userProfile.age} ans\n`;
    context += `- Niveau: ${userProfile.level || 'Intermédiaire'}\n`;
    context += `- FTP actuel: ${userProfile.ftp || 'Non spécifié'} watts\n`;
    
    // Ajouter des informations spécifiques au domaine
    if (domain === 'training' || domain === 'general') {
      // Récupérer quelques statistiques d'entraînement récentes
      const stats = await TrainingService.getUserStats(userId);
      if (stats) {
        context += `- Volume d'entraînement hebdomadaire: ${stats.weeklyVolume || 'N/A'} heures\n`;
        context += `- Progression FTP sur 3 mois: ${stats.ftpProgression || 'N/A'}%\n`;
      }
    }
    
    if (domain === 'nutrition' || domain === 'general') {
      // Récupérer les préférences nutritionnelles
      const nutritionPrefs = await NutritionService.getUserNutritionPreferences(userId);
      if (nutritionPrefs) {
        context += `- Régime alimentaire: ${nutritionPrefs.dietType || 'Standard'}\n`;
        context += `- Restrictions: ${nutritionPrefs.restrictions?.join(', ') || 'Aucune'}\n`;
      }
    }
    
    return context;
  }

  /**
   * Construit le prompt pour répondre à une question
   * @private
   * @param {string} question - Question posée
   * @param {string} domain - Domaine de la question
   * @param {string} userContext - Contexte utilisateur
   * @returns {string} Prompt formaté
   */
  static _buildQuestionPrompt(question, domain, userContext) {
    let prompt = `Tu es un coach cycliste expert et nutritionniste. Tu dois répondre à une question sur ${domain === 'general' ? 'le cyclisme' : domain}.`;
    
    if (userContext) {
      prompt += `\n\n${userContext}`;
    }
    
    prompt += `\n\nQuestion: ${question}\n\nRéponds de manière concise, précise et basée sur des données scientifiques. Si tu n'as pas suffisamment d'informations, indique-le clairement. Utilise le format suivant pour ta réponse:
    
1. Réponse principale
2. Points clés (si pertinent)
3. Sources (si applicable)

Ta réponse:`;
    
    return prompt;
  }

  /**
   * Extrait les sources citées dans une réponse
   * @private
   * @param {string} completion - Réponse de Claude
   * @returns {Array<string>} Sources extraites
   */
  static _extractSources(completion) {
    const sourcesMatch = completion.match(/Sources?:(.+?)(?:\n\n|$)/s);
    if (sourcesMatch && sourcesMatch[1]) {
      return sourcesMatch[1]
        .split(/\n-|\n\d+\./)
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }
    return [];
  }

  /**
   * Estime le niveau de confiance de la réponse
   * @private
   * @param {string} completion - Réponse de Claude
   * @returns {number} Niveau de confiance (0-1)
   */
  static _estimateConfidence(completion) {
    // Recherche de phrases exprimant de l'incertitude
    const uncertaintyPhrases = [
      'je ne suis pas sûr',
      'il est possible que',
      'peut-être',
      'il semble que',
      'je ne peux pas déterminer',
      'sans plus d\'informations',
      'il est difficile de dire'
    ];
    
    let confidenceScore = 1.0;
    
    // Réduire le score pour chaque phrase d'incertitude trouvée
    for (const phrase of uncertaintyPhrases) {
      if (completion.toLowerCase().includes(phrase)) {
        confidenceScore -= 0.1;
      }
    }
    
    // Vérifier si des sources sont citées (augmente la confiance)
    if (this._extractSources(completion).length > 0) {
      confidenceScore += 0.1;
    }
    
    // Limiter entre 0 et 1
    return Math.max(0, Math.min(1, confidenceScore));
  }

  /**
   * Méthodes qui seraient implémentées dans une version complète
   * Ces méthodes seraient complétées avec des algorithmes et logique spécifiques
   */
  
  static async _collectUserDataForAdvice(userId, options) {
    // Simuler la collecte de données
    const activities = await TrainingService.getUserActivities(userId, {
      startDate: new Date(Date.now() - options.lookbackPeriod * 24 * 60 * 60 * 1000).toISOString()
    });
    
    return {
      activities,
      metrics: {
        averagePower: 220,
        ftpProgress: 5,
        weeklyVolume: 8.5
      }
    };
  }
  
  static _buildAdvicePrompt(userData, options) {
    // Construction d'un prompt pour l'IA
    return `En tant que coach cycliste expert, analyse les données suivantes et génère un conseil personnalisé
    pour un cycliste, en te concentrant sur ${options.focusArea}.
    
    [Données d'activité récentes (${userData.activities.length} sessions)]
    
    Génère des conseils personnalisés structurés selon les sections suivantes:
    1. Vue d'ensemble
    2. Insights clés
    3. Recommandations spécifiques
    4. Prochaines étapes`;
  }
  
  static _structureAdviceResponse(completion) {
    // Implémentation simplifiée
    return {
      overview: "Vue d'ensemble extraite de la réponse",
      insights: ["Insight 1", "Insight 2"],
      recommendations: ["Recommandation 1", "Recommandation 2"],
      nextSteps: ["Étape 1", "Étape 2"]
    };
  }
  
  static _buildWorkoutAnalysisPrompt(activity, previousActivities, userProfile, options) {
    // Construction d'un prompt pour l'IA
    return `En tant que coach cycliste expert, analyse l'entraînement suivant et fournis des commentaires.`;
  }
  
  static _structureWorkoutAnalysis(completion) {
    // Implémentation simplifiée
    return {
      overview: "Analyse générale de la séance",
      strengths: ["Point fort 1", "Point fort 2"],
      improvements: ["Amélioration 1", "Amélioration 2"],
      metrics: { intensité: "Bonne", technique: "À améliorer" },
      recommendations: ["Recommandation 1", "Recommandation 2"],
      comparison: "Comparaison avec les séances précédentes"
    };
  }
  
  static _buildPlanAdjustmentPrompt(program, activities, userProfile, feedback) {
    // Construction d'un prompt pour l'IA
    return `En tant que coach cycliste expert, suggère des ajustements au plan d'entraînement suivant
    basés sur les activités récentes et le feedback de l'utilisateur.`;
  }
  
  static _structurePlanAdjustments(completion) {
    // Implémentation simplifiée
    return {
      summary: "Résumé des ajustements proposés",
      weeklyAdjustments: { semaine1: "Réduction du volume", semaine2: "Augmentation de l'intensité" },
      workoutModifications: ["Modification 1", "Modification 2"],
      intensityAdjustments: "Ajustements d'intensité",
      recoveryRecommendations: "Recommandations de récupération",
      progressionStrategy: "Stratégie de progression"
    };
  }
}

module.exports = VirtualCoachService;
