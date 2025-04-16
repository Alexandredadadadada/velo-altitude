/**
 * Système de détection d'anomalies pour la visualisation météorologique
 * Détecte les variations anormales dans les métriques de performance
 */

import { PerformanceMetrics } from './WeatherVisualizationMonitoring';

// Configuration du détecteur d'anomalies
export interface AnomalyDetectorConfig {
  sensitivityLevel: 'low' | 'medium' | 'high';
  metricsToMonitor: Array<keyof PerformanceMetrics>;
  historySize: number;
  outlierThreshold: number; // En écarts-types
}

// Anomalie détectée
export interface DetectedAnomaly {
  timestamp: number;
  type: string;
  metric: keyof PerformanceMetrics;
  value: number;
  expectedRange: {
    min: number;
    max: number;
  };
  deviation: number; // En écarts-types
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

/**
 * Classe principale pour la détection d'anomalies
 */
export class AnomalyDetector {
  private config: AnomalyDetectorConfig;
  private metricHistory: Map<keyof PerformanceMetrics, number[]> = new Map();
  private metricStats: Map<keyof PerformanceMetrics, {
    mean: number;
    stdDev: number;
    min: number;
    max: number;
    trend: 'stable' | 'improving' | 'degrading';
  }> = new Map();
  private anomalyHistory: DetectedAnomaly[] = [];
  private maxAnomalyHistorySize: number = 100;
  
  /**
   * Constructeur
   * @param config Configuration du détecteur
   */
  constructor(config: Partial<AnomalyDetectorConfig> = {}) {
    // Configuration par défaut
    this.config = {
      sensitivityLevel: 'medium',
      metricsToMonitor: ['fps', 'frameTime', 'memoryUsage', 'apiLatency'],
      historySize: 60, // 1 minute à 1 Hz
      outlierThreshold: 2.0, // Écarts-types
      ...config
    };
    
    // Ajuster le seuil en fonction de la sensibilité
    if (this.config.sensitivityLevel === 'low') {
      this.config.outlierThreshold = 3.0;
    } else if (this.config.sensitivityLevel === 'high') {
      this.config.outlierThreshold = 1.5;
    }
    
    // Initialiser l'historique des métriques
    for (const metric of this.config.metricsToMonitor) {
      this.metricHistory.set(metric, []);
      this.metricStats.set(metric, {
        mean: 0,
        stdDev: 0,
        min: 0,
        max: 0,
        trend: 'stable'
      });
    }
    
    console.log('Anomaly Detector initialized with configuration:', this.config);
  }
  
  /**
   * Détecte les anomalies dans les métriques actuelles
   * @param metrics Métriques actuelles
   * @returns Liste des anomalies détectées
   */
  public detect(metrics: PerformanceMetrics): DetectedAnomaly[] {
    // Mettre à jour l'historique des métriques
    this.updateMetricHistory(metrics);
    
    // Calculer les statistiques
    this.calculateStats();
    
    // Détecter les anomalies
    const anomalies: DetectedAnomaly[] = [];
    
    for (const metric of this.config.metricsToMonitor) {
      const value = metrics[metric];
      const stats = this.metricStats.get(metric);
      
      if (value === undefined || !stats) continue;
      
      // Calculer la déviation en écarts-types
      const deviation = Math.abs(value - stats.mean) / (stats.stdDev || 1);
      
      // Vérifier si c'est une anomalie
      if (deviation > this.config.outlierThreshold) {
        const anomaly = this.createAnomaly(metric, value, stats, deviation);
        anomalies.push(anomaly);
        
        // Ajouter à l'historique
        this.anomalyHistory.push(anomaly);
        
        // Limiter la taille de l'historique
        if (this.anomalyHistory.length > this.maxAnomalyHistorySize) {
          this.anomalyHistory.shift();
        }
      }
    }
    
    return anomalies;
  }
  
