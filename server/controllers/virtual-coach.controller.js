/**
 * Contrôleur pour l'assistant virtuel d'entraînement
 */

const VirtualCoachService = require('../services/virtual-coach.service');
const { handleApiError } = require('../middleware/error-handler.middleware');

/**
 * Contrôleur pour l'assistant virtuel d'entraînement
 */
class VirtualCoachController {
  /**
   * Répond à une question sur l'entraînement, la nutrition ou autre sujet
   * @param {Request} req - Requête Express
   * @param {Response} res - Réponse Express
   */
  static async answerQuestion(req, res) {
    try {
      const { userId } = req.params;
      const { question, domain, includeUserContext } = req.body;
      
      const response = await VirtualCoachService.answerQuestion({
        userId,
        question,
        domain,
        includeUserContext
      });

      res.status(200).json(response);
    } catch (error) {
      handleApiError(error, req, res);
    }
  }

  /**
   * Génère un conseil personnalisé basé sur les données de l'utilisateur
   * @param {Request} req - Requête Express
   * @param {Response} res - Réponse Express
   */
  static async generatePersonalizedAdvice(req, res) {
    try {
      const { userId } = req.params;
      const options = req.body;
      
      const advice = await VirtualCoachService.generatePersonalizedAdvice(userId, options);

      res.status(200).json(advice);
    } catch (error) {
      handleApiError(error, req, res);
    }
  }

  /**
   * Analyse un entraînement spécifique et fournit des commentaires
   * @param {Request} req - Requête Express
   * @param {Response} res - Réponse Express
   */
  static async analyzeWorkout(req, res) {
    try {
      const { userId, activityId } = req.params;
      const options = req.body;
      
      const analysis = await VirtualCoachService.analyzeWorkout(userId, activityId, options);

      res.status(200).json(analysis);
    } catch (error) {
      handleApiError(error, req, res);
    }
  }

  /**
   * Suggère des ajustements à un plan d'entraînement
   * @param {Request} req - Requête Express
   * @param {Response} res - Réponse Express
   */
  static async suggestPlanAdjustments(req, res) {
    try {
      const { userId, programId } = req.params;
      const feedback = req.body;
      
      const adjustments = await VirtualCoachService.suggestPlanAdjustments(userId, programId, feedback);

      res.status(200).json(adjustments);
    } catch (error) {
      handleApiError(error, req, res);
    }
  }
}

module.exports = VirtualCoachController;
