// controllers/visualization.controller.js - Contrôleur pour les visualisations avancées
const visualizationModel = require('../models/visualization.model');
const passModel = require('../models/pass.model');
const routePlannerModel = require('../models/route-planner.model');

/**
 * Contrôleur pour la gestion des visualisations avancées
 */
class VisualizationController {
  /**
   * Récupère les données de visualisation segmentée par couleur pour un col
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  getPassVisualization(req, res) {
    try {
      const { passId } = req.params;
      
      // Vérifier si le col existe
      const pass = passModel.getPassById(passId);
      if (!pass) {
        return res.status(404).json({
          status: 'error',
          message: `Col avec l'ID ${passId} non trouvé`
        });
      }
      
      // Générer les données de visualisation
      const visualizationData = visualizationModel.generatePassVisualization(passId);
      
      return res.status(200).json({
        status: 'success',
        data: visualizationData
      });
    } catch (error) {
      console.error('Erreur lors de la génération de la visualisation du col:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue lors de la génération de la visualisation',
        error: error.message
      });
    }
  }

  /**
   * Récupère les données de visualisation 3D pour un col
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  get3DPassVisualization(req, res) {
    try {
      const { passId } = req.params;
      
      // Vérifier si le col existe
      const pass = passModel.getPassById(passId);
      if (!pass) {
        return res.status(404).json({
          status: 'error',
          message: `Col avec l'ID ${passId} non trouvé`
        });
      }
      
      // Générer les données de visualisation 3D
      const visualizationData = visualizationModel.generate3DPassVisualization(passId);
      
      return res.status(200).json({
        status: 'success',
        data: visualizationData
      });
    } catch (error) {
      console.error('Erreur lors de la génération de la visualisation 3D du col:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue lors de la génération de la visualisation 3D',
        error: error.message
      });
    }
  }

  /**
   * Récupère les annotations pour un itinéraire
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  getRouteAnnotations(req, res) {
    try {
      const { routeId } = req.params;
      
      // Vérifier si l'itinéraire existe
      const route = routePlannerModel.getRouteById(routeId);
      if (!route) {
        return res.status(404).json({
          status: 'error',
          message: `Itinéraire avec l'ID ${routeId} non trouvé`
        });
      }
      
      // Générer les annotations
      const annotationsData = visualizationModel.generateRouteAnnotations(routeId);
      
      return res.status(200).json({
        status: 'success',
        data: annotationsData
      });
    } catch (error) {
      console.error('Erreur lors de la génération des annotations de l\'itinéraire:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Une erreur est survenue lors de la génération des annotations',
        error: error.message
      });
    }
  }

  /**
   * Compare deux cols et retourne les données de visualisation comparative
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  comparePassesVisualization(req, res) {
    try {
      const { passId1, passId2 } = req.params;
      
      // Vérifier si les cols existent
      const pass1 = passModel.getPassById(passId1);
      const pass2 = passModel.getPassById(passId2);
      
      if (!pass1) {
        return res.status(404).json({
          status: 'error',
          message: `Col avec l'ID ${passId1} non trouvé`
        });
      }
      
      if (!pass2) {
        return res.status(404).json({
          status: 'error',
          message: `Col avec l'ID ${passId2} non trouvé`
        });
      }
      
      // Générer les visualisations pour les deux cols
      const visualization1 = visualizationModel.generatePassVisualization(passId1);
      const visualization2 = visualizationModel.generatePassVisualization(passId2);
      
      // Créer les données comparatives
      const comparisonData = this._createComparisonData(visualization1, visualization2);
      
      return res.status(200).json({
        status: 'success',
        data: comparisonData
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
   * Crée les données comparatives entre deux cols
   * @param {Object} visualization1 - Données de visualisation du premier col
   * @param {Object} visualization2 - Données de visualisation du deuxième col
   * @returns {Object} Données comparatives
   * @private
   */
  _createComparisonData(visualization1, visualization2) {
    // Calculer les différences entre les cols
    const elevationGainDiff = visualization1.summary.elevationGain - visualization2.summary.elevationGain;
    const lengthDiff = visualization1.length - visualization2.length;
    const averageGradientDiff = visualization1.summary.averageGradient - visualization2.summary.averageGradient;
    const maxGradientDiff = visualization1.summary.maxGradient - visualization2.summary.maxGradient;
    
    return {
      pass1: {
        id: visualization1.id,
        name: visualization1.name,
        visualization: visualization1
      },
      pass2: {
        id: visualization2.id,
        name: visualization2.name,
        visualization: visualization2
      },
      comparison: {
        length: {
          pass1: visualization1.length,
          pass2: visualization2.length,
          difference: lengthDiff,
          percentageDiff: (lengthDiff / visualization2.length * 100).toFixed(2)
        },
        elevationGain: {
          pass1: visualization1.summary.elevationGain,
          pass2: visualization2.summary.elevationGain,
          difference: elevationGainDiff,
          percentageDiff: (elevationGainDiff / visualization2.summary.elevationGain * 100).toFixed(2)
        },
        averageGradient: {
          pass1: visualization1.summary.averageGradient,
          pass2: visualization2.summary.averageGradient,
          difference: averageGradientDiff,
          percentageDiff: (averageGradientDiff / visualization2.summary.averageGradient * 100).toFixed(2)
        },
        maxGradient: {
          pass1: visualization1.summary.maxGradient,
          pass2: visualization2.summary.maxGradient,
          difference: maxGradientDiff,
          percentageDiff: (maxGradientDiff / visualization2.summary.maxGradient * 100).toFixed(2)
        },
        difficulty: {
          pass1: visualization1.difficulty,
          pass2: visualization2.difficulty,
          comparison: this._compareDifficulty(visualization1.difficulty, visualization2.difficulty)
        },
        segmentsByDifficulty: this._compareSegmentDistribution(
          visualization1.segmentsByDifficulty, 
          visualization2.segmentsByDifficulty
        )
      },
      analysisText: this._generateComparisonAnalysis(visualization1, visualization2)
    };
  }

