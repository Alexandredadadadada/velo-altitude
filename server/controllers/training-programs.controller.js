/**
 * Contrôleur de programmes d'entraînement
 * Gère les requêtes API liées aux programmes d'entraînement personnalisés
 */

const logger = require('../utils/logger');
const trainingProgramsService = require('../services/training-programs.service');
const nutritionService = require('../services/nutrition.service');
const userService = require('../services/user.service'); // Supposé existant

/**
 * Contrôleur de programmes d'entraînement
 */
class TrainingProgramsController {
  /**
   * Génère un programme d'entraînement personnalisé
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async generateProgram(req, res) {
    try {
      const { userId } = req.params;
      const parameters = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID utilisateur requis'
        });
      }
      
      logger.info(`[TrainingProgramsController] Génération d'un programme pour l'utilisateur: ${userId}`);
      
      // Récupérer le profil utilisateur
      let userProfile;
      try {
        userProfile = await userService.getUserProfile(userId);
      } catch (error) {
        logger.error(`[TrainingProgramsController] Profil utilisateur non trouvé: ${error.message}`);
        return res.status(404).json({
          success: false,
          message: 'Profil utilisateur non trouvé',
          error: error.message
        });
      }
      
      // Générer le programme d'entraînement
      const program = await trainingProgramsService.generateProgram(userProfile, parameters);
      
      return res.status(200).json({
        success: true,
        data: program
      });
    } catch (error) {
      logger.error(`[TrainingProgramsController] Erreur lors de la génération du programme: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération du programme d\'entraînement',
        error: error.message
      });
    }
  }

  /**
   * Génère un programme intégré entraînement-nutrition
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async generateIntegratedProgram(req, res) {
    try {
      const { userId } = req.params;
      const { trainingParameters, nutritionGoal } = req.body;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID utilisateur requis'
        });
      }
      
      if (!trainingParameters) {
        return res.status(400).json({
          success: false,
          message: 'Paramètres d\'entraînement requis'
        });
      }
      
      logger.info(`[TrainingProgramsController] Génération d'un programme intégré pour l'utilisateur: ${userId}`);
      
      // Récupérer le profil utilisateur
      let userProfile;
      try {
        userProfile = await userService.getUserProfile(userId);
      } catch (error) {
        logger.error(`[TrainingProgramsController] Profil utilisateur non trouvé: ${error.message}`);
        return res.status(404).json({
          success: false,
          message: 'Profil utilisateur non trouvé',
          error: error.message
        });
      }
      
      // Enrichir le profil avec le but nutritionnel si spécifié
      if (nutritionGoal) {
        userProfile.goal = nutritionGoal;
      }
      
      // Générer le programme d'entraînement
      const trainingProgram = await trainingProgramsService.generateProgram(userProfile, trainingParameters);
      
      // Générer le plan de nutrition correspondant
      const nutritionPlan = await nutritionService.generatePersonalizedNutritionPlan(
        userId,
        userProfile,
        trainingProgram
      );
      
      // Assembler le programme intégré
      const integratedProgram = {
        id: `integrated_${Date.now()}_${userId.substring(0, 6)}`,
        userId,
        name: `Programme intégré: ${trainingProgram.name}`,
        description: "Programme combinant entraînement personnalisé et plan nutritionnel adapté",
        createdAt: new Date().toISOString(),
        training: trainingProgram,
        nutrition: nutritionPlan,
        recommendations: [
          "Ajustez votre apport calorique selon l'intensité réelle de vos entraînements",
          "Concentrez-vous sur la récupération nutritionnelle après les séances intenses",
          "Suivez votre niveau d'énergie et adaptez votre nutrition en conséquence",
          "Testez différentes stratégies nutritionnelles pendant l'entraînement avant de les appliquer en compétition"
        ]
      };
      
      return res.status(200).json({
        success: true,
        data: integratedProgram
      });
    } catch (error) {
      logger.error(`[TrainingProgramsController] Erreur lors de la génération du programme intégré: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération du programme intégré',
        error: error.message
      });
    }
  }

  /**
   * Ajuste un programme d'entraînement existant
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async adjustProgram(req, res) {
    try {
      const { userId, programId } = req.params;
      const { adjustments } = req.body;
      
      if (!userId || !programId) {
        return res.status(400).json({
          success: false,
          message: 'ID utilisateur et ID programme requis'
        });
      }
      
      if (!adjustments) {
        return res.status(400).json({
          success: false,
          message: 'Ajustements requis'
        });
      }
      
      logger.info(`[TrainingProgramsController] Ajustement du programme ${programId} pour l'utilisateur: ${userId}`);
      
      // Dans une implémentation réelle, cette fonction irait chercher le programme dans la base de données
      // Pour cette version, nous pouvons supposer que le programme est régénéré avec les ajustements
      
      // Récupérer le profil utilisateur
      let userProfile;
      try {
        userProfile = await userService.getUserProfile(userId);
      } catch (error) {
        logger.error(`[TrainingProgramsController] Profil utilisateur non trouvé: ${error.message}`);
        return res.status(404).json({
          success: false,
          message: 'Profil utilisateur non trouvé',
          error: error.message
        });
      }
      
      // Simuler un programme existant à ajuster
      // (Dans une implémentation réelle, cette partie serait remplacée par une requête à la base de données)
      const existingProgram = {
        id: programId,
        type: adjustments.type || 'endurance',
        weeklyHours: adjustments.weeklyHours || 8,
        preferredDays: adjustments.preferredDays || ['Lundi', 'Mercredi', 'Vendredi', 'Samedi'],
        duration: adjustments.duration || 28
      };
      
      // Appliquer les ajustements
      const adjustedParameters = {
        ...existingProgram,
        ...adjustments
      };
      
      // Générer le programme ajusté
      const adjustedProgram = await trainingProgramsService.generateProgram(userProfile, adjustedParameters);
      
      return res.status(200).json({
        success: true,
        data: adjustedProgram
      });
    } catch (error) {
      logger.error(`[TrainingProgramsController] Erreur lors de l'ajustement du programme: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'ajustement du programme d\'entraînement',
        error: error.message
      });
    }
  }
}

module.exports = new TrainingProgramsController();