  /**
   * Crée une anomalie à partir des données
   */
  private createAnomaly(
    metric: keyof PerformanceMetrics,
    value: number,
    stats: {
      mean: number;
      stdDev: number;
      min: number;
      max: number;
      trend: 'stable' | 'improving' | 'degrading';
    },
    deviation: number
  ): DetectedAnomaly {
    // Déterminer le type d'anomalie
    let type = '';
    let severity: 'info' | 'warning' | 'critical' = 'info';
    
    // Format de message dépendant de la métrique
    let message = '';
    
    // Intervalles acceptables
    const expectedRange = {
      min: stats.mean - stats.stdDev * this.config.outlierThreshold,
      max: stats.mean + stats.stdDev * this.config.outlierThreshold
    };
    
    switch (metric) {
      case 'fps':
        if (value < stats.mean) {
          type = 'low_fps';
          message = `FPS anormalement bas (${value.toFixed(1)} vs moyenne de ${stats.mean.toFixed(1)})`;
          
          severity = value < 20 ? 'critical' : value < 30 ? 'warning' : 'info';
        } else {
          type = 'high_fps';
          message = `FPS exceptionnellement élevé (${value.toFixed(1)} vs moyenne de ${stats.mean.toFixed(1)})`;
          severity = 'info';
        }
        break;
        
      case 'frameTime':
        if (value > stats.mean) {
          type = 'high_frame_time';
          message = `Temps de frame anormalement élevé (${value.toFixed(2)}ms vs moyenne de ${stats.mean.toFixed(2)}ms)`;
          severity = value > 50 ? 'critical' : value > 33 ? 'warning' : 'info';
        } else {
          type = 'low_frame_time';
          message = `Temps de frame exceptionnellement bas (${value.toFixed(2)}ms vs moyenne de ${stats.mean.toFixed(2)}ms)`;
          severity = 'info';
        }
        break;
        
      case 'memoryUsage':
        if (value > stats.mean) {
          type = 'high_memory';
          message = `Utilisation mémoire anormalement élevée (${value.toFixed(1)}MB vs moyenne de ${stats.mean.toFixed(1)}MB)`;
          severity = deviation > 3 ? 'critical' : 'warning';
        }
        break;
        
      case 'apiLatency':
        if (value > stats.mean) {
          type = 'high_api_latency';
          message = `Latence API anormalement élevée (${value.toFixed(0)}ms vs moyenne de ${stats.mean.toFixed(0)}ms)`;
          severity = value > 2000 ? 'critical' : value > 1000 ? 'warning' : 'info';
        }
        break;
        
      case 'particleCount':
        if (value > stats.mean) {
          type = 'high_particle_count';
          message = `Nombre de particules anormalement élevé (${value.toFixed(0)} vs moyenne de ${stats.mean.toFixed(0)})`;
          severity = deviation > 3 ? 'warning' : 'info';
        }
        break;
        
      default:
        if (value > stats.mean) {
          type = `high_${String(metric)}`;
          message = `${String(metric)} anormalement élevé (${value} vs moyenne de ${stats.mean})`;
        } else {
          type = `low_${String(metric)}`;
          message = `${String(metric)} anormalement bas (${value} vs moyenne de ${stats.mean})`;
        }
        severity = deviation > 3 ? 'warning' : 'info';
    }
    
    return {
      timestamp: Date.now(),
      type,
      metric,
      value,
      expectedRange,
      deviation,
      severity,
      message
    };
  }
  
  /**
   * Met à jour l'historique des métriques
   */
  private updateMetricHistory(metrics: PerformanceMetrics): void {
    for (const metric of this.config.metricsToMonitor) {
      const value = metrics[metric];
      
      if (value === undefined) continue;
      
      const history = this.metricHistory.get(metric) || [];
      history.push(value);
      
      // Limiter la taille de l'historique
      if (history.length > this.config.historySize) {
        history.shift();
      }
      
      this.metricHistory.set(metric, history);
    }
  }
  
  /**
   * Calcule les statistiques pour chaque métrique
   */
  private calculateStats(): void {
    for (const metric of this.config.metricsToMonitor) {
      const history = this.metricHistory.get(metric) || [];
      
      if (history.length < 5) continue; // Pas assez de données
      
      // Calculer la moyenne
      const sum = history.reduce((acc, val) => acc + val, 0);
      const mean = sum / history.length;
      
      // Calculer l'écart-type
      const squaredDifferencesSum = history.reduce((acc, val) => {
        const diff = val - mean;
        return acc + diff * diff;
      }, 0);
      const stdDev = Math.sqrt(squaredDifferencesSum / history.length);
      
      // Calculer min/max
      const min = Math.min(...history);
      const max = Math.max(...history);
      
      // Détecter la tendance
      let trend: 'stable' | 'improving' | 'degrading' = 'stable';
      
      if (history.length >= 10) {
        const recentValues = history.slice(-5);
        const olderValues = history.slice(-10, -5);
        
        const recentAvg = recentValues.reduce((acc, val) => acc + val, 0) / recentValues.length;
        const olderAvg = olderValues.reduce((acc, val) => acc + val, 0) / olderValues.length;
        
        // Déterminer si la tendance est à l'amélioration ou à la dégradation
        if (metric === 'fps') {
          trend = recentAvg > olderAvg ? 'improving' : recentAvg < olderAvg ? 'degrading' : 'stable';
        } else {
          trend = recentAvg < olderAvg ? 'improving' : recentAvg > olderAvg ? 'degrading' : 'stable';
        }
      }
      
      // Mettre à jour les stats
      this.metricStats.set(metric, {
        mean,
        stdDev,
        min,
        max,
        trend
      });
    }
  }
  
  /**
   * Obtient les statistiques actuelles
   */
  public getStats(): Map<keyof PerformanceMetrics, {
    mean: number;
    stdDev: number;
    min: number;
    max: number;
    trend: 'stable' | 'improving' | 'degrading';
  }> {
    return new Map(this.metricStats);
  }
  
  /**
   * Obtient l'historique des anomalies
   */
  public getAnomalyHistory(): DetectedAnomaly[] {
    return [...this.anomalyHistory];
  }
  
  /**
   * Nettoie les ressources
   */
  public dispose(): void {
    this.metricHistory.clear();
    this.metricStats.clear();
    this.anomalyHistory = [];
  }
}
