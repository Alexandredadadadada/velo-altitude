// openai.service.js - Service pour l'intégration avec l'API OpenAI
const axios = require('axios');
const config = require('../config/api.config');
const { logger } = require('../utils/logger');
const apiServices = require('./apiServices');

class OpenAIService {
  constructor() {
    this.apiKey = config.openai.apiKey;
    this.model = config.openai.model;
    this.baseUrl = config.openai.baseUrl;
    this.maxTokens = config.openai.maxTokens;
  }

  /**
   * Génère une réponse de l'assistant IA
   * @param {string} prompt Question ou instruction de l'utilisateur
   * @param {object} context Contexte supplémentaire (informations cyclistes)
   * @returns {Promise<string>} Réponse générée
   */
  async generateResponse(prompt, context = {}) {
    try {
      // Construction du message avec le prompt et le contexte
      let systemMessage = "Tu es un assistant cycliste spécialisé pour les cyclistes de la région Grand Est. ";
      systemMessage += "Tu connais bien les cols, itinéraires, équipements et techniques d'entraînement pour le cyclisme. ";
      systemMessage += "Tu es concis, précis et tu fournis des conseils adaptés aux cyclistes de tous niveaux.";

      // Ajout du contexte si disponible
      if (context.weather) {
        systemMessage += `\nLes conditions météo actuelles sont: ${context.weather.description}, température de ${context.weather.temperature}°C.`;
      }
      
      if (context.location) {
        systemMessage += `\nL'utilisateur se trouve actuellement près de: ${context.location}.`;
      }
      
      if (context.profile) {
        systemMessage += `\nProfil du cycliste: niveau ${context.profile.level}, préfère ${context.profile.preference}.`;
      }

      // Obtenir la clé API active du gestionnaire de clés
      const activeApiKey = this._getActiveApiKey();

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: prompt }
          ],
          max_tokens: this.maxTokens,
          temperature: 0.7,
          top_p: 1,
          frequency_penalty: 0,
          presence_penalty: 0
        },
        {
          headers: {
            'Authorization': `Bearer ${activeApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Erreur lors de la génération de réponse OpenAI:', error);
      if (error.response) {
        console.error('Détails de l\'erreur:', error.response.data);
      }
      
      // Si l'erreur est liée à la clé API (401 ou 403), essayer de faire une rotation
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        logger.warn('Erreur d\'authentification OpenAI, tentative de rotation de clé');
        try {
          apiServices.openai.rotateKeys();
          logger.info('Rotation de clé OpenAI effectuée avec succès');
        } catch (rotationError) {
          logger.error(`Échec de la rotation de clé OpenAI: ${rotationError.message}`);
        }
      }
      
      throw new Error('Échec de la génération de réponse par l\'assistant IA');
    }
  }

  /**
   * Génère des recommandations d'itinéraires basées sur les préférences
   * @param {object} preferences Préférences de l'utilisateur
   * @returns {Promise<string>} Recommandations générées
   */
  async generateRouteRecommendations(preferences) {
    try {
      const prompt = `Recommande un itinéraire cycliste dans la région Grand Est avec ces critères:
- Distance: ${preferences.distance || 'non spécifiée'} km
- Dénivelé: ${preferences.elevation || 'non spécifié'} m
- Difficulté: ${preferences.difficulty || 'moyenne'}
- Type de vélo: ${preferences.bikeType || 'route'}
- Point de départ: ${preferences.startPoint || 'non spécifié'}
- Préférences: ${preferences.preferences || 'non spécifiées'}

Donne une description de l'itinéraire, les points d'intérêt, les défis potentiels et quelques conseils pratiques.`;

      return await this.generateResponse(prompt, {
        weather: preferences.weather,
        location: preferences.startPoint
      });
    } catch (error) {
      console.error('Erreur lors de la génération de recommandations d\'itinéraires:', error);
      throw new Error('Échec de la génération de recommandations d\'itinéraires');
    }
  }

  /**
   * Génère des conseils d'entraînement personnalisés
   * @param {object} athleteProfile Profil de l'athlète
   * @returns {Promise<string>} Conseils d'entraînement
   */
  async generateTrainingAdvice(athleteProfile) {
    try {
      const prompt = `Crée un plan d'entraînement cycliste personnalisé avec ces informations:
- Niveau: ${athleteProfile.level || 'débutant'}
- Objectif: ${athleteProfile.goal || 'amélioration générale'}
- Temps disponible: ${athleteProfile.availableTime || '5 heures'} par semaine
- Points forts: ${athleteProfile.strengths || 'non spécifiés'}
- Points à améliorer: ${athleteProfile.weaknesses || 'non spécifiés'}
- Équipement disponible: ${athleteProfile.equipment || 'vélo de route standard'}

Fournis un plan d'entraînement sur une semaine avec des conseils spécifiques.`;

      return await this.generateResponse(prompt, {
        profile: {
          level: athleteProfile.level,
          preference: athleteProfile.goal
        }
      });
    } catch (error) {
      console.error('Erreur lors de la génération de conseils d\'entraînement:', error);
      throw new Error('Échec de la génération de conseils d\'entraînement');
    }
  }

  /**
   * Génère des conseils nutritionnels pour cyclistes
   * @param {object} nutritionQuery Détails de la requête nutritionnelle
   * @returns {Promise<string>} Conseils nutritionnels
   */
  async generateNutritionAdvice(nutritionQuery) {
    try {
      const prompt = `Donne des conseils nutritionnels pour un cycliste avec ces paramètres:
- Type d'effort: ${nutritionQuery.effortType || 'sortie longue'}
- Durée: ${nutritionQuery.duration || '3 heures'}
- Intensité: ${nutritionQuery.intensity || 'modérée'}
- Conditions météo: ${nutritionQuery.weather || 'tempérées'}
- Restrictions alimentaires: ${nutritionQuery.restrictions || 'aucune'}

Inclus des conseils pour avant, pendant et après l'effort, avec des exemples d'aliments adaptés.`;

      return await this.generateResponse(prompt);
    } catch (error) {
      console.error('Erreur lors de la génération de conseils nutritionnels:', error);
      throw new Error('Échec de la génération de conseils nutritionnels');
    }
  }

  /**
   * Obtient la clé API active pour les requêtes
   * @returns {string} Clé API active
   * @private
   */
  _getActiveApiKey() {
    // Utiliser le nouveau système de gestion des clés API
    try {
      return apiServices.openai.getKey();
    } catch (error) {
      logger.warn(`Erreur lors de la récupération de la clé API OpenAI: ${error.message}. Utilisation de la clé de secours.`);
      return this.apiKey;
    }
  }
}

module.exports = new OpenAIService();
