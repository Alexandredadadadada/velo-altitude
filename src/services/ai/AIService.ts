/**
 * Service d'intelligence artificielle pour Velo-Altitude
 * 
 * Intégration complète avec:
 * - Claude AI (Anthropic)
 * - OpenAI (GPT-4/GPT-3.5-turbo)
 * 
 * Fonctionnalités:
 * - Conversation contextuelle
 * - Génération de plans d'entraînement personnalisés
 * - Conseils nutritionnels adaptés au cyclisme
 * - Analyses de parcours et recommandations
 * - Cache pour les requêtes fréquentes
 */

import axios from 'axios';
import OpenAI from 'openai';
import { cacheService } from '../cache';
import { monitoringService } from '../monitoring';

// Types pour les modèles d'IA
export enum AIProvider {
  CLAUDE = 'claude',
  OPENAI = 'openai',
}

export enum ClaudeModel {
  CLAUDE_3_OPUS = 'claude-3-opus-20240229',
  CLAUDE_3_SONNET = 'claude-3-sonnet-20240229',
  CLAUDE_3_HAIKU = 'claude-3-haiku-20240307',
}

export enum OpenAIModel {
  GPT_4_TURBO = 'gpt-4-turbo-preview',
  GPT_4 = 'gpt-4',
  GPT_3_5_TURBO = 'gpt-3.5-turbo',
}

// Types pour les paramètres des requêtes
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequestParams {
  messages: AIMessage[];
  temperature?: number;
  provider?: AIProvider;
  model?: ClaudeModel | OpenAIModel;
  maxTokens?: number;
  userId?: string;
  cacheKey?: string;
}

export interface TrainingPlanParams {
  userId: string;
  fitnessLevel: 'débutant' | 'intermédiaire' | 'avancé';
  weeklyHours: number;
  goal: string;
  terrain?: string;
  existingFTP?: number;
  preferredWorkoutDays?: string[];
}

export interface NutritionAdviceParams {
  userId: string;
  dietPreference?: 'omnivore' | 'végétarien' | 'végan';
  allergies?: string[];
  event?: 'entraînement' | 'course' | 'récupération';
  duration?: number; // en heures
  intensity?: 'faible' | 'moyenne' | 'élevée';
}

export interface RouteAnalysisParams {
  userId: string;
  routeProfile: {
    distance: number; // en km
    elevation: number; // en mètres
    maxGradient: number; // en %
    averageGradient: number; // en %
    surface?: string;
    sections?: Array<{
      distance: number;
      elevation: number;
      gradient: number;
    }>;
  };
  fitnessLevel?: 'débutant' | 'intermédiaire' | 'avancé';
  weatherConditions?: {
    temperature: number; // en °C
    windSpeed: number; // en km/h
    windDirection: string;
    precipitation: number; // en mm
  };
}

// Configuration par défaut
const DEFAULT_CONFIG = {
  defaultProvider: AIProvider.CLAUDE,
  defaultClaudeModel: ClaudeModel.CLAUDE_3_HAIKU,
  defaultOpenAIModel: OpenAIModel.GPT_3_5_TURBO,
  defaultTemperature: 0.7,
  defaultMaxTokens: 1000,
  cacheTTL: 3600, // 1 heure
};

/**
 * Service d'IA pour Velo-Altitude
 */
export class AIService {
  private openaiClient: OpenAI | null = null;
  private claudeAPIKey: string | null = null;
  private openaiAPIKey: string | null = null;

  constructor() {
    // Initialiser les clés API
    this.claudeAPIKey = process.env.CLAUDE_API_KEY || null;
    this.openaiAPIKey = process.env.OPENAI_API_KEY || null;

    // Initialiser le client OpenAI si la clé est disponible
    if (this.openaiAPIKey) {
      this.openaiClient = new OpenAI({
        apiKey: this.openaiAPIKey,
      });
    }

    // Journaliser l'état d'initialisation
    if (!this.claudeAPIKey && !this.openaiAPIKey) {
      console.warn('AIService: Aucune clé API d\'IA n\'est configurée');
    } else {
      console.info(`AIService: Initialisé avec ${this.claudeAPIKey ? 'Claude' : ''}${this.claudeAPIKey && this.openaiAPIKey ? ' et ' : ''}${this.openaiAPIKey ? 'OpenAI' : ''}`);
    }
  }

