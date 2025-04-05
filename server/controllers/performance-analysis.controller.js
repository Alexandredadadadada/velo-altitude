/**
 * Contrôleur pour les analyses de performance intégrant nutrition et entraînement
 */

const PerformanceAnalysisService = require('../services/performance-analysis.service');
const { handleError } = require('../utils/error-handler');

/**
 * Contrôleur d'analyse de performance
 */
class PerformanceAnalysisController {
  /**
   * Analyse la corrélation entre nutrition et performance
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async analyzeNutritionPerformanceCorrelation(req, res) {
    try {
      const { userId } = req.params;
      const { days } = req.query;
      
      // Convertir days en nombre (défaut: 30)
      const daysToAnalyze = days ? parseInt(days, 10) : 30;
      
      // Vérifier que days est un nombre valide
      if (isNaN(daysToAnalyze) || daysToAnalyze <= 0 || daysToAnalyze > 365) {
        return res.status(400).json({
          error: 'Le paramètre "days" doit être un nombre entier entre 1 et 365'
        });
      }
      
      const analysis = await PerformanceAnalysisService.analyzeNutritionPerformanceCorrelation(
        userId,
        daysToAnalyze
      );
      
      if (!analysis.success) {
        return res.status(404).json({ message: analysis.message });
      }
      
      res.status(200).json(analysis);
    } catch (error) {
      handleError(res, error, 'Erreur lors de l\'analyse de corrélation nutrition-performance');
    }
  }
  
  /**
   * Analyse la nutrition pré-événement
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async analyzePreEventNutrition(req, res) {
    try {
      const { userId, eventId } = req.params;
      
      if (!eventId) {
        return res.status(400).json({
          error: 'ID d\'événement requis'
        });
      }
      
      const analysis = await PerformanceAnalysisService.analyzePreEventNutrition(
        userId,
        eventId
      );
      
      if (!analysis.success && analysis.message) {
        return res.status(404).json({ message: analysis.message });
      }
      
      res.status(200).json(analysis);
    } catch (error) {
      handleError(res, error, 'Erreur lors de l\'analyse de la nutrition pré-événement');
    }
  }
  
  /**
   * Obtient une analyse visuelle des données nutrition-performance
   * @param {Object} req - Requête Express
   * @param {Object} res - Réponse Express
   */
  async getPerformanceVisualization(req, res) {
    try {
      const { userId } = req.params;
      const { days, metric } = req.query;
      
      // Convertir days en nombre (défaut: 30)
      const daysToAnalyze = days ? parseInt(days, 10) : 30;
      
      // Vérifier que days est un nombre valide
      if (isNaN(daysToAnalyze) || daysToAnalyze <= 0 || daysToAnalyze > 365) {
        return res.status(400).json({
          error: 'Le paramètre "days" doit être un nombre entier entre 1 et 365'
        });
      }
      
      // Vérifier que la métrique est valide
      const validMetrics = ['calories', 'carbs', 'protein', 'fat', 'hydration'];
      if (metric && !validMetrics.includes(metric)) {
        return res.status(400).json({
          error: `La métrique doit être l'une des suivantes: ${validMetrics.join(', ')}`
        });
      }
      
      // Obtenir les données d'analyse
      const analysis = await PerformanceAnalysisService.analyzeNutritionPerformanceCorrelation(
        userId,
        daysToAnalyze
      );
      
      if (!analysis.success) {
        return res.status(404).json({ message: analysis.message });
      }
      
      // Préparer les données de visualisation
      const visualizationData = {
        labels: [],
        datasets: [
          {
            label: metric ? `${this._getMetricLabel(metric)}` : 'Calories',
            data: [],
            borderColor: '#36A2EB',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            yAxisID: 'y-nutrition'
          },
          {
            label: 'Score de performance',
            data: [],
            borderColor: '#FF6384',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            yAxisID: 'y-performance'
          }
        ]
      };
      
      // Remplir les données
      analysis.correlationData.forEach(dataPoint => {
        visualizationData.labels.push(dataPoint.date);
        
        if (metric) {
          switch (metric) {
            case 'carbs':
              visualizationData.datasets[0].data.push(dataPoint.nutrition.macros.carbs);
              break;
            case 'protein':
              visualizationData.datasets[0].data.push(dataPoint.nutrition.macros.protein);
              break;
            case 'fat':
              visualizationData.datasets[0].data.push(dataPoint.nutrition.macros.fat);
              break;
            case 'hydration':
              // Si nous avions des données d'hydratation
              visualizationData.datasets[0].data.push(null);
              break;
            default:
              visualizationData.datasets[0].data.push(dataPoint.nutrition.totalCalories);
          }
        } else {
          visualizationData.datasets[0].data.push(dataPoint.nutrition.totalCalories);
        }
        
        visualizationData.datasets[1].data.push(dataPoint.performance.performanceScore);
      });
      
      res.status(200).json(visualizationData);
    } catch (error) {
      handleError(res, error, 'Erreur lors de la génération des données de visualisation');
    }
  }
  
  /**
   * Obtient le libellé d'une métrique
   * @param {string} metric - Code de la métrique
   * @returns {string} Libellé de la métrique
   */
  _getMetricLabel(metric) {
    const labels = {
      calories: 'Calories',
      carbs: 'Glucides (g)',
      protein: 'Protéines (g)',
      fat: 'Lipides (g)',
      hydration: 'Hydratation (ml)'
    };
    
    return labels[metric] || metric;
  }
}

module.exports = new PerformanceAnalysisController();
