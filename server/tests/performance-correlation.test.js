/**
 * Tests du service de corrélation des performances
 */

const PerformanceCorrelationService = require('../services/performance-correlation.service');
const StatisticsHelper = require('../helpers/statistics.helper');
const TrainingService = require('../services/training.service');
const mockData = require('./mock-data/training-mock-data');

// Mock des dépendances
jest.mock('../services/training.service');
jest.mock('../services/training-zones.service');
jest.mock('../services/nutrition.service');
jest.mock('../services/performance-analysis.service');

describe('PerformanceCorrelationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock des activités pour les tests
    TrainingService.getUserActivities.mockResolvedValue(mockData.activities);
    TrainingService.getUserProfile.mockResolvedValue(mockData.userProfile);
    TrainingService.getUserStats.mockResolvedValue(mockData.userStats);
  });

  describe('analyzeTrainingPerformanceCorrelations', () => {
    it('devrait analyser correctement les corrélations entre métriques d\'entraînement', async () => {
      // Exécution
      const result = await PerformanceCorrelationService.analyzeTrainingPerformanceCorrelations('user123', {
        period: 30,
        metrics: ['duration', 'distance', 'averagePower']
      });

      // Vérifications
      expect(result).toBeDefined();
      expect(result.trainingMetrics).toBeDefined();
      expect(result.correlations).toBeDefined();
      expect(result.insights).toBeInstanceOf(Array);
      expect(TrainingService.getUserActivities).toHaveBeenCalledWith('user123', expect.objectContaining({
        startDate: expect.any(String)
      }));
    });

    it('devrait gérer correctement le cas sans données suffisantes', async () => {
      // Mock avec données insuffisantes
      TrainingService.getUserActivities.mockResolvedValueOnce([]);

      // Exécution et vérification
      await expect(PerformanceCorrelationService.analyzeTrainingPerformanceCorrelations('user123'))
        .rejects.toThrow('Données insuffisantes');
    });
  });

  describe('compareWithSimilarAthletes', () => {
    it('devrait comparer correctement avec des cyclistes similaires', async () => {
      // Exécution
      const result = await PerformanceCorrelationService.compareWithSimilarAthletes('user123', {
        count: 3
      });

      // Vérifications
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.similarAthletes).toBeInstanceOf(Array);
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(TrainingService.getUserProfile).toHaveBeenCalledWith('user123');
    });
  });

  describe('generateAdvancedMetricsVisualizations', () => {
    it('devrait générer correctement les visualisations pour les métriques avancées', async () => {
      // Exécution
      const result = await PerformanceCorrelationService.generateAdvancedMetricsVisualizations('user123', {
        period: 30,
        metrics: ['tss', 'ctl', 'atl']
      });

      // Vérifications
      expect(result).toBeDefined();
      expect(result.metrics).toBeDefined();
      expect(result.timeSeriesData).toBeInstanceOf(Array);
      if (result.explanations) {
        expect(result.explanations.tss).toBeDefined();
      }
    });
  });

  describe('predictEventPerformance', () => {
    it('devrait prédire correctement les performances pour un événement', async () => {
      // Exécution
      const result = await PerformanceCorrelationService.predictEventPerformance('user123', 'event456', {
        includeTrainingReadiness: true
      });

      // Vérifications
      expect(result).toBeDefined();
      expect(result.predictions).toBeDefined();
      expect(result.eventId).toBe('event456');
      if (result.trainingReadiness) {
        expect(result.trainingReadiness.score).toBeDefined();
      }
      if (result.recommendations) {
        expect(result.recommendations).toBeInstanceOf(Array);
      }
    });
  });
});

// Tests pour le helper statistique
describe('StatisticsHelper', () => {
  describe('calculatePearsonCorrelation', () => {
    it('devrait calculer correctement le coefficient de corrélation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 5, 4, 5];
      
      const result = StatisticsHelper.calculatePearsonCorrelation(x, y);
      
      // La corrélation devrait être positive et forte
      expect(result).toBeGreaterThan(0.7);
      expect(result).toBeLessThanOrEqual(1);
    });
    
    it('devrait renvoyer 0 pour des données sans corrélation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [5, 2, 4, 1, 3];
      
      const result = StatisticsHelper.calculatePearsonCorrelation(x, y);
      
      // La corrélation devrait être proche de 0
      expect(Math.abs(result)).toBeLessThan(0.3);
    });
    
    it('devrait gérer le cas des entrées invalides', () => {
      expect(StatisticsHelper.calculatePearsonCorrelation([], [])).toBe(0);
      expect(StatisticsHelper.calculatePearsonCorrelation(null, [1, 2, 3])).toBe(0);
      expect(StatisticsHelper.calculatePearsonCorrelation([1, 2], [1])).toBe(0);
    });
  });
  
  describe('detectTrend', () => {
    it('devrait détecter correctement une tendance croissante', () => {
      const data = [
        { date: new Date('2023-01-01'), value: 100 },
        { date: new Date('2023-01-02'), value: 110 },
        { date: new Date('2023-01-03'), value: 105 },
        { date: new Date('2023-01-04'), value: 120 },
        { date: new Date('2023-01-05'), value: 125 }
      ];
      
      const result = StatisticsHelper.detectTrend(data);
      
      expect(result.trend).toBe('increasing');
      expect(result.coefficient).toBeGreaterThan(0);
    });
    
    it('devrait détecter correctement une tendance décroissante', () => {
      const data = [
        { date: new Date('2023-01-01'), value: 120 },
        { date: new Date('2023-01-02'), value: 115 },
        { date: new Date('2023-01-03'), value: 105 },
        { date: new Date('2023-01-04'), value: 100 },
        { date: new Date('2023-01-05'), value: 90 }
      ];
      
      const result = StatisticsHelper.detectTrend(data);
      
      expect(result.trend).toBe('decreasing');
      expect(result.coefficient).toBeLessThan(0);
    });
  });
  
  describe('calculateTrainingLoadStats', () => {
    it('devrait calculer correctement les métriques de charge d\'entraînement', () => {
      const activities = [
        { date: new Date('2023-01-01'), tss: 50 },
        { date: new Date('2023-01-03'), tss: 80 },
        { date: new Date('2023-01-05'), tss: 120 },
        { date: new Date('2023-01-07'), tss: 60 },
        { date: new Date('2023-01-10'), tss: 90 }
      ];
      
      const result = StatisticsHelper.calculateTrainingLoadStats(activities);
      
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result[result.length - 1]).toHaveProperty('ctl');
      expect(result[result.length - 1]).toHaveProperty('atl');
      expect(result[result.length - 1]).toHaveProperty('tsb');
    });
  });
});