  /**
   * Envoie un message à l'assistant IA
   * @param params Paramètres de la requête
   * @returns Réponse de l'IA
   */
  async sendMessage(params: AIRequestParams): Promise<string> {
    const {
      messages,
      temperature = DEFAULT_CONFIG.defaultTemperature,
      provider = DEFAULT_CONFIG.defaultProvider,
      maxTokens = DEFAULT_CONFIG.defaultMaxTokens,
      userId,
      cacheKey,
    } = params;

    // Définir le modèle en fonction du fournisseur
    const model = params.model || (
      provider === AIProvider.CLAUDE
        ? DEFAULT_CONFIG.defaultClaudeModel
        : DEFAULT_CONFIG.defaultOpenAIModel
    );

    // Vérifier le cache si une clé est fournie
    if (cacheKey) {
      try {
        const cachedResult = await cacheService.get<string>(cacheKey, {
          segment: 'ai',
          ttl: DEFAULT_CONFIG.cacheTTL,
        });

        if (cachedResult.hit && cachedResult.value) {
          monitoringService.trackEvent('ai_cache_hit', {
            userId,
            provider,
            model,
          });
          return cachedResult.value;
        }
      } catch (error) {
        console.warn('AIService: Erreur lors de la récupération du cache', error);
      }
    }

    try {
      // Enregistrer la métrique de début de requête
      const startTime = Date.now();
      monitoringService.trackEvent('ai_request_started', {
        userId,
        provider,
        model,
        messageCount: messages.length,
      });

      let result: string;

      // Utiliser le fournisseur approprié
      if (provider === AIProvider.CLAUDE) {
        result = await this.sendClaudeRequest(messages, model as ClaudeModel, temperature, maxTokens);
      } else {
        result = await this.sendOpenAIRequest(messages, model as OpenAIModel, temperature, maxTokens);
      }

      // Calculer la durée et enregistrer les métriques
      const duration = Date.now() - startTime;
      monitoringService.trackEvent('ai_request_completed', {
        userId,
        provider,
        model,
        duration,
        responseLength: result.length,
      });

      // Mettre en cache le résultat si une clé est fournie
      if (cacheKey && result) {
        await cacheService.set(cacheKey, result, {
          segment: 'ai',
          ttl: DEFAULT_CONFIG.cacheTTL,
        });
      }

      return result;
    } catch (error) {
      // Enregistrer l'erreur
      monitoringService.trackError('ai_request_error', error as Error, {
        userId,
        provider,
        model,
      });

      // Retourner un message d'erreur approprié
      const errorMessage = this.formatErrorMessage(error);
      throw new Error(`Erreur lors de la communication avec l'IA: ${errorMessage}`);
    }
  }

