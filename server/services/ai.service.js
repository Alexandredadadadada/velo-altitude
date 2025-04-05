/**
 * Service d'intelligence artificielle avec intégration Claude
 * Fournit des analyses avancées, recommandations personnalisées et descriptions narratives
 */

const axios = require('axios');
const logger = require('../utils/logger');
const cacheService = require('./cache.service');

class AIService {
  constructor() {
    this.apiKey = process.env.CLAUDE_API_KEY || '';
    this.baseUrl = 'https://api.anthropic.com/v1';
    this.model = 'claude-3-opus-20240229'; // Modèle le plus avancé pour les analyses complexes
    this.cacheEnabled = true;
    this.cacheTTL = 3600; // 1 heure de cache
    
    // Vérifier si la clé API est définie
    if (!this.apiKey) {
      logger.warn('[AIService] Clé API Claude non définie - Les fonctionnalités IA avancées ne seront pas disponibles');
    }
    
    // Définition des prompts pour différents cas d'usage
    this.promptTemplates = {
      trainingRecommendation: `
Tu es un coach cycliste expert avec une connaissance approfondie de la physiologie sportive, des méthodes d'entraînement et de la planification cycliste.

Contexte utilisateur:
- Nom: {{userName}}
- Genre: {{gender}}
- Âge: {{age}}
- Niveau: {{level}}
- FTP actuel: {{ftp}} watts
- Poids: {{weight}} kg
- Objectif principal: {{goal}}
- Historique récent: {{recentActivities}}

Basé sur ces données, génère un plan d'entraînement personnalisé sur 4 semaines qui:
1. Est adapté à son niveau actuel et ses performances récentes
2. Cible spécifiquement son objectif principal
3. Inclut une progression raisonnable sans risque de surentraînement
4. Contient des séances variées (endurance, intervalles, récupération)
5. Tient compte de sa disponibilité ({{availability}} heures/semaine)

Pour chaque semaine, fournis:
- L'objectif spécifique de la semaine
- 3-5 séances détaillées avec durée, intensité et description
- Des métriques à surveiller
- Des conseils de récupération

Inclus également:
- Des recommandations sur la nutrition
- Des conseils techniques pour améliorer son efficacité
- Des indicateurs de progression à surveiller
      `,
      
      performanceAnalysis: `
Tu es un analyste de performance cycliste expert utilisant des méthodes d'analyse avancées pour fournir des insights précis et actionnables.

Voici les données de performance de l'activité récente:
- Durée: {{duration}}
- Distance: {{distance}} km
- Dénivelé: {{elevation}} m
- Puissance moyenne: {{avgPower}} watts
- Puissance normalisée: {{np}} watts
- Fréquence cardiaque moyenne: {{avgHr}} bpm
- Intensité relative: {{intensity}}
- TSS: {{tss}}
- Cadence moyenne: {{cadence}} rpm
- Variabilité de puissance: {{powerVar}}%
- Zones de puissance: {{powerZones}}
- Distribution temps/puissance: {{timePowerDistribution}}
- Profil du parcours: {{routeProfile}}

Analyse cette activité et fournis:
1. Un résumé de la qualité globale de l'effort
2. Les points forts identifiés dans cette performance
3. Les domaines spécifiques à améliorer
4. Une analyse de la gestion de l'effort (pacing)
5. Des recommandations pour les prochaines séances d'entraînement
6. Des insights sur l'économie d'effort et l'efficacité du pédalage
7. Des suggestions d'ajustement de position ou de technique
8. Une estimation de l'impact de cette séance sur la progression vers les objectifs
      `,
      
      routeDescription: `
Tu es un expert cycliste avec une profonde connaissance des routes, cols et régions cyclables d'Europe.

Détails de l'itinéraire:
- Nom: {{routeName}}
- Région: {{region}}
- Distance: {{distance}} km
- Dénivelé total: {{elevation}} m
- Départ: {{startLocation}}
- Arrivée: {{endLocation}}
- Points d'intérêt traversés: {{pointsOfInterest}}
- Cols et montées: {{climbs}}
- Profil: {{routeProfile}}
- Surfaces: {{surfaces}}
- Données environnementales: {{environmentalData}}

Crée une description narrative captivante de cet itinéraire qui:
1. Capture l'essence de l'expérience cycliste sur ce parcours
2. Décrit les paysages, panoramas et sensations
3. Fournit des détails techniques sur les montées (gradients, longueurs, difficulté)
4. Mentionne les aspects culturels et historiques des lieux traversés
5. Donne des conseils pratiques (ravitaillement, points d'eau, abris)
6. Évoque les meilleures saisons/périodes pour parcourir cet itinéraire
7. Inclut quelques secrets locaux ou conseils d'initiés
8. Alerte sur d'éventuels défis ou difficultés spécifiques

La description doit être engageante, visuellement évocatrice et donner envie aux cyclistes de découvrir cet itinéraire.
      `
    };
  }

