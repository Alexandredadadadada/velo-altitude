/**
 * Système de monitoring avancé avec détection d'anomalies et optimisations proactives
 * Extension du système de monitoring de base avec des capacités ML
 */

import { WeatherVisualizationMonitoring, PerformanceMetrics, PerformanceAnalysisResult } from './WeatherVisualizationMonitoring';
import { DeviceCapabilities } from '../../utils/device';
import { AnomalyDetector } from './AnomalyDetector';
import { WeatherPerformanceModel } from './WeatherPerformanceModel';

// Types pour les problèmes de performance détectés
export interface PerformanceIssue {
  id: string;
  timestamp: number;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  metrics: PerformanceMetrics;
  source: 'monitoring' | 'anomaly_detection' | 'prediction';
  recommendations: Array<OptimizationRecommendation>;
}

// Recommandations d'optimisation
export interface OptimizationRecommendation {
  id: string;
  type: string;
  description: string;
  expectedImpact: {
    fps?: number;
    memoryUsage?: number;
    batteryDrain?: number;
  };
  priority: number;
  complexity: 'simple' | 'moderate' | 'complex';
}

// Métriques détaillées
export interface DetailedMetrics extends PerformanceMetrics {
  gpuUtilization?: number;
  cpuUtilization?: number;
  drawCalls?: number;
  triangleCount?: number;
  shaderCompilations?: number;
  textureMemory?: number;
  geometryMemory?: number;
  jsHeapSize?: number;
  jsHeapUsed?: number;
  networkRequests?: number;
  averageRenderTime?: number;
}

/**
 * Classe principale pour le monitoring avancé
 */
export class AdvancedWeatherMonitoring extends WeatherVisualizationMonitoring {
  private mlModel: WeatherPerformanceModel;
  private anomalyDetector: AnomalyDetector;
  private detailedMetricsHistory: DetailedMetrics[] = [];
  private issueHistory: PerformanceIssue[] = [];
  private optimizationCallbacks: Array<(recommendations: OptimizationRecommendation[]) => void> = [];
  private issueCallbacks: Array<(issue: PerformanceIssue) => void> = [];
  private mlEnabled: boolean = false;
  private anomalyDetectionEnabled: boolean = true;
  private detailedMetricsInterval: any;
  private maxIssueHistorySize: number = 50;
  private issueCooldownPeriod: number = 30000; // 30 secondes
  private lastIssueTimestamps: Map<string, number> = new Map();
  
  /**
   * Constructeur
   * @param deviceCapabilities Capacités de l'appareil
   * @param config Configuration optionnelle
   */
  constructor(
    deviceCapabilities: DeviceCapabilities,
    config?: any
  ) {
    super(deviceCapabilities, config);
    
    // Initialiser le détecteur d'anomalies
    this.anomalyDetector = new AnomalyDetector({
      sensitivityLevel: deviceCapabilities.performanceLevel === 'high' ? 'low' : 'medium',
      metricsToMonitor: ['fps', 'frameTime', 'memoryUsage', 'apiLatency'],
      historySize: 60, // 1 minute à 1 Hz
      outlierThreshold: 2.5 // Écarts-types
    });
    
    // Initialiser le modèle ML si disponible
    this.initializeMLModel();
    
    // Démarrer la collecte de métriques détaillées
    this.startDetailedMetricsCollection();
    
    console.log('Advanced Weather Monitoring initialized');
  }
  
  /**
   * Initialise le modèle ML
   */
  private async initializeMLModel(): Promise<void> {
    try {
      this.mlModel = new WeatherPerformanceModel();
      await this.mlModel.initialize();
      this.mlEnabled = true;
      console.log('ML model initialized successfully');
    } catch (error) {
      console.warn('Failed to initialize ML model, continuing without ML capabilities:', error);
      this.mlEnabled = false;
    }
  }
  
  /**
   * Démarre la collecte de métriques détaillées
   */
  private startDetailedMetricsCollection(): void {
    // Stopper tout intervalle existant
    if (this.detailedMetricsInterval) {
      clearInterval(this.detailedMetricsInterval);
    }
    
    // Fréquence d'échantillonnage adaptée aux performances
    const interval = 5000; // 5 secondes
    
    this.detailedMetricsInterval = setInterval(() => {
      this.collectDetailedMetrics()
        .then(metrics => {
          this.detailedMetricsHistory.push(metrics);
          
          // Limiter la taille de l'historique
          if (this.detailedMetricsHistory.length > 60) { // 5 minutes à 5s d'intervalle
            this.detailedMetricsHistory.shift();
          }
          
          // Analyser pour détecter des anomalies
          if (this.anomalyDetectionEnabled) {
            this.detectAnomalies(metrics);
          }
          
          // Mettre à jour le modèle ML si activé
          if (this.mlEnabled) {
            this.mlModel.updateModel(metrics);
          }
        })
        .catch(error => {
          console.error('Error collecting detailed metrics:', error);
        });
    }, interval);
  }
  
