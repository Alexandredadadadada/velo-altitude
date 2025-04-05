// ai.controller.js - Contrôleur pour les interactions avec l'API OpenAI
const openaiService = require('../services/openai.service');
const weatherService = require('../services/weather.service');

class AIController {
  /**
   * Génère une réponse de l'assistant IA
   * @param {object} req - Requête Express
   * @param {object} res - Réponse Express
   */
  async getAssistantResponse(req, res) {
    try {
      const { prompt, context } = req.body;
      
      // Validation du prompt
      if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
        return res.status(400).json({
          success: false,
          error: 'Prompt requis et doit être une chaîne de caractères non vide'
        });
      }
      
      const response = await openaiService.generateResponse(prompt, context || {});
      
      res.json({
        success: true,
        data: {
          response
        }
      });
    } catch (error) {
      console.error('Erreur lors de la génération de réponse AI:', error);
      res.status(500).json({
        success: false,
        error: 'Échec de la génération de réponse par l\'assistant IA'
      });
    }
  }

  /**
   * Génère des recommandations d'itinéraires basées sur les préférences
   * @param {object} req - Requête Express
   * @param {object} res - Réponse Express
   */
  async getRouteRecommendations(req, res) {
    try {
      const preferences = req.body;
      
      // Validation des préférences minimales
      if (!preferences || !preferences.startPoint) {
        return res.status(400).json({
          success: false,
          error: 'Point de départ requis pour les recommandations d\'itinéraire'
        });
      }
      
      // Si des coordonnées sont fournies, récupérer la météo actuelle pour enrichir les recommandations
      if (preferences.lat && preferences.lon) {
        try {
          const weather = await weatherService.getCurrentWeather(
            Number(preferences.lat), 
            Number(preferences.lon)
          );
          
          preferences.weather = {
            description: weather.weather.description,
            temperature: weather.temperature.current
          };
        } catch (weatherError) {
          console.warn('Impossible de récupérer la météo pour les recommandations:', weatherError);
          // On continue sans météo
        }
      }
      
      const recommendations = await openaiService.generateRouteRecommendations(preferences);
      
      res.json({
        success: true,
        data: {
          recommendations
        }
      });
    } catch (error) {
      console.error('Erreur lors de la génération de recommandations d\'itinéraires:', error);
      res.status(500).json({
        success: false,
        error: 'Échec de la génération de recommandations d\'itinéraires'
      });
    }
  }

  /**
   * Génère des conseils d'entraînement personnalisés
   * @param {object} req - Requête Express
   * @param {object} res - Réponse Express
   */
  async getTrainingAdvice(req, res) {
    try {
      const athleteProfile = req.body;
      
      // Validation du niveau minimum
      if (!athleteProfile || !athleteProfile.level) {
        return res.status(400).json({
          success: false,
          error: 'Niveau de l\'athlète requis pour les conseils d\'entraînement'
        });
      }
      
      const advice = await openaiService.generateTrainingAdvice(athleteProfile);
      
      res.json({
        success: true,
        data: {
          advice
        }
      });
    } catch (error) {
      console.error('Erreur lors de la génération de conseils d\'entraînement:', error);
      res.status(500).json({
        success: false,
        error: 'Échec de la génération de conseils d\'entraînement'
      });
    }
  }

  /**
   * Génère des conseils nutritionnels pour cyclistes
   * @param {object} req - Requête Express
   * @param {object} res - Réponse Express
   */
  async getNutritionAdvice(req, res) {
    try {
      const nutritionQuery = req.body;
      
      // Validation des paramètres minimum
      if (!nutritionQuery || !nutritionQuery.effortType) {
        return res.status(400).json({
          success: false,
          error: 'Type d\'effort requis pour les conseils nutritionnels'
        });
      }
      
      const advice = await openaiService.generateNutritionAdvice(nutritionQuery);
      
      res.json({
        success: true,
        data: {
          advice
        }
      });
    } catch (error) {
      console.error('Erreur lors de la génération de conseils nutritionnels:', error);
      res.status(500).json({
        success: false,
        error: 'Échec de la génération de conseils nutritionnels'
      });
    }
  }
}

module.exports = new AIController();