  /**
   * Configure les headers pour l'API Claude
   * @returns {Object} Headers pour les requêtes API
   */
  _getHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey,
      'anthropic-version': '2023-06-01'
    };
  }

  /**
   * Appelle l'API Claude avec un prompt et des paramètres
   * @param {string} prompt - Prompt à envoyer à Claude
   * @param {Object} options - Options pour la requête
   * @returns {Promise<string>} Réponse de l'API
   */
  async _callClaudeAPI(prompt, options = {}) {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: "Clé API Claude non configurée"
        };
      }

      const {
        temperature = 0.7,
        maxTokens = 1500,
        cacheKey = null
      } = options;

      // Vérifier si la réponse est en cache
      if (this.cacheEnabled && cacheKey) {
        const cachedResponse = await cacheService.get(cacheKey);
        if (cachedResponse) {
          logger.info(`[AIService] Réponse récupérée du cache pour: ${cacheKey}`);
          return {
            success: true,
            response: cachedResponse,
            fromCache: true
          };
        }
      }

      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
          model: this.model,
          max_tokens: maxTokens,
          temperature: temperature,
          messages: [
            { role: "user", content: prompt }
          ]
        },
        {
          headers: this._getHeaders()
        }
      );

      const aiResponse = response.data.content[0].text;

      // Mettre en cache la réponse
      if (this.cacheEnabled && cacheKey) {
        await cacheService.set(cacheKey, aiResponse, this.cacheTTL);
      }

      return {
        success: true,
        response: aiResponse,
        fromCache: false
      };
    } catch (error) {
      logger.error(`[AIService] Erreur lors de l'appel à Claude API: ${error.message}`);
      
      if (error.response) {
        logger.error(`[AIService] Détails de l'erreur: ${JSON.stringify(error.response.data)}`);
      }
      
      return {
        success: false,
        error: error.message,
        details: error.response ? error.response.data : null
      };
    }
  }

  /**
   * Remplace les variables dans un template de prompt
   * @param {string} template - Template de prompt avec variables {{var}}
   * @param {Object} data - Données pour remplacer les variables
   * @returns {string} Prompt avec variables remplacées
   */
  _formatPrompt(template, data = {}) {
    let formattedPrompt = template;
    
    // Remplacer toutes les variables dans le template
    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      formattedPrompt = formattedPrompt.replace(regex, value);
    }
    
    return formattedPrompt;
  }

  /**
   * Génère des recommandations d'entraînement personnalisées
   * @param {Object} userData - Données de l'utilisateur
   * @param {Object} options - Options pour la génération
   * @returns {Promise<Object>} Recommandations d'entraînement
   */
  async generateTrainingRecommendations(userData, options = {}) {
    try {
      const {
        userName,
        gender,
        age,
        level,
        ftp,
        weight,
        goal,
        recentActivities,
        availability
      } = userData;
      
      // Créer une clé de cache basée sur les données utilisateur et la date
      const currentWeek = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
      const cacheKey = `training_rec_${userName}_${ftp}_${weight}_${goal}_${currentWeek}`;
      
      // Formater le prompt avec les données utilisateur
      const prompt = this._formatPrompt(this.promptTemplates.trainingRecommendation, {
        userName,
        gender,
        age,
        level,
        ftp,
        weight,
        goal,
        recentActivities: JSON.stringify(recentActivities),
        availability
      });
      
      // Appeler l'API Claude
      const result = await this._callClaudeAPI(prompt, {
        temperature: 0.7,
        maxTokens: 2000,
        cacheKey
      });
      
      if (!result.success) {
        return {
          success: false,
          error: result.error,
          fallback: this._getFallbackTrainingRecommendations(userData)
        };
      }
      
      return {
        success: true,
        recommendations: result.response,
        fromCache: result.fromCache,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`[AIService] Erreur lors de la génération des recommandations: ${error.message}`);
      return {
        success: false,
        error: error.message,
        fallback: this._getFallbackTrainingRecommendations(userData)
      };
    }
  }

  /**
   * Génère une analyse de performance pour une activité
   * @param {Object} activityData - Données de l'activité
   * @param {Object} options - Options pour l'analyse
   * @returns {Promise<Object>} Analyse de performance
   */
  async analyzePerformance(activityData, options = {}) {
    try {
      const {
        duration,
        distance,
        elevation,
        avgPower,
        np,
        avgHr,
        intensity,
        tss,
        cadence,
        powerVar,
        powerZones,
        timePowerDistribution,
        routeProfile
      } = activityData;
      
      // Créer une clé de cache basée sur les données d'activité
      const activityId = activityData.id || `activity_${Date.now()}`;
      const cacheKey = `performance_analysis_${activityId}`;
      
      // Formater le prompt avec les données d'activité
      const prompt = this._formatPrompt(this.promptTemplates.performanceAnalysis, {
        duration,
        distance,
        elevation,
        avgPower,
        np,
        avgHr,
        intensity,
        tss,
        cadence,
        powerVar,
        powerZones: JSON.stringify(powerZones),
        timePowerDistribution: JSON.stringify(timePowerDistribution),
        routeProfile: JSON.stringify(routeProfile)
      });
      
      // Appeler l'API Claude
      const result = await this._callClaudeAPI(prompt, {
        temperature: 0.5, // Moins de créativité pour l'analyse
        maxTokens: 1500,
        cacheKey
      });
      
      if (!result.success) {
        return {
          success: false,
          error: result.error,
          fallback: this._getFallbackPerformanceAnalysis(activityData)
        };
      }
      
      return {
        success: true,
        analysis: result.response,
        fromCache: result.fromCache,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`[AIService] Erreur lors de l'analyse de performance: ${error.message}`);
      return {
        success: false,
        error: error.message,
        fallback: this._getFallbackPerformanceAnalysis(activityData)
      };
    }
  }

  /**
   * Génère une description narrative d'un itinéraire
   * @param {Object} routeData - Données de l'itinéraire
   * @param {Object} options - Options pour la génération
   * @returns {Promise<Object>} Description narrative
   */
  async generateRouteDescription(routeData, options = {}) {
    try {
      const {
        routeName,
        region,
        distance,
        elevation,
        startLocation,
        endLocation,
        pointsOfInterest,
        climbs,
        routeProfile,
        surfaces,
        environmentalData
      } = routeData;
      
      // Créer une clé de cache basée sur les données d'itinéraire
      const routeId = routeData.id || `route_${Date.now()}`;
      const cacheKey = `route_description_${routeId}`;
      
      // Formater le prompt avec les données d'itinéraire
      const prompt = this._formatPrompt(this.promptTemplates.routeDescription, {
        routeName,
        region,
        distance,
        elevation,
        startLocation,
        endLocation,
        pointsOfInterest: JSON.stringify(pointsOfInterest),
        climbs: JSON.stringify(climbs),
        routeProfile: JSON.stringify(routeProfile),
        surfaces: JSON.stringify(surfaces),
        environmentalData: JSON.stringify(environmentalData)
      });
      
      // Appeler l'API Claude
      const result = await this._callClaudeAPI(prompt, {
        temperature: 0.8, // Plus de créativité pour les descriptions
        maxTokens: 1200,
        cacheKey
      });
      
      if (!result.success) {
        return {
          success: false,
          error: result.error,
          fallback: this._getFallbackRouteDescription(routeData)
        };
      }
      
      return {
        success: true,
        description: result.response,
        fromCache: result.fromCache,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`[AIService] Erreur lors de la génération de la description: ${error.message}`);
      return {
        success: false,
        error: error.message,
        fallback: this._getFallbackRouteDescription(routeData)
      };
    }
  }

  /**
   * Fournit des recommandations d'entraînement de secours si l'API échoue
   * @param {Object} userData - Données de l'utilisateur
   * @returns {string} Recommandations de secours
   */
  _getFallbackTrainingRecommendations(userData) {
    const { level, goal } = userData;
    
    // Recommandations de base selon le niveau et l'objectif
    if (goal.includes('endurance')) {
      return "Programme d'endurance sur 4 semaines : Concentrez-vous sur des sorties longues à intensité modérée, en augmentant progressivement la durée. Alternez avec des jours de récupération active.";
    } else if (goal.includes('puissance')) {
      return "Programme de développement de la puissance : Intégrez des intervalles courts à haute intensité 2 fois par semaine, avec des jours de récupération et une sortie longue hebdomadaire.";
    } else {
      return "Programme équilibré : Alternez des sorties d'endurance, des intervalles modérés et des séances de récupération pour une progression globale.";
    }
  }

  /**
   * Fournit une analyse de performance de secours si l'API échoue
   * @param {Object} activityData - Données de l'activité
   * @returns {string} Analyse de secours
   */
  _getFallbackPerformanceAnalysis(activityData) {
    const { avgPower, np, intensity } = activityData;
    
    // Analyse basique basée sur les métriques simples
    if (np > avgPower * 1.2) {
      return "Cette activité présente une variabilité de puissance élevée, ce qui suggère un parcours vallonné ou des efforts intermittents. Travailler sur une puissance plus régulière pourrait améliorer l'efficacité.";
    } else if (intensity > 0.8) {
      return "Effort d'intensité élevée. Assurez-vous de prévoir une récupération adéquate dans les 24-48h suivantes.";
    } else {
      return "Effort d'endurance bien équilibré avec une distribution de puissance régulière. Ce type d'activité contribue à renforcer votre base aérobie.";
    }
  }

  /**
   * Fournit une description d'itinéraire de secours si l'API échoue
   * @param {Object} routeData - Données de l'itinéraire
   * @returns {string} Description de secours
   */
  _getFallbackRouteDescription(routeData) {
    const { routeName, region, distance, elevation, climbs } = routeData;
    
    // Description basique basée sur les métriques simples
    return `Le parcours "${routeName}" en ${region} s'étend sur ${distance}km avec ${elevation}m de dénivelé positif. Cet itinéraire présente ${climbs.length} ascensions notables et traverse des paysages variés caractéristiques de la région.`;
  }
}

module.exports = new AIService();