  /**
   * Collecte des métriques détaillées
   */
  private async collectDetailedMetrics(): Promise<DetailedMetrics> {
    const baseMetrics = await this.gatherDetailedMetrics();
    
    // Enrichir avec des métriques GPU/CPU si disponibles
    try {
      const gpuMetrics = await this.collectGPUMetrics();
      const memoryMetrics = await this.collectMemoryMetrics();
      return { ...baseMetrics, ...gpuMetrics, ...memoryMetrics };
    } catch (error) {
      return baseMetrics;
    }
  }
  
  /**
   * Collecte des métriques GPU
   */
  private async collectGPUMetrics(): Promise<Partial<DetailedMetrics>> {
    // Cette implémentation dépend de votre moteur 3D
    // Une implémentation réelle accéderait aux compteurs de performance WebGL
    return {
      gpuUtilization: Math.random() * 100, // Simulé
      drawCalls: Math.floor(Math.random() * 1000), // Simulé
      triangleCount: Math.floor(Math.random() * 100000) // Simulé
    };
  }
  
  /**
   * Collecte des métriques mémoire
   */
  private async collectMemoryMetrics(): Promise<Partial<DetailedMetrics>> {
    const metrics: Partial<DetailedMetrics> = {};
    
    // Accéder aux métriques de performance si disponibles
    if ((performance as any).memory) {
      metrics.jsHeapSize = (performance as any).memory.totalJSHeapSize / (1024 * 1024);
      metrics.jsHeapUsed = (performance as any).memory.usedJSHeapSize / (1024 * 1024);
    }
    
    return metrics;
  }
  
  /**
   * Collecte des métriques détaillées
   */
  public async gatherDetailedMetrics(): Promise<DetailedMetrics> {
    return {
      fps: 0, // Sera rempli par les valeurs réelles
      frameTime: 0,
      particleCount: 0,
      apiLatency: 0,
      averageRenderTime: 0,
      networkRequests: 0
    };
  }
  
  /**
   * Détecte les anomalies dans les métriques
   */
  private detectAnomalies(metrics: DetailedMetrics): void {
    const anomalies = this.anomalyDetector.detect(metrics);
    
    if (anomalies.length === 0) return;
    
    // Convertir les anomalies en problèmes de performance
    anomalies.forEach(anomaly => {
      // Vérifier le cooldown pour éviter de spammer les mêmes problèmes
      const lastTimestamp = this.lastIssueTimestamps.get(anomaly.type) || 0;
      const now = Date.now();
      
      if (now - lastTimestamp < this.issueCooldownPeriod) {
        return;
      }
      
      // Créer un problème de performance
      const issue: PerformanceIssue = {
        id: `anomaly_${anomaly.type}_${now}`,
        timestamp: now,
        type: anomaly.type,
        severity: anomaly.severity as 'info' | 'warning' | 'critical',
        message: anomaly.message,
        metrics,
        source: 'anomaly_detection',
        recommendations: this.generateRecommendations(anomaly.type, metrics)
      };
      
      // Ajouter à l'historique
      this.addIssue(issue);
      
      // Mettre à jour le timestamp
      this.lastIssueTimestamps.set(anomaly.type, now);
    });
  }
  
  /**
   * Génère des recommandations pour un type de problème
   */
  private generateRecommendations(
    issueType: string,
    metrics: DetailedMetrics
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    
    switch (issueType) {
      case 'low_fps':
        recommendations.push({
          id: 'reduce_particle_count',
          type: 'particle_optimization',
          description: 'Réduire le nombre de particules météorologiques',
          expectedImpact: {
            fps: 10,
            memoryUsage: -5
          },
          priority: 90,
          complexity: 'simple'
        });
        
        if (metrics.drawCalls && metrics.drawCalls > 500) {
          recommendations.push({
            id: 'optimize_draw_calls',
            type: 'render_optimization',
            description: 'Réduire le nombre d\'appels de rendu en utilisant l\'instancing',
            expectedImpact: {
              fps: 15
            },
            priority: 80,
            complexity: 'moderate'
          });
        }
        break;
        
      case 'high_memory':
        recommendations.push({
          id: 'optimize_textures',
          type: 'memory_optimization',
          description: 'Réduire la résolution des textures et nettoyer le cache',
          expectedImpact: {
            memoryUsage: -20
          },
          priority: 85,
          complexity: 'simple'
        });
        break;
        
      case 'high_api_latency':
        recommendations.push({
          id: 'optimize_api_calls',
          type: 'network_optimization',
          description: 'Augmenter la durée du cache des données météorologiques',
          expectedImpact: {
            apiLatency: -50
          },
          priority: 75,
          complexity: 'simple'
        });
        break;
    }
    
    return recommendations;
  }
  
