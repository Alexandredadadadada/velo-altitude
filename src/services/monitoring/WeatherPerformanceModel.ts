/**
 * Modèle de performance ML pour la visualisation météorologique
 * Prédit les problèmes de performance et suggère des optimisations
 */

import { DetailedMetrics, OptimizationRecommendation } from './AdvancedWeatherMonitoring';

// Résultat de prédiction du modèle
export interface PredictionResult {
  probabilityOfIssue: number;
  issueType: string;
  message: string;
  recommendations: OptimizationRecommendation[];
  requiresAction: boolean;
  confidence: number;
  predictedMetrics?: {
    fps?: number;
    memoryUsage?: number;
    particleCount?: number;
  };
}

// État météo simplifié pour la prédiction
interface WeatherState {
  type: string;
  intensity: number;
  particleCount: number;
  memoryUsage: number;
  startTimestamp: number;
}

/**
 * Classe principale pour le modèle de performance ML
 */
export class WeatherPerformanceModel {
  private isInitialized: boolean = false;
  private modelData: {
    weatherImpacts: Map<string, {
      baseFpsImpact: number;
      baseMemoryImpact: number;
      particleMultiplier: number;
    }>;
    thresholds: {
      criticalFps: number;
      warningFps: number;
      criticalMemory: number;
      warningMemory: number;
    };
    deviceProfiles: Map<string, {
      baselineFps: number;
      baselineMemory: number;
      particleLimit: number;
    }>;
  };
  
  private metricHistory: DetailedMetrics[] = [];
  private currentWeatherState: WeatherState | null = null;
  private deviceProfile: string = 'medium';
  private nextStatesProbabilities: Map<string, number> = new Map();
  
  constructor() {
    // Initialiser les données du modèle
    this.modelData = {
      weatherImpacts: new Map(),
      thresholds: {
        criticalFps: 20,
        warningFps: 30,
        criticalMemory: 90,
        warningMemory: 70
      },
      deviceProfiles: new Map()
    };
  }
  
  /**
   * Initialise le modèle
   */
  public async initialize(): Promise<void> {
    // Dans une implémentation réelle, on chargerait un modèle pré-entraîné
    // ou on initialiserait une bibliothèque ML
    
    // Pour cette démonstration, on va simplement définir des valeurs prédéfinies
    await this.initializeMockData();
    
    this.isInitialized = true;
    console.log('Weather Performance Model initialized');
  }
  
  /**
   * Met à jour le modèle avec de nouvelles métriques
   */
  public updateModel(metrics: DetailedMetrics): void {
    if (!this.isInitialized) {
      console.warn('Cannot update model before initialization');
      return;
    }
    
    // Ajouter à l'historique
    this.metricHistory.push(metrics);
    
    // Limiter la taille de l'historique
    if (this.metricHistory.length > 60) { // 5 minutes à 5s d'intervalle
      this.metricHistory.shift();
    }
    
    // Dans une implémentation réelle, on mettrait à jour le modèle ML
    // avec les nouvelles données d'apprentissage
  }
  
  /**
   * Prédit les problèmes potentiels en fonction des métriques actuelles
   * @param metrics Métriques actuelles
   * @returns Résultat de la prédiction
   */
  public async predict(metrics: DetailedMetrics): Promise<PredictionResult> {
    if (!this.isInitialized) {
      throw new Error('Model not initialized');
    }
    
    // Déterminer le profil d'appareil
    this.updateDeviceProfile(metrics);
    
    // Prédire les problèmes potentiels
    const predictions = this.predictIssues(metrics);
    
    return predictions;
  }
  