  /**
   * Compare la difficulté entre deux cols
   * @param {string} difficulty1 - Difficulté du premier col
   * @param {string} difficulty2 - Difficulté du deuxième col
   * @returns {string} Texte de comparaison
   * @private
   */
  _compareDifficulty(difficulty1, difficulty2) {
    const difficultyScale = {
      'easy': 1,
      'moderate': 2,
      'difficult': 3,
      'very difficult': 4,
      'extreme': 5,
      'facile': 1,
      'modéré': 2,
      'difficile': 3,
      'très difficile': 4,
      'extrême': 5
    };
    
    const d1 = difficultyScale[difficulty1.toLowerCase()] || 3;
    const d2 = difficultyScale[difficulty2.toLowerCase()] || 3;
    
    if (d1 === d2) return "Même niveau de difficulté";
    if (d1 > d2) return `${difficulty1} est plus difficile que ${difficulty2}`;
    return `${difficulty1} est plus facile que ${difficulty2}`;
  }

  /**
   * Compare la distribution des segments par difficulté
   * @param {Array} segments1 - Segments du premier col
   * @param {Array} segments2 - Segments du deuxième col
   * @returns {Object} Comparaison des distributions
   * @private
   */
  _compareSegmentDistribution(segments1, segments2) {
    const result = {};
    
    // Créer un dictionnaire pour les segments du deuxième col
    const segments2Dict = {};
    segments2.forEach(segment => {
      segments2Dict[segment.difficulty] = segment;
    });
    
    segments1.forEach(segment1 => {
      const difficulty = segment1.difficulty;
      const segment2 = segments2Dict[difficulty] || { percentage: 0, totalLength: 0 };
      
      result[difficulty] = {
        percentagePass1: segment1.percentage,
        percentagePass2: segment2.percentage,
        difference: segment1.percentage - segment2.percentage,
        lengthPass1: segment1.totalLength,
        lengthPass2: segment2.totalLength
      };
    });
    
    // Ajouter les difficultés qui sont dans segments2 mais pas dans segments1
    segments2.forEach(segment2 => {
      if (!result[segment2.difficulty]) {
        result[segment2.difficulty] = {
          percentagePass1: 0,
          percentagePass2: segment2.percentage,
          difference: -segment2.percentage,
          lengthPass1: 0,
          lengthPass2: segment2.totalLength
        };
      }
    });
    
    return result;
  }