  /**
   * Ajoute un problème à l'historique et notifie les abonnés
   */
  private addIssue(issue: PerformanceIssue): void {
    this.issueHistory.push(issue);
    
    // Limiter la taille de l'historique
    if (this.issueHistory.length > this.maxIssueHistorySize) {
      this.issueHistory.shift();
    }
    
    // Notifier les abonnés
    this.notifyIssueCallbacks(issue);
    
    // Notifier des recommandations
    if (issue.recommendations.length > 0) {
      this.notifyOptimizationCallbacks(issue.recommendations);
    }
    
    console.log(`Performance issue detected: ${issue.type} (${issue.severity})`);
  }
  
  /**
   * Détecte les problèmes de performance
   */
  public async detectPerformanceIssues(): Promise<PerformanceIssue[]> {
    // Collecter les métriques actuelles
    const metrics = await this.collectDetailedMetrics();
    
    // Résultats de différentes sources de détection
    const results: PerformanceIssue[] = [];
    
    // 1. Détection basée sur les règles traditionnelles
    const basicIssues = this.detectBasicIssues(metrics);
    results.push(...basicIssues);
    
    // 2. Détection d'anomalies
    if (this.anomalyDetectionEnabled) {
      const anomalies = this.anomalyDetector.detect(metrics);
      
      anomalies.forEach(anomaly => {
        results.push({
          id: `anomaly_${anomaly.type}_${Date.now()}`,
          timestamp: Date.now(),
          type: anomaly.type,
          severity: anomaly.severity as 'info' | 'warning' | 'critical',
          message: anomaly.message,
          metrics,
          source: 'anomaly_detection',
          recommendations: this.generateRecommendations(anomaly.type, metrics)
        });
      });
    }
    
    // 3. Prédictions basées sur le ML (si activé)
    if (this.mlEnabled) {
      try {
        const predictions = await this.mlModel.predict(metrics);
        
        if (predictions.probabilityOfIssue > 0.7) {
          results.push({
            id: `prediction_${predictions.issueType}_${Date.now()}`,
            timestamp: Date.now(),
            type: predictions.issueType,
            severity: 'warning',
            message: `Problème potentiel prédit: ${predictions.message}`,
            metrics,
            source: 'prediction',
            recommendations: predictions.recommendations
          });
        }
      } catch (error) {
        console.error('Error in ML prediction:', error);
      }
    }
    
    // Ajouter tous les nouveaux problèmes à l'historique
    results.forEach(issue => this.addIssue(issue));
    
    return results;
  }
  
  /**
   * Détecte les problèmes de base (règles simples)
   */
  private detectBasicIssues(metrics: DetailedMetrics): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    const now = Date.now();
    
    // Vérifier le FPS
    if (metrics.fps < 20) {
      // Vérifier le cooldown
      const lastTimestamp = this.lastIssueTimestamps.get('low_fps') || 0;
      
      if (now - lastTimestamp >= this.issueCooldownPeriod) {
        issues.push({
          id: `basic_low_fps_${now}`,
          timestamp: now,
          type: 'low_fps',
          severity: 'critical',
          message: `FPS très bas: ${metrics.fps.toFixed(1)}`,
          metrics,
          source: 'monitoring',
          recommendations: this.generateRecommendations('low_fps', metrics)
        });
        
        this.lastIssueTimestamps.set('low_fps', now);
      }
    } else if (metrics.fps < 30) {
      const lastTimestamp = this.lastIssueTimestamps.get('reduced_fps') || 0;
      
      if (now - lastTimestamp >= this.issueCooldownPeriod) {
        issues.push({
          id: `basic_reduced_fps_${now}`,
          timestamp: now,
          type: 'reduced_fps',
          severity: 'warning',
          message: `FPS réduit: ${metrics.fps.toFixed(1)}`,
          metrics,
          source: 'monitoring',
          recommendations: this.generateRecommendations('low_fps', metrics)
        });
        
        this.lastIssueTimestamps.set('reduced_fps', now);
      }
    }
    