  /**
   * Prédit l'état suivant en fonction des métriques actuelles
   * @param metrics Métriques actuelles
   * @returns Résultat de la prédiction
   */
  public async predictNextState(metrics: DetailedMetrics): Promise<PredictionResult> {
    if (!this.isInitialized) {
      throw new Error('Model not initialized');
    }
    
    // Estimer l'état météo actuel à partir des métriques
    const currentState = this.estimateWeatherState(metrics);
    
    // Stocker l'état actuel
    this.currentWeatherState = currentState;
    
    // Prédire les probabilités des états suivants
    this.updateNextStateProbabilities(currentState);
    
    // Estimer les métriques pour l'état le plus probable
    let maxProb = 0;
    let nextState = '';
    
    this.nextStatesProbabilities.forEach((prob, state) => {
      if (prob > maxProb) {
        maxProb = prob;
        nextState = state;
      }
    });
    
    if (!nextState) {
      nextState = currentState.type;
    }
    
    // Estimer les métriques pour cet état
    const predictedMetrics = this.estimateMetricsForState(nextState, metrics);
    
    // Vérifier si cela va causer des problèmes
    let result: PredictionResult = {
      probabilityOfIssue: 0,
      issueType: '',
      message: '',
      recommendations: [],
      requiresAction: false,
      confidence: maxProb,
      predictedMetrics
    };
    
    const deviceProfile = this.modelData.deviceProfiles.get(this.deviceProfile);
    if (!deviceProfile) return result;
    
    if (predictedMetrics.fps !== undefined && 
        predictedMetrics.fps < this.modelData.thresholds.warningFps) {
      
      result = {
        probabilityOfIssue: 0.8,
        issueType: 'predicted_low_fps',
        message: `Baisse de FPS probable lors de la transition vers ${nextState}`,
        recommendations: this.generateRecommendations('predicted_low_fps', metrics, nextState),
        requiresAction: predictedMetrics.fps < this.modelData.thresholds.criticalFps,
        confidence: maxProb,
        predictedMetrics
      };
    } else if (predictedMetrics.memoryUsage !== undefined && 
              predictedMetrics.memoryUsage > this.modelData.thresholds.warningMemory) {
      
      result = {
        probabilityOfIssue: 0.7,
        issueType: 'predicted_high_memory',
        message: `Hausse d'utilisation mémoire probable lors de la transition vers ${nextState}`,
        recommendations: this.generateRecommendations('predicted_high_memory', metrics, nextState),
        requiresAction: predictedMetrics.memoryUsage > this.modelData.thresholds.criticalMemory,
        confidence: maxProb,
        predictedMetrics
      };
    }
    
    return result;
  }
  
  /**
   * Estime l'état météo actuel à partir des métriques
   */
  private estimateWeatherState(metrics: DetailedMetrics): WeatherState {
    // Déterminer le type d'effet météo à partir des particules et autres métriques
    let type = 'clear';
    let intensity = 0;
    
    if (metrics.particleCount > 10000) {
      type = metrics.particleCount > 12000 ? 'heavy_rain' : 'light_rain';
      intensity = metrics.particleCount / 15000;
    } else if (metrics.particleCount > 5000) {
      type = 'snow';
      intensity = metrics.particleCount / 10000;
    } else if (metrics.frameTime > 20) {
      type = 'fog';
      intensity = Math.min(metrics.frameTime / 33, 1);
    }
    
    return {
      type,
      intensity,
      particleCount: metrics.particleCount || 0,
      memoryUsage: metrics.memoryUsage || 0,
      startTimestamp: Date.now()
    };
  }
  
  /**
   * Met à jour les probabilités des états suivants
   */
  private updateNextStateProbabilities(currentState: WeatherState): void {
    this.nextStatesProbabilities.clear();
    
    // Modèle simplifié de transition entre états météo
    switch (currentState.type) {
      case 'clear':
        this.nextStatesProbabilities.set('clear', 0.7);
        this.nextStatesProbabilities.set('light_rain', 0.15);
        this.nextStatesProbabilities.set('partly_cloudy', 0.1);
        this.nextStatesProbabilities.set('fog', 0.05);
        break;
        
      case 'light_rain':
        this.nextStatesProbabilities.set('light_rain', 0.5);
        this.nextStatesProbabilities.set('clear', 0.3);
        this.nextStatesProbabilities.set('heavy_rain', 0.2);
        break;
        
      case 'heavy_rain':
        this.nextStatesProbabilities.set('heavy_rain', 0.6);
        this.nextStatesProbabilities.set('light_rain', 0.3);
        this.nextStatesProbabilities.set('thunderstorm', 0.1);
        break;
        
      case 'snow':
        this.nextStatesProbabilities.set('snow', 0.7);
        this.nextStatesProbabilities.set('light_snow', 0.2);
        this.nextStatesProbabilities.set('clear', 0.1);
        break;
        
      case 'fog':
        this.nextStatesProbabilities.set('fog', 0.6);
        this.nextStatesProbabilities.set('clear', 0.3);
        this.nextStatesProbabilities.set('light_rain', 0.1);
        break;
        
      default:
        this.nextStatesProbabilities.set('clear', 0.5);
        this.nextStatesProbabilities.set(currentState.type, 0.5);
    }
  }
  
