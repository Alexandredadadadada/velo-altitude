// controllers/pass.controller.js - Contrôleur pour les cols cyclistes
const passModel = require('../models/pass.model');

/**
 * Contrôleur pour la gestion des cols cyclistes
 */
class PassController {
  /**
   * Récupère tous les cols
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  getAllPasses(req, res) {
    try {
      const passes = passModel.getAllPasses();
      
      // Filtrage par pays si spécifié
      const { country, region, difficulty } = req.query;
      let filteredPasses = passes;
      
      if (country) {
        filteredPasses = filteredPasses.filter(pass => 
          pass.country.toLowerCase() === country.toLowerCase());
      }
      
      if (region) {
        filteredPasses = filteredPasses.filter(pass => 
          pass.region.toLowerCase() === region.toLowerCase());
      }
      
      if (difficulty) {
        filteredPasses = filteredPasses.filter(pass => 
          pass.difficulty === difficulty);
      }
      
      return res.status(200).json({
        status: 'success',
        count: filteredPasses.length,
        data: filteredPasses
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des cols:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue lors de la récupération des cols',
        error: error.message
      });
    }
  }

  /**
   * Récupère un col par son ID
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  getPassById(req, res) {
    try {
      const { id } = req.params;
      const pass = passModel.getPassById(id);
      
      if (!pass) {
        return res.status(404).json({
          status: 'error',
          message: `Col avec l'ID ${id} non trouvé`
        });
      }
      
      return res.status(200).json({
        status: 'success',
        data: pass
      });
    } catch (error) {
      console.error(`Erreur lors de la récupération du col ${req.params.id}:`, error);
      return res.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue lors de la récupération du col',
        error: error.message
      });
    }
  }

  /**
   * Crée un nouveau col
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  createPass(req, res) {
    try {
      // Validation des données minimales requises
      const { name, elevation, length, averageGradient, country, region } = req.body;
      
      if (!name || !elevation || !length || !averageGradient || !country || !region) {
        return res.status(400).json({
          status: 'error',
          message: 'Données incomplètes. Veuillez fournir au moins le nom, l\'altitude, la longueur, la pente moyenne, le pays et la région'
        });
      }
      
      const newPass = passModel.addPass(req.body);
      
      return res.status(201).json({
        status: 'success',
        message: 'Col créé avec succès',
        data: newPass
      });
    } catch (error) {
      console.error('Erreur lors de la création du col:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue lors de la création du col',
        error: error.message
      });
    }
  }

  /**
   * Met à jour un col existant
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  updatePass(req, res) {
    try {
      const { id } = req.params;
      const updatedPass = passModel.updatePass(id, req.body);
      
      if (!updatedPass) {
        return res.status(404).json({
          status: 'error',
          message: `Col avec l'ID ${id} non trouvé`
        });
      }
      
      return res.status(200).json({
        status: 'success',
        message: 'Col mis à jour avec succès',
        data: updatedPass
      });
    } catch (error) {
      console.error(`Erreur lors de la mise à jour du col ${req.params.id}:`, error);
      return res.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue lors de la mise à jour du col',
        error: error.message
      });
    }
  }

  /**
   * Supprime un col
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  deletePass(req, res) {
    try {
      const { id } = req.params;
      const deleted = passModel.deletePass(id);
      
      if (!deleted) {
        return res.status(404).json({
          status: 'error',
          message: `Col avec l'ID ${id} non trouvé`
        });
      }
      
      return res.status(200).json({
        status: 'success',
        message: 'Col supprimé avec succès'
      });
    } catch (error) {
      console.error(`Erreur lors de la suppression du col ${req.params.id}:`, error);
      return res.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue lors de la suppression du col',
        error: error.message
      });
    }
  }
}

module.exports = new PassController();