    // Vérifier la mémoire
    if (metrics.jsHeapUsed && metrics.jsHeapSize) {
      const memoryUsagePercent = (metrics.jsHeapUsed / metrics.jsHeapSize) * 100;
      
      if (memoryUsagePercent > 90) {
        const lastTimestamp = this.lastIssueTimestamps.get('high_memory') || 0;
        
        if (now - lastTimestamp >= this.issueCooldownPeriod) {
          issues.push({
            id: `basic_high_memory_${now}`,
            timestamp: now,
            type: 'high_memory',
            severity: 'critical',
            message: `Utilisation mémoire critique: ${memoryUsagePercent.toFixed(1)}%`,
            metrics,
            source: 'monitoring',
            recommendations: this.generateRecommendations('high_memory', metrics)
          });
          
          this.lastIssueTimestamps.set('high_memory', now);
        }
      }
    }
    
    return issues;
  }
  
  /**
   * Optimise proactivement le système
   */
  public async optimizeProactively(): Promise<boolean> {
    console.log('Performing proactive optimization');
    
    // Détecter les problèmes actuels
    const issues = await this.detectPerformanceIssues();
    
    if (issues.length === 0) {
      console.log('No issues detected, no optimization needed');
      return false;
    }
    
    // Extraire toutes les recommandations
    const allRecommendations = issues.flatMap(issue => issue.recommendations);
    
    // Trier par priorité
    allRecommendations.sort((a, b) => b.priority - a.priority);
    
    // Appliquer les recommandations
    let optimizationApplied = false;
    
    for (const recommendation of allRecommendations) {
      const success = await this.applyOptimization(recommendation);
      if (success) {
        optimizationApplied = true;
        console.log(`Applied optimization: ${recommendation.description}`);
        break; // Appliquer une seule optimisation à la fois
      }
    }
    
    return optimizationApplied;
  }
  
  /**
   * Applique une optimisation
   */
  private async applyOptimization(recommendation: OptimizationRecommendation): Promise<boolean> {
    try {
      switch (recommendation.id) {
        case 'reduce_particle_count':
          // L'implémentation dépend de votre système
          console.log('Reducing particle count');
          return true;
          
        case 'optimize_textures':
          // L'implémentation dépend de votre système
          console.log('Optimizing textures');
          return true;
          
        case 'optimize_api_calls':
          // L'implémentation dépend de votre système
          console.log('Optimizing API calls');
          return true;
          
        case 'optimize_draw_calls':
          // L'implémentation dépend de votre système
          console.log('Optimizing draw calls');
          return true;
          
        default:
          console.warn(`Unknown optimization recommendation: ${recommendation.id}`);
          return false;
      }
    } catch (error) {
      console.error(`Error applying optimization ${recommendation.id}:`, error);
      return false;
    }
  }
  
  /**
   * S'abonne aux recommandations d'optimisation
   */
  public onOptimizationRecommendation(
    callback: (recommendations: OptimizationRecommendation[]) => void
  ): () => void {
    this.optimizationCallbacks.push(callback);
    
    return () => {
      this.optimizationCallbacks = this.optimizationCallbacks.filter(cb => cb !== callback);
    };
  }
  
  /**
   * S'abonne aux problèmes de performance
   */
  public onPerformanceIssue(
    callback: (issue: PerformanceIssue) => void
  ): () => void {
    this.issueCallbacks.push(callback);
    
    return () => {
      this.issueCallbacks = this.issueCallbacks.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Notifie les callbacks d'optimisation
   */
  private notifyOptimizationCallbacks(recommendations: OptimizationRecommendation[]): void {
    this.optimizationCallbacks.forEach(callback => {
      try {
        callback(recommendations);
      } catch (error) {
        console.error('Error in optimization callback:', error);
      }
    });
  }
  
  /**
   * Notifie les callbacks de problèmes
   */
  private notifyIssueCallbacks(issue: PerformanceIssue): void {
    this.issueCallbacks.forEach(callback => {
      try {
        callback(issue);
      } catch (error) {
        console.error('Error in issue callback:', error);
      }
    });
  }
  
  /**
   * Nettoie les ressources
   */
  public override dispose(): void {
    super.dispose();
    
    if (this.detailedMetricsInterval) {
      clearInterval(this.detailedMetricsInterval);
    }
    
    if (this.mlModel) {
      this.mlModel.dispose();
    }
    
    if (this.anomalyDetector) {
      this.anomalyDetector.dispose();
    }
    
    this.detailedMetricsHistory = [];
    this.issueHistory = [];
    this.optimizationCallbacks = [];
    this.issueCallbacks = [];
    
    console.log('Advanced Weather Monitoring disposed');
  }
}