  /**
   * Estime les métriques pour un état donné
   */
  private estimateMetricsForState(weatherType: string, currentMetrics: DetailedMetrics): {
    fps?: number;
    memoryUsage?: number;
    particleCount?: number;
  } {
    const impact = this.modelData.weatherImpacts.get(weatherType);
    const deviceProfile = this.modelData.deviceProfiles.get(this.deviceProfile);
    
    if (!impact || !deviceProfile) {
      return {};
    }
    
    // Estimer le FPS
    const estimatedFps = deviceProfile.baselineFps + impact.baseFpsImpact;
    
    // Estimer l'utilisation mémoire
    const estimatedMemory = deviceProfile.baselineMemory + impact.baseMemoryImpact;
    
    // Estimer le nombre de particules
    let estimatedParticles = 0;
    
    switch (weatherType) {
      case 'light_rain':
        estimatedParticles = 7500;
        break;
      case 'heavy_rain':
        estimatedParticles = 15000;
        break;
      case 'snow':
        estimatedParticles = 10000;
        break;
      case 'fog':
        estimatedParticles = 3000;
        break;
      default:
        estimatedParticles = 1000;
    }
    
    return {
      fps: Math.max(10, estimatedFps),
      memoryUsage: Math.max(10, estimatedMemory),
      particleCount: Math.min(estimatedParticles, deviceProfile.particleLimit)
    };
  }
  
  /**
   * Met à jour le profil d'appareil en fonction des métriques
   */
  private updateDeviceProfile(metrics: DetailedMetrics): void {
    // Si nous avons un historique, utiliser la moyenne des dernières métriques
    if (this.metricHistory.length > 10) {
      const recentMetrics = this.metricHistory.slice(-10);
      const averageFps = recentMetrics.reduce((sum, m) => sum + (m.fps || 0), 0) / recentMetrics.length;
      
      if (averageFps > 55) {
        this.deviceProfile = 'high';
      } else if (averageFps > 30) {
        this.deviceProfile = 'medium';
      } else {
        this.deviceProfile = 'low';
      }
    } else {
      // Sinon, utiliser les métriques actuelles
      const fps = metrics.fps || 0;
      
      if (fps > 55) {
        this.deviceProfile = 'high';
      } else if (fps > 30) {
        this.deviceProfile = 'medium';
      } else {
        this.deviceProfile = 'low';
      }
    }
  }
  
  /**
   * Prédit les problèmes potentiels
   */
  private predictIssues(metrics: DetailedMetrics): PredictionResult {
    // Analyser les tendances récentes
    const recentTrends = this.analyzeRecentTrends();
    
    // Vérifier la tendance du FPS
    if (recentTrends.fps === 'degrading' && metrics.fps && metrics.fps < 40) {
      // Le FPS est en baisse et déjà sous un seuil inquiétant
      return {
        probabilityOfIssue: 0.85,
        issueType: 'predicted_fps_degradation',
        message: 'Baisse progressive du FPS détectée, risque de problèmes imminents',
        recommendations: this.generateRecommendations('predicted_fps_degradation', metrics),
        requiresAction: metrics.fps < 30,
        confidence: 0.8
      };
    }
    
    // Vérifier la tendance de l'utilisation mémoire
    if (recentTrends.memory === 'increasing' && metrics.memoryUsage && metrics.memoryUsage > 60) {
      // L'utilisation mémoire augmente et est déjà élevée
      return {
        probabilityOfIssue: 0.75,
        issueType: 'predicted_memory_leak',
        message: 'Augmentation progressive de l\'utilisation mémoire, possible fuite mémoire',
        recommendations: this.generateRecommendations('predicted_memory_leak', metrics),
        requiresAction: metrics.memoryUsage > 80,
        confidence: 0.7
      };
    }
    
    // Vérifier si le nombre de particules est anormalement élevé
    if (metrics.particleCount && metrics.particleCount > 12000 && metrics.fps && metrics.fps < 40) {
      return {
        probabilityOfIssue: 0.8,
        issueType: 'excessive_particles',
        message: 'Nombre de particules trop élevé pour les performances actuelles',
        recommendations: this.generateRecommendations('excessive_particles', metrics),
        requiresAction: metrics.fps < 30,
        confidence: 0.75
      };
    }
    
    // Si aucun problème n'est détecté
    return {
      probabilityOfIssue: 0.1,
      issueType: 'no_issue',
      message: 'Aucun problème détecté',
      recommendations: [],
      requiresAction: false,
      confidence: 0.9
    };
  }
  
