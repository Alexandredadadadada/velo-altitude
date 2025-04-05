// controllers/elevation-profile.controller.js - Contrôleur pour les profils d'élévation enrichis
const elevationProfileModel = require('../models/elevation-profile.model');
const passModel = require('../models/pass.model');

/**
 * Contrôleur pour la gestion des profils d'élévation enrichis
 */
class ElevationProfileController {
  /**
   * Analyse un profil d'élévation
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async analyzeProfile(req, res) {
    try {
      const { elevationData } = req.body;
      
      if (!elevationData || !Array.isArray(elevationData) || elevationData.length < 2) {
        return res.status(400).json({
          status: 'error',
          message: 'Données d\'élévation invalides. Fournir un tableau de points [distance, altitude]'
        });
      }
      
      const analysis = elevationProfileModel.analyzeProfile(elevationData);
      
      return res.status(200).json({
        status: 'success',
        data: analysis
      });
    } catch (error) {
      console.error('Erreur lors de l\'analyse du profil d\'élévation:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue lors de l\'analyse du profil d\'élévation',
        error: error.message
      });
    }
  }

  /**
   * Récupère l'analyse complète d'un col par son ID
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getPassAnalysis(req, res) {
    try {
      const { id } = req.params;
      const pass = passModel.getPassById(id);
      
      if (!pass) {
        return res.status(404).json({
          status: 'error',
          message: `Col avec l'ID ${id} non trouvé`
        });
      }
      
      // Vérifier si les données d'élévation existent
      if (!pass.elevationProfile || !Array.isArray(pass.elevationProfile) || pass.elevationProfile.length < 2) {
        return res.status(400).json({
          status: 'error',
          message: 'Ce col ne possède pas de données d\'élévation valides'
        });
      }
      
      // Analyser le profil d'élévation
      const elevationAnalysis = elevationProfileModel.analyzeProfile(pass.elevationProfile);
      
      // Récupérer les données météo historiques si les coordonnées sont disponibles
      let weatherData = null;
      if (pass.coordinates && pass.coordinates.length === 2) {
        const [latitude, longitude] = pass.coordinates;
        weatherData = await elevationProfileModel.getHistoricalWeather(latitude, longitude);
      }
      
      return res.status(200).json({
        status: 'success',
        data: {
          pass,
          elevationAnalysis,
          weatherData
        }
      });
    } catch (error) {
      console.error(`Erreur lors de l'analyse du col ${req.params.id}:`, error);
      return res.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue lors de l\'analyse du col',
        error: error.message
      });
    }
  }

  /**
   * Récupère les données météo historiques pour un col
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getPassWeather(req, res) {
    try {
      const { id } = req.params;
      const pass = passModel.getPassById(id);
      
      if (!pass) {
        return res.status(404).json({
          status: 'error',
          message: `Col avec l'ID ${id} non trouvé`
        });
      }
      
      // Vérifier si les coordonnées existent
      if (!pass.coordinates || pass.coordinates.length !== 2) {
        return res.status(400).json({
          status: 'error',
          message: 'Ce col ne possède pas de coordonnées valides'
        });
      }
      
      const [latitude, longitude] = pass.coordinates;
      const weatherData = await elevationProfileModel.getHistoricalWeather(latitude, longitude);
      
      return res.status(200).json({
        status: 'success',
        data: {
          pass: {
            id: pass.id,
            name: pass.name,
            elevation: pass.elevation
          },
          weatherData
        }
      });
    } catch (error) {
      console.error(`Erreur lors de la récupération des données météo pour le col ${req.params.id}:`, error);
      return res.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue lors de la récupération des données météo',
        error: error.message
      });
    }
  }

  /**
   * Compare deux cols
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async comparePasses(req, res) {
    try {
      const { id1, id2 } = req.query;
      
      if (!id1 || !id2) {
        return res.status(400).json({
          status: 'error',
          message: 'Fournir deux IDs de cols à comparer'
        });
      }
      
      const pass1 = passModel.getPassById(id1);
      const pass2 = passModel.getPassById(id2);
      
      if (!pass1) {
        return res.status(404).json({
          status: 'error',
          message: `Col avec l'ID ${id1} non trouvé`
        });
      }
      
      if (!pass2) {
        return res.status(404).json({
          status: 'error',
          message: `Col avec l'ID ${id2} non trouvé`
        });
      }
      
      // Comparer les caractéristiques principales
      const comparison = {
        passes: [
          {
            id: pass1.id,
            name: pass1.name,
            elevation: pass1.elevation,
            length: pass1.length,
            averageGradient: pass1.averageGradient,
            maxGradient: pass1.maxGradient,
            difficulty: pass1.difficulty
          },
          {
            id: pass2.id,
            name: pass2.name,
            elevation: pass2.elevation,
            length: pass2.length,
            averageGradient: pass2.averageGradient,
            maxGradient: pass2.maxGradient,
            difficulty: pass2.difficulty
          }
        ],
        differences: {
          elevation: pass1.elevation - pass2.elevation,
          length: pass1.length - pass2.length,
          averageGradient: pass1.averageGradient - pass2.averageGradient,
          maxGradient: pass1.maxGradient - pass2.maxGradient
        },
        relativeComparison: {
          elevation: this._getRelativeComparison(pass1.elevation, pass2.elevation),
          length: this._getRelativeComparison(pass1.length, pass2.length),
          averageGradient: this._getRelativeComparison(pass1.averageGradient, pass2.averageGradient),
          maxGradient: this._getRelativeComparison(pass1.maxGradient, pass2.maxGradient)
        }
      };
      
      return res.status(200).json({
        status: 'success',
        data: comparison
      });
    } catch (error) {
      console.error('Erreur lors de la comparaison des cols:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue lors de la comparaison des cols',
        error: error.message
      });
    }
  }
  
  /**
   * Génère une description comparative entre deux valeurs
   * @param {number} value1 - Première valeur
   * @param {number} value2 - Seconde valeur
   * @returns {string} Description comparative
   * @private
   */
  _getRelativeComparison(value1, value2) {
    const diff = value1 - value2;
    const percentage = (diff / value2) * 100;
    
    if (Math.abs(percentage) < 5) {
      return "Comparable";
    }
    
    if (diff > 0) {
      if (percentage > 50) {
        return "Beaucoup plus élevé";
      } else if (percentage > 20) {
        return "Significativement plus élevé";
      } else {
        return "Légèrement plus élevé";
      }
    } else {
      if (percentage < -50) {
        return "Beaucoup plus faible";
      } else if (percentage < -20) {
        return "Significativement plus faible";
      } else {
        return "Légèrement plus faible";
      }
    }
  }
}

module.exports = new ElevationProfileController();