  /**
   * Génère un texte d'analyse comparative
   * @param {Object} visualization1 - Visualisation du premier col
   * @param {Object} visualization2 - Visualisation du deuxième col
   * @returns {Array} Textes d'analyse
   * @private
   */
  _generateComparisonAnalysis(visualization1, visualization2) {
    const analysis = [];
    
    // Comparaison de la longueur
    if (visualization1.length > visualization2.length) {
      analysis.push(`${visualization1.name} est plus long de ${(visualization1.length - visualization2.length).toFixed(1)}km par rapport à ${visualization2.name}.`);
    } else if (visualization1.length < visualization2.length) {
      analysis.push(`${visualization1.name} est plus court de ${(visualization2.length - visualization1.length).toFixed(1)}km par rapport à ${visualization2.name}.`);
    } else {
      analysis.push(`${visualization1.name} et ${visualization2.name} ont la même longueur (${visualization1.length}km).`);
    }
    
    // Comparaison du dénivelé
    if (visualization1.summary.elevationGain > visualization2.summary.elevationGain) {
      analysis.push(`${visualization1.name} présente un dénivelé positif supérieur de ${(visualization1.summary.elevationGain - visualization2.summary.elevationGain).toFixed(0)}m.`);
    } else if (visualization1.summary.elevationGain < visualization2.summary.elevationGain) {
      analysis.push(`${visualization1.name} présente un dénivelé positif inférieur de ${(visualization2.summary.elevationGain - visualization1.summary.elevationGain).toFixed(0)}m.`);
    } else {
      analysis.push(`Les deux cols présentent le même dénivelé positif (${visualization1.summary.elevationGain}m).`);
    }
    
    // Comparaison de la pente moyenne
    if (visualization1.summary.averageGradient > visualization2.summary.averageGradient) {
      analysis.push(`La pente moyenne de ${visualization1.name} (${visualization1.summary.averageGradient.toFixed(1)}%) est plus raide que celle de ${visualization2.name} (${visualization2.summary.averageGradient.toFixed(1)}%).`);
    } else if (visualization1.summary.averageGradient < visualization2.summary.averageGradient) {
      analysis.push(`La pente moyenne de ${visualization1.name} (${visualization1.summary.averageGradient.toFixed(1)}%) est plus douce que celle de ${visualization2.name} (${visualization2.summary.averageGradient.toFixed(1)}%).`);
    } else {
      analysis.push(`Les deux cols ont la même pente moyenne (${visualization1.summary.averageGradient.toFixed(1)}%).`);
    }
    
    // Comparaison de la pente maximale
    if (visualization1.summary.maxGradient > visualization2.summary.maxGradient) {
      analysis.push(`${visualization1.name} possède des passages plus raides, avec une pente maximale de ${visualization1.summary.maxGradient.toFixed(1)}% contre ${visualization2.summary.maxGradient.toFixed(1)}% pour ${visualization2.name}.`);
    } else if (visualization1.summary.maxGradient < visualization2.summary.maxGradient) {
      analysis.push(`${visualization2.name} possède des passages plus raides, avec une pente maximale de ${visualization2.summary.maxGradient.toFixed(1)}% contre ${visualization1.summary.maxGradient.toFixed(1)}% pour ${visualization1.name}.`);
    } else {
      analysis.push(`Les deux cols ont la même pente maximale (${visualization1.summary.maxGradient.toFixed(1)}%).`);
    }
    
    // Recommandation finale
    analysis.push(this._generateFinalRecommendation(visualization1, visualization2));
    
    return analysis;
  }

  /**
   * Génère une recommandation finale pour la comparaison
   * @param {Object} visualization1 - Visualisation du premier col
   * @param {Object} visualization2 - Visualisation du deuxième col
   * @returns {string} Recommandation
   * @private
   */
  _generateFinalRecommendation(visualization1, visualization2) {
    const difficultyScale = {
      'easy': 1,
      'moderate': 2,
      'difficult': 3,
      'very difficult': 4,
      'extreme': 5,
      'facile': 1,
      'modéré': 2,
      'difficile': 3,
      'très difficile': 4,
      'extrême': 5
    };
    
    const d1 = difficultyScale[visualization1.difficulty.toLowerCase()] || 3;
    const d2 = difficultyScale[visualization2.difficulty.toLowerCase()] || 3;
    
    // Points forts de chaque col
    const strengths1 = [];
    const strengths2 = [];
    
    if (visualization1.length < visualization2.length) {
      strengths1.push("plus court");
    } else if (visualization1.length > visualization2.length) {
      strengths2.push("plus court");
    }
    
    if (visualization1.summary.averageGradient < visualization2.summary.averageGradient) {
      strengths1.push("pente moyenne plus douce");
    } else if (visualization1.summary.averageGradient > visualization2.summary.averageGradient) {
      strengths2.push("pente moyenne plus douce");
    }
    
    if (visualization1.summary.maxGradient < visualization2.summary.maxGradient) {
      strengths1.push("passages moins abrupts");
    } else if (visualization1.summary.maxGradient > visualization2.summary.maxGradient) {
      strengths2.push("passages moins abrupts");
    }
    
    let recommendation = "En conclusion, ";
    
    if (d1 < d2) {
      recommendation += `${visualization1.name} est globalement plus accessible`;
      if (strengths1.length > 0) {
        recommendation += ` car il est ${strengths1.join(" et ")}`;
      }
      recommendation += `. ${visualization2.name} conviendra davantage aux cyclistes cherchant un défi plus relevé`;
      if (strengths2.length > 0) {
        recommendation += `, bien qu'il présente l'avantage d'être ${strengths2.join(" et ")}`;
      }
      recommendation += ".";
    } else if (d1 > d2) {
      recommendation += `${visualization2.name} est globalement plus accessible`;
      if (strengths2.length > 0) {
        recommendation += ` car il est ${strengths2.join(" et ")}`;
      }
      recommendation += `. ${visualization1.name} conviendra davantage aux cyclistes cherchant un défi plus relevé`;
      if (strengths1.length > 0) {
        recommendation += `, bien qu'il présente l'avantage d'être ${strengths1.join(" et ")}`;
      }
      recommendation += ".";
    } else {
      recommendation += `les deux cols présentent un niveau de difficulté comparable`;
      if (strengths1.length > 0) {
        recommendation += `, avec ${visualization1.name} qui se distingue par ${strengths1.join(" et ")}`;
      }
      if (strengths2.length > 0) {
        recommendation += ` et ${visualization2.name} qui offre l'avantage d'être ${strengths2.join(" et ")}`;
      }
      recommendation += ".";
    }
    
    return recommendation;
  }
}

module.exports = new VisualizationController();