  /**
   * Analyse les tendances récentes dans les métriques
   */
  private analyzeRecentTrends(): {
    fps: 'stable' | 'improving' | 'degrading';
    memory: 'stable' | 'increasing' | 'decreasing';
    particles: 'stable' | 'increasing' | 'decreasing';
  } {
    if (this.metricHistory.length < 10) {
      return {
        fps: 'stable',
        memory: 'stable',
        particles: 'stable'
      };
    }
    
    const recentMetrics = this.metricHistory.slice(-5);
    const olderMetrics = this.metricHistory.slice(-10, -5);
    
    // Calculer les moyennes
    const recentFpsAvg = recentMetrics.reduce((sum, m) => sum + (m.fps || 0), 0) / recentMetrics.length;
    const olderFpsAvg = olderMetrics.reduce((sum, m) => sum + (m.fps || 0), 0) / olderMetrics.length;
    
    const recentMemoryAvg = recentMetrics.reduce((sum, m) => sum + (m.memoryUsage || 0), 0) / recentMetrics.length;
    const olderMemoryAvg = olderMetrics.reduce((sum, m) => sum + (m.memoryUsage || 0), 0) / olderMetrics.length;
    
    const recentParticlesAvg = recentMetrics.reduce((sum, m) => sum + (m.particleCount || 0), 0) / recentMetrics.length;
    const olderParticlesAvg = olderMetrics.reduce((sum, m) => sum + (m.particleCount || 0), 0) / olderMetrics.length;
    
    // Déterminer les tendances
    const fpsTrend = recentFpsAvg > olderFpsAvg * 1.05 
      ? 'improving' 
      : recentFpsAvg < olderFpsAvg * 0.95 
        ? 'degrading' 
        : 'stable';
    
    const memoryTrend = recentMemoryAvg > olderMemoryAvg * 1.1 
      ? 'increasing' 
      : recentMemoryAvg < olderMemoryAvg * 0.9 
        ? 'decreasing' 
        : 'stable';
    
    const particlesTrend = recentParticlesAvg > olderParticlesAvg * 1.2 
      ? 'increasing' 
      : recentParticlesAvg < olderParticlesAvg * 0.8 
        ? 'decreasing' 
        : 'stable';
    
    return {
      fps: fpsTrend,
      memory: memoryTrend,
      particles: particlesTrend
    };
  }
  
