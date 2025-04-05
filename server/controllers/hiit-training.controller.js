/**
 * Contrôleur pour les entraînements HIIT
 * Gère les requêtes liées aux programmes d'entraînement par intervalles à haute intensité
 */
const hiitTrainingService = require('../services/hiit-training.service');
const logger = require('../utils/logger');

/**
 * Obtient la liste des templates d'entraînements HIIT disponibles
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.getAvailableWorkouts = async (req, res) => {
  try {
    const workouts = hiitTrainingService.getAvailableWorkouts();
    
    res.status(200).json({
      success: true,
      data: workouts
    });
  } catch (error) {
    logger.error(`[HIITController] Erreur lors de la récupération des entraînements disponibles: ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des entraînements HIIT',
      error: error.message
    });
  }
};

/**
 * Crée une séance HIIT personnalisée
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.createWorkout = async (req, res) => {
  try {
    const userId = req.user.id;
    const params = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Utilisateur non identifié'
      });
    }
    
    const workout = await hiitTrainingService.createWorkout(userId, params);
    
    res.status(201).json({
      success: true,
      message: 'Séance HIIT créée avec succès',
      data: workout
    });
  } catch (error) {
    logger.error(`[HIITController] Erreur lors de la création d'une séance HIIT: ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la séance HIIT',
      error: error.message
    });
  }
};

/**
 * Génère un programme HIIT sur plusieurs semaines
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.generateProgram = async (req, res) => {
  try {
    const userId = req.user.id;
    const params = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Utilisateur non identifié'
      });
    }
    
    const program = await hiitTrainingService.generateProgram(userId, params);
    
    res.status(201).json({
      success: true,
      message: 'Programme HIIT généré avec succès',
      data: program
    });
  } catch (error) {
    logger.error(`[HIITController] Erreur lors de la génération d'un programme HIIT: ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du programme HIIT',
      error: error.message
    });
  }
};

/**
 * Obtient un workout HIIT spécifique avec ses intervalles détaillés
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.getWorkoutDetails = async (req, res) => {
  try {
    const { templateId } = req.params;
    const userId = req.user.id;
    
    // Vérifier que le template existe
    const availableWorkouts = hiitTrainingService.getAvailableWorkouts();
    const workoutTemplate = availableWorkouts.find(w => w.id === templateId);
    
    if (!workoutTemplate) {
      return res.status(404).json({
        success: false,
        message: `Template d'entraînement HIIT '${templateId}' introuvable`
      });
    }
    
    // Générer une prévisualisation de la séance
    const preview = await hiitTrainingService.createWorkout(userId, { template: templateId });
    
    res.status(200).json({
      success: true,
      data: preview
    });
  } catch (error) {
    logger.error(`[HIITController] Erreur lors de la récupération des détails de la séance HIIT: ${error.message}`);
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des détails de la séance HIIT',
      error: error.message
    });
  }
};
