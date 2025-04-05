/**
 * Contrôleur pour les programmes intégrés d'entraînement et de nutrition
 */

const IntegratedProgramsService = require('../services/integrated-programs.service');
const { handleError } = require('../utils/error-handler');

/**
 * Contrôleur des programmes intégrés
 */
class IntegratedProgramsController {
  /**
   * Génère un programme intégré combinant entraînement et nutrition
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async generateProgram(req, res) {
    try {
      const { userId } = req.params;
      const programParams = req.body;

      // Validation des paramètres
      if (!programParams || !programParams.type) {
        return res.status(400).json({ 
          error: 'Paramètres incomplets. Le type de programme est requis.' 
        });
      }

      const program = await IntegratedProgramsService.generateIntegratedProgram(userId, programParams);
      res.status(201).json(program);
    } catch (error) {
      handleError(res, error, 'Erreur lors de la génération du programme intégré');
    }
  }

  /**
   * Ajuste un programme intégré existant
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async adjustProgram(req, res) {
    try {
      const { userId, programId } = req.params;
      const adjustmentParams = req.body;

      if (!adjustmentParams) {
        return res.status(400).json({ 
          error: 'Paramètres d\'ajustement requis' 
        });
      }

      const adjustedProgram = await IntegratedProgramsService.adjustIntegratedProgram(
        userId, 
        programId,
        adjustmentParams
      );

      res.status(200).json(adjustedProgram);
    } catch (error) {
      handleError(res, error, 'Erreur lors de l\'ajustement du programme intégré');
    }
  }

  /**
   * Récupère un programme intégré par son ID
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getProgramById(req, res) {
    try {
      const { userId, programId } = req.params;
      
      const program = await IntegratedProgramsService.getIntegratedProgramById(userId, programId);
      
      if (!program) {
        return res.status(404).json({ 
          error: 'Programme intégré non trouvé' 
        });
      }
      
      res.status(200).json(program);
    } catch (error) {
      handleError(res, error, 'Erreur lors de la récupération du programme intégré');
    }
  }

  /**
   * Récupère tous les programmes intégrés d'un utilisateur
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getUserPrograms(req, res) {
    try {
      const { userId } = req.params;
      
      const programs = await IntegratedProgramsService.getUserIntegratedPrograms(userId);
      
      res.status(200).json(programs);
    } catch (error) {
      handleError(res, error, 'Erreur lors de la récupération des programmes intégrés');
    }
  }

  /**
   * Génère un résumé du programme intégré
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getProgramSummary(req, res) {
    try {
      const { userId, programId } = req.params;
      
      const program = await IntegratedProgramsService.getIntegratedProgramById(userId, programId);
      
      if (!program) {
        return res.status(404).json({ 
          error: 'Programme intégré non trouvé' 
        });
      }
      
      // Créer un résumé du programme
      const summary = {
        id: program.id,
        name: program.name,
        description: program.description,
        createdAt: program.createdAt,
        trainingOverview: {
          type: program.training.type,
          weeklyHours: program.training.weeklyHours,
          focusAreas: program.training.focusAreas,
          duration: program.training.duration
        },
        nutritionOverview: {
          type: program.nutrition.type,
          dailyCalories: program.nutrition.dailyCalories,
          macronutrients: program.nutrition.macronutrients
        },
        keyRecommendations: program.recommendations.slice(0, 3)
      };
      
      res.status(200).json(summary);
    } catch (error) {
      handleError(res, error, 'Erreur lors de la génération du résumé du programme');
    }
  }
}

module.exports = new IntegratedProgramsController();