  /**
   * Génère des recommandations pour un type de problème
   */
  private generateRecommendations(
    issueType: string,
    metrics: DetailedMetrics,
    nextStateType?: string
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    
    switch (issueType) {
      case 'predicted_fps_degradation':
      case 'predicted_low_fps':
        recommendations.push({
          id: 'preemptive_reduce_particles',
          type: 'particle_optimization',
          description: 'Réduire préventivement le nombre de particules',
          expectedImpact: {
            fps: 15,
            memoryUsage: -10
          },
          priority: 90,
          complexity: 'simple'
        });
        
        recommendations.push({
          id: 'preemptive_reduce_quality',
          type: 'quality_optimization',
          description: 'Réduire préventivement la qualité visuelle',
          expectedImpact: {
            fps: 20
          },
          priority: 80,
          complexity: 'simple'
        });
        break;
        
      case 'predicted_memory_leak':
      case 'predicted_high_memory':
        recommendations.push({
          id: 'preemptive_flush_cache',
          type: 'memory_optimization',
          description: 'Vider préventivement les caches GPU inutilisés',
          expectedImpact: {
            memoryUsage: -30
          },
          priority: 90,
          complexity: 'simple'
        });
        
        recommendations.push({
          id: 'preemptive_reduce_texture_quality',
          type: 'texture_optimization',
          description: 'Réduire préventivement la qualité des textures',
          expectedImpact: {
            memoryUsage: -20
          },
          priority: 85,
          complexity: 'simple'
        });
        break;
        
      case 'excessive_particles':
        recommendations.push({
          id: 'adaptive_particle_reduction',
          type: 'particle_optimization',
          description: 'Adapter dynamiquement le nombre de particules en fonction du FPS',
          expectedImpact: {
            fps: 15,
            memoryUsage: -5
          },
          priority: 95,
          complexity: 'simple'
        });
        break;
    }
    
    // Optimisations spécifiques pour certains types de météo
    if (nextStateType) {
      switch (nextStateType) {
        case 'heavy_rain':
        case 'thunderstorm':
          recommendations.push({
            id: 'preload_heavy_weather',
            type: 'preloading',
            description: 'Précharger les ressources pour conditions météo intenses',
            expectedImpact: {
              fps: 5
            },
            priority: 70,
            complexity: 'moderate'
          });
          break;
          
        case 'snow':
          recommendations.push({
            id: 'optimize_snow_particles',
            type: 'particle_optimization',
            description: 'Optimiser spécifiquement le rendu des flocons de neige',
            expectedImpact: {
              fps: 10,
              memoryUsage: -5
            },
            priority: 75,
            complexity: 'moderate'
          });
          break;
      }
    }
    
    return recommendations;
  }
  
  /**
   * Initialise des données fictives pour la démonstration
   */
  private async initializeMockData(): Promise<void> {
    // Impact des types de météo sur les performances
    this.modelData.weatherImpacts.set('clear', {
      baseFpsImpact: 0,
      baseMemoryImpact: 0,
      particleMultiplier: 1.0
    });
    
    this.modelData.weatherImpacts.set('partly_cloudy', {
      baseFpsImpact: -2,
      baseMemoryImpact: 5,
      particleMultiplier: 1.0
    });
    
    this.modelData.weatherImpacts.set('light_rain', {
      baseFpsImpact: -5,
      baseMemoryImpact: 10,
      particleMultiplier: 0.9
    });
    
    this.modelData.weatherImpacts.set('heavy_rain', {
      baseFpsImpact: -15,
      baseMemoryImpact: 20,
      particleMultiplier: 0.7
    });
    
    this.modelData.weatherImpacts.set('snow', {
      baseFpsImpact: -10,
      baseMemoryImpact: 15,
      particleMultiplier: 0.8
    });
    
    this.modelData.weatherImpacts.set('fog', {
      baseFpsImpact: -8,
      baseMemoryImpact: 8,
      particleMultiplier: 0.9
    });
    
    this.modelData.weatherImpacts.set('thunderstorm', {
      baseFpsImpact: -20,
      baseMemoryImpact: 25,
      particleMultiplier: 0.6
    });
    
    // Profils d'appareils
    this.modelData.deviceProfiles.set('high', {
      baselineFps: 60,
      baselineMemory: 30,
      particleLimit: 20000
    });
    
    this.modelData.deviceProfiles.set('medium', {
      baselineFps: 45,
      baselineMemory: 50,
      particleLimit: 10000
    });
    
    this.modelData.deviceProfiles.set('low', {
      baselineFps: 30,
      baselineMemory: 70,
      particleLimit: 5000
    });
  }
  
  /**
   * Nettoie les ressources
   */
  public dispose(): void {
    this.metricHistory = [];
    this.nextStatesProbabilities.clear();
    this.isInitialized = false;
  }
}