  /**
   * Envoie une requête à Claude AI
   * @private
   */
  private async sendClaudeRequest(
    messages: AIMessage[],
    model: ClaudeModel,
    temperature: number,
    maxTokens: number
  ): Promise<string> {
    if (!this.claudeAPIKey) {
      throw new Error('Clé API Claude non configurée');
    }

    // Formater les messages pour Claude
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model,
          messages: formattedMessages,
          max_tokens: maxTokens,
          temperature,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.claudeAPIKey,
            'anthropic-version': '2023-06-01',
          },
        }
      );

      return response.data.content[0].text;
    } catch (error) {
      console.error('Erreur lors de la requête Claude:', error);
      throw error;
    }
  }

  /**
   * Envoie une requête à OpenAI
   * @private
   */
  private async sendOpenAIRequest(
    messages: AIMessage[],
    model: OpenAIModel,
    temperature: number,
    maxTokens: number
  ): Promise<string> {
    if (!this.openaiClient) {
      throw new Error('Client OpenAI non initialisé');
    }

    try {
      const completion = await this.openaiClient.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Erreur lors de la requête OpenAI:', error);
      throw error;
    }
  }

  /**
   * Génère des suggestions de requêtes pour l'utilisateur
   * @param userId ID de l'utilisateur
   * @param context Contexte actuel
   * @returns Liste de suggestions
   */
  async getSuggestedQueries(userId: string, context: string): Promise<string[]> {
    // Créer une clé de cache unique
    const cacheKey = `suggestions:${userId}:${Buffer.from(context).toString('base64').substring(0, 50)}`;

    try {
      const result = await this.sendMessage({
        messages: [
          {
            role: 'system',
            content: 'Tu es un assistant spécialisé dans le cyclisme. Génère 3 questions pertinentes que l\'utilisateur pourrait poser en fonction du contexte actuel. Les questions doivent être variées, intéressantes et adaptées à un cycliste. Retourne uniquement les questions séparées par des "|".',
          },
          {
            role: 'user',
            content: `Contexte actuel de l'utilisateur: ${context}`,
          },
        ],
        provider: AIProvider.CLAUDE,
        model: ClaudeModel.CLAUDE_3_HAIKU,
        temperature: 0.8,
        userId,
        cacheKey,
      });

      // Diviser et nettoyer les suggestions
      return result
        .split('|')
        .map(query => query.trim())
        .filter(query => query.length > 0);
    } catch (error) {
      console.error('Erreur lors de la génération de suggestions:', error);
      monitoringService.trackError('ai_suggestions_error', error as Error, { userId });
      
      // Retourner des suggestions par défaut en cas d'erreur
      return [
        'Comment puis-je améliorer mon endurance en montagne ?',
        'Quels sont les meilleurs exercices pour développer la puissance ?',
        'Comment optimiser ma nutrition avant une sortie longue ?',
      ];
    }
  }

  /**
   * Génère un plan d'entraînement personnalisé
   * @param params Paramètres du plan d'entraînement
   * @returns Plan d'entraînement généré
   */
  async generateTrainingPlan(params: TrainingPlanParams): Promise<string> {
    const {
      userId,
      fitnessLevel,
      weeklyHours,
      goal,
      terrain = 'varié',
      existingFTP,
      preferredWorkoutDays = ['lundi', 'mercredi', 'vendredi', 'dimanche'],
    } = params;

    // Créer une clé de cache unique
    const cacheKey = `trainingPlan:${userId}:${fitnessLevel}:${weeklyHours}:${Buffer.from(goal).toString('base64').substring(0, 30)}`;

    try {
      // Préparer le contexte pour l'IA
      const ftpContext = existingFTP ? `La FTP actuelle de l'utilisateur est de ${existingFTP} watts.` : '';
      const daysContext = `L'utilisateur préfère s'entraîner les jours suivants: ${preferredWorkoutDays.join(', ')}.`;

      const prompt = `
        Crée un plan d'entraînement cycliste sur 4 semaines pour un athlète de niveau ${fitnessLevel} avec ${weeklyHours} heures disponibles par semaine.
        
        Objectif principal: ${goal}
        
        Terrain disponible: ${terrain}
        
        ${ftpContext}
        
        ${daysContext}
        
        Le plan doit inclure:
        1. Une progression semaine par semaine
        2. Des séances détaillées avec durée, intensité et objectif
        3. Une journée de repos par semaine
        4. Un équilibre entre endurance, force et récupération
        5. Des conseils spécifiques pour atteindre l'objectif mentionné
        
        Formate le plan de manière claire avec des sections par semaine et des sous-sections par jour.
      `;

      return await this.sendMessage({
        messages: [
          {
            role: 'system',
            content: 'Tu es un coach cycliste professionnel spécialisé dans la création de plans d'entraînement personnalisés. Tu utilises une approche scientifique basée sur les principes de périodisation et d\'entraînement par zones.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        provider: AIProvider.CLAUDE,
        model: ClaudeModel.CLAUDE_3_SONNET,
        temperature: 0.4,
        maxTokens: 2500,
        userId,
        cacheKey,
      });
    } catch (error) {
      console.error('Erreur lors de la génération du plan d\'entraînement:', error);
      monitoringService.trackError('ai_training_plan_error', error as Error, { userId });
      throw new Error('Impossible de générer le plan d\'entraînement. Veuillez réessayer ultérieurement.');
    }
  }

  /**
   * Génère des conseils nutritionnels adaptés
   * @param params Paramètres nutritionnels
   * @returns Conseils nutritionnels générés
   */
  async generateNutritionAdvice(params: NutritionAdviceParams): Promise<string> {
    const {
      userId,
      dietPreference = 'omnivore',
      allergies = [],
      event = 'entraînement',
      duration = 2,
      intensity = 'moyenne',
    } = params;

    // Créer une clé de cache unique
    const cacheKey = `nutrition:${userId}:${dietPreference}:${event}:${duration}:${intensity}`;

    try {
      // Préparer le contexte pour l'IA
      const allergiesContext = allergies.length > 0
        ? `L'utilisateur a les allergies ou intolérances suivantes: ${allergies.join(', ')}.`
        : 'L\'utilisateur n\'a pas d\'allergies ou intolérances alimentaires connues.';

      const prompt = `
        Propose un plan nutritionnel complet pour un cycliste avec les caractéristiques suivantes:
        
        - Préférence alimentaire: ${dietPreference}
        - Type d'activité: ${event} cycliste
        - Durée prévue: ${duration} heures
        - Intensité: ${intensity}
        
        ${allergiesContext}
        
        Le plan doit inclure:
        1. Les repas recommandés avant l'activité (timing et composition)
        2. La nutrition pendant l'effort (types de collations, fréquence, hydratation)
        3. La récupération post-effort (timing et composition)
        4. Des options d'aliments spécifiques et faciles à préparer
        5. Des conseils sur le timing et les quantités
        
        Propose des options réelles et accessibles en respectant les préférences alimentaires.
      `;

      return await this.sendMessage({
        messages: [
          {
            role: 'system',
            content: 'Tu es un nutritionniste sportif spécialisé dans l\'alimentation des cyclistes. Tu bases tes recommandations sur les dernières recherches scientifiques en nutrition sportive, adaptées spécifiquement aux besoins des cyclistes.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        provider: AIProvider.CLAUDE,
        model: ClaudeModel.CLAUDE_3_SONNET,
        temperature: 0.4,
        maxTokens: 2000,
        userId,
        cacheKey,
      });
    } catch (error) {
      console.error('Erreur lors de la génération des conseils nutritionnels:', error);
      monitoringService.trackError('ai_nutrition_advice_error', error as Error, { userId });
      throw new Error('Impossible de générer les conseils nutritionnels. Veuillez réessayer ultérieurement.');
    }
  }

  /**
   * Analyse un parcours et fournit des recommandations
   * @param params Paramètres d'analyse de parcours
   * @returns Analyse et recommandations générées
   */
  async analyzeRoute(params: RouteAnalysisParams): Promise<string> {
    const {
      userId,
      routeProfile,
      fitnessLevel = 'intermédiaire',
      weatherConditions,
    } = params;

    // Extraire les éléments du profil de route
    const {
      distance,
      elevation,
      maxGradient,
      averageGradient,
      surface = 'asphalte',
      sections = [],
    } = routeProfile;

    // Créer une clé de cache unique
    const cacheKey = `routeAnalysis:${userId}:${distance}:${elevation}:${maxGradient}:${fitnessLevel}`;

    try {
      // Préparer les sections du parcours pour l'IA
      let sectionsText = '';
      if (sections.length > 0) {
        sectionsText = 'Sections principales du parcours:\n';
        sections.forEach((section, index) => {
          sectionsText += `- Section ${index + 1}: ${section.distance}km, ${section.elevation}m de dénivelé, pente moyenne ${section.gradient}%\n`;
        });
      }

      // Préparer les conditions météo pour l'IA
      let weatherText = '';
      if (weatherConditions) {
        weatherText = `
          Conditions météorologiques:
          - Température: ${weatherConditions.temperature}°C
          - Vent: ${weatherConditions.windSpeed}km/h en direction ${weatherConditions.windDirection}
          - Précipitations: ${weatherConditions.precipitation}mm
        `;
      }

      const prompt = `
        Analyse le parcours cycliste suivant et fournis des recommandations détaillées:
        
        Profil du parcours:
        - Distance: ${distance}km
        - Dénivelé total: ${elevation}m
        - Pente maximale: ${maxGradient}%
        - Pente moyenne: ${averageGradient}%
        - Surface: ${surface}
        
        ${sectionsText}
        
        ${weatherText}
        
        Niveau du cycliste: ${fitnessLevel}
        
        Ton analyse doit inclure:
        1. Une évaluation de la difficulté globale du parcours
        2. Des stratégies pour aborder les sections difficiles
        3. Des recommandations sur le braquet et la cadence pour les montées
        4. Des conseils sur la gestion de l'effort et du rythme
        5. Des suggestions pour la nutrition et l'hydratation pendant ce parcours spécifique
        6. Des conseils sur l'équipement adapté aux conditions
        7. Des points d'attention particuliers (descentes techniques, virages dangereux, etc.)
        
        Formate ta réponse de manière claire avec des sections distinctes.
      `;

      return await this.sendMessage({
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert cycliste spécialisé dans l\'analyse de parcours. Tu as une grande expérience dans la planification d\'itinéraires, l\'optimisation de la performance sur différents terrains et l\'adaptation aux conditions météorologiques.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        provider: AIProvider.CLAUDE,
        model: ClaudeModel.CLAUDE_3_SONNET,
        temperature: 0.3,
        maxTokens: 2500,
        userId,
        cacheKey,
      });
    } catch (error) {
      console.error('Erreur lors de l\'analyse du parcours:', error);
      monitoringService.trackError('ai_route_analysis_error', error as Error, { userId });
      throw new Error('Impossible d\'analyser le parcours. Veuillez réessayer ultérieurement.');
    }
  }

  /**
   * Formate un message d'erreur pour l'utilisateur
   * @param error Erreur à formater
   * @returns Message d'erreur formaté
   * @private
   */
  private formatErrorMessage(error: any): string {
    if (error.response) {
      // Erreur de l'API
      const status = error.response.status;
      if (status === 429) {
        return 'Limite de requêtes atteinte. Veuillez réessayer dans quelques minutes.';
      } else if (status === 401 || status === 403) {
        return 'Problème d\'authentification avec le service d\'IA.';
      } else {
        return `Erreur du service d\'IA (${status}).`;
      }
    } else if (error.request) {
      // Pas de réponse de l'API
      return 'Impossible de contacter le service d\'IA. Vérifiez votre connexion.';
    } else {
      // Autre erreur
      return error.message || 'Erreur inconnue.';
    }
  }
}

// Exporter une instance singleton par défaut
export const aiService = new AIService();

// Exporter les types pour une utilisation facile
export default aiService;
