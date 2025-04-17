/**
 * Système de monitoring de performance pour la visualisation météorologique
 * Surveille les métriques clés et adapte les paramètres de rendu en temps réel
 */

import { DeviceCapabilities } from '../../utils/device';

// Types pour les métriques de performance
export interface PerformanceMetrics {
  fps: number;
  gpuUsage?: number;
  frameTime?: number;
  particleCount: number;
  apiLatency?: number;
  memoryUsage?: number;
  batteryDrain?: number;
}

// Configuration du monitoring
export interface MonitoringConfig {
  targetFPS: number;
  historyLength: number;
  samplingInterval: number;
  adaptiveInterval: boolean;
  enableBatteryMonitoring: boolean;
  enableMemoryMonitoring: boolean;
  thresholds: {
    fpsLow: number;
    fpsCritical: number;
    apiLatencyHigh: number;
    memoryHigh?: number;
  };
}

// Options pour l'adaptation de la qualité
export interface QualityAdaptationOptions {
  // Paramètres influençant la décision d'adaptation
  deviceCapabilities: DeviceCapabilities;
  batteryLevel?: number;
  userQualityPreference?: 'auto' | 'low' | 'medium' | 'high';
  networkType?: string;
  applicationPriority?: 'performance' | 'quality' | 'balanced';
}

// Résultat de l'analyse de performance
export interface PerformanceAnalysisResult {
  currentQuality: 'low' | 'medium' | 'high';
  recommendedQuality: 'low' | 'medium' | 'high';
  adaptationReason?: string;
  criticalIssues: Array<{
    type: string;
    severity: 'warning' | 'critical';
    message: string;
  }>;
  optimizationRecommendations: Array<{
    target: string;
    action: string;
    expectedGain: 'low' | 'medium' | 'high';
    description: string;
  }>;
}

/**
 * Classe principale pour le monitoring des performances de visualisation météo
 */
export class WeatherVisualizationMonitoring {
  private config: MonitoringConfig;
  private metrics: {
    fps: number[];
    frameTime: number[];
    gpuUsage: number[];
    particleCount: number[];
    apiLatency: number[];
    memoryUsage: number[];
    batteryDrain: number[];
  };
  
  private deviceCapabilities: DeviceCapabilities;
  private lastSampleTime: number = 0;
  private perfObserver: PerformanceObserver | null = null;
  private frameCounter: number = 0;
  private lastFrameTime: number = 0;
  private batteryLevel?: number;
  private qualityChangeCallbacks: Array<(newQuality: 'low' | 'medium' | 'high', reason: string) => void> = [];
  private performanceReportCallbacks: Array<(report: PerformanceAnalysisResult) => void> = [];
  private monitoringInterval: any;
  private isInitialized: boolean = false;
  private currentQuality: 'low' | 'medium' | 'high' = 'medium';
  private lastAdaptationTime: number = 0;
  private adaptationCooldown: number = 10000; // 10 secondes minimum entre adaptations
  private userSetQuality?: 'auto' | 'low' | 'medium' | 'high';
  
  /**
   * Créer une instance du système de monitoring
   * @param deviceCapabilities Capacités de l'appareil
   * @param config Configuration du monitoring (optionnel)
   */
  constructor(deviceCapabilities: DeviceCapabilities, config?: Partial<MonitoringConfig>) {
    // Configuration par défaut
    this.config = {
      targetFPS: 60,
      historyLength: 60, // 1 minute à 1 échantillon par seconde
      samplingInterval: 1000, // 1 seconde
      adaptiveInterval: true, // Réduire l'échantillonnage si la batterie est faible
      enableBatteryMonitoring: true,
      enableMemoryMonitoring: true,
      thresholds: {
        fpsLow: 30,
        fpsCritical: 20,
        apiLatencyHigh: 1000, // 1 seconde
        memoryHigh: 150 // Mo
      },
      ...config
    };
    
    this.deviceCapabilities = deviceCapabilities;
    
    // Initialiser les métriques
    this.metrics = {
      fps: [],
      frameTime: [],
      gpuUsage: [],
      particleCount: [],
      apiLatency: [],
      memoryUsage: [],
      batteryDrain: []
    };
    
    // Initialiser les moniteurs de performance
    this.initializePerformanceMonitoring();
  }
  
  /**
   * Initialise les observateurs de performance
   */
  private initializePerformanceMonitoring(): void {
    if (this.isInitialized) return;
    
    // Initialiser le monitoring du frame rate
    this.lastFrameTime = performance.now();
    
    // Utiliser requestAnimationFrame pour compter les frames
    const countFrame = () => {
      this.frameCounter++;
      requestAnimationFrame(countFrame);
    };
    requestAnimationFrame(countFrame);
    
    // Observer les mesures de performance
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        this.perfObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          this.processPerformanceEntries(entries);
        });
        
        this.perfObserver.observe({ 
          entryTypes: ['resource', 'measure', 'longtask', 'navigation'] 
        });
      } catch (e) {
        console.warn('PerformanceObserver non supporté ou erreur d\'initialisation:', e);
      }
    }
    
    // Démarrer l'échantillonnage périodique des métriques
    this.startSampling();
    
    // Monitorer la batterie si disponible
    this.initializeBatteryMonitoring();
    
    this.isInitialized = true;
    console.log('Monitoring de performance initialisé avec la configuration:', this.config);
  }
  
  /**
   * Initialise le monitoring de la batterie
   */
  private initializeBatteryMonitoring(): void {
    if (!this.config.enableBatteryMonitoring) return;
    
    try {
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          this.batteryLevel = battery.level;
          
          // Écouter les changements de niveau de batterie
          battery.addEventListener('levelchange', () => {
            const oldLevel = this.batteryLevel;
            this.batteryLevel = battery.level;
            
            // Calculer le taux de décharge
            if (oldLevel !== undefined && oldLevel > this.batteryLevel) {
              const drain = oldLevel - this.batteryLevel;
              this.metrics.batteryDrain.push(drain);
              
              // Limiter la taille de l'historique
              if (this.metrics.batteryDrain.length > this.config.historyLength) {
                this.metrics.batteryDrain.shift();
              }
              
              // Ajuster le taux d'échantillonnage si nécessaire
              if (this.config.adaptiveInterval && this.batteryLevel < 0.2) {
                // Réduire la fréquence d'échantillonnage pour économiser la batterie
                this.updateSamplingInterval(this.config.samplingInterval * 2);
              }
            }
          });
        });
      }
    } catch (e) {
      console.warn('API de batterie non supportée:', e);
    }
  }
  
  /**
   * Démarre l'échantillonnage périodique des métriques
   */
  private startSampling(): void {
    // Nettoyer tout intervalle existant
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    this.monitoringInterval = setInterval(() => {
      this.sampleMetrics();
    }, this.config.samplingInterval);
  }
  
  /**
   * Met à jour l'intervalle d'échantillonnage
   */
  private updateSamplingInterval(newInterval: number): void {
    if (this.config.samplingInterval === newInterval) return;
    
    this.config.samplingInterval = newInterval;
    
    // Redémarrer l'échantillonnage avec le nouvel intervalle
    this.startSampling();
  }
  
  /**
   * Échantillonne les métriques de performance actuelles
   */
  private sampleMetrics(): void {
    const now = performance.now();
    const elapsed = now - this.lastSampleTime;
    this.lastSampleTime = now;
    
    // Calculer le FPS actuel
    const fps = this.frameCounter / (elapsed / 1000);
    this.frameCounter = 0;
    this.metrics.fps.push(Math.min(fps, this.config.targetFPS)); // Plafonner à targetFPS
    
    // Limiter la taille de l'historique
    if (this.metrics.fps.length > this.config.historyLength) {
      this.metrics.fps.shift();
    }
    
    // Échantillonner l'utilisation de la mémoire si disponible
    if (this.config.enableMemoryMonitoring && (performance as any).memory) {
      const memoryInfo = (performance as any).memory;
      const usedMemoryMB = memoryInfo.usedJSHeapSize / (1024 * 1024);
      this.metrics.memoryUsage.push(usedMemoryMB);
      
      if (this.metrics.memoryUsage.length > this.config.historyLength) {
        this.metrics.memoryUsage.shift();
      }
    }
    
    // Analyser les performances
    this.analyzePerformance();
  }
  
  /**
   * Traite les entrées de l'observateur de performance
   */
  private processPerformanceEntries(entries: PerformanceEntry[]): void {
    for (const entry of entries) {
      // Mesurer la latence des requêtes API
      if (entry.entryType === 'resource' && entry.name.includes('/api/')) {
        const resourceEntry = entry as PerformanceResourceTiming;
        this.metrics.apiLatency.push(resourceEntry.duration);
        
        if (this.metrics.apiLatency.length > this.config.historyLength) {
          this.metrics.apiLatency.shift();
        }
      }
    }
  }
  
  /**
   * Enregistre un nombre de particules actuellement à l'écran
   */
  public trackParticleCount(count: number): void {
    this.metrics.particleCount.push(count);
    
    if (this.metrics.particleCount.length > this.config.historyLength) {
      this.metrics.particleCount.shift();
    }
  }
  
  /**
   * Enregistre une métrique de performance complète
   */
  public trackMetrics(metrics: PerformanceMetrics): void {
    if (metrics.fps !== undefined) {
      this.metrics.fps.push(metrics.fps);
      if (this.metrics.fps.length > this.config.historyLength) {
        this.metrics.fps.shift();
      }
    }
    
    if (metrics.frameTime !== undefined) {
      this.metrics.frameTime.push(metrics.frameTime);
      if (this.metrics.frameTime.length > this.config.historyLength) {
        this.metrics.frameTime.shift();
      }
    }
    
    if (metrics.gpuUsage !== undefined) {
      this.metrics.gpuUsage.push(metrics.gpuUsage);
      if (this.metrics.gpuUsage.length > this.config.historyLength) {
        this.metrics.gpuUsage.shift();
      }
    }
    
    if (metrics.particleCount !== undefined) {
      this.metrics.particleCount.push(metrics.particleCount);
      if (this.metrics.particleCount.length > this.config.historyLength) {
        this.metrics.particleCount.shift();
      }
    }
    
    if (metrics.apiLatency !== undefined) {
      this.metrics.apiLatency.push(metrics.apiLatency);
      if (this.metrics.apiLatency.length > this.config.historyLength) {
        this.metrics.apiLatency.shift();
      }
    }
    
    // Analyser les performances après avoir reçu de nouvelles métriques
    if (metrics.fps !== undefined || metrics.frameTime !== undefined) {
      this.analyzePerformance();
    }
  }
  
  /**
   * Analyse les métriques de performance actuelles et recommande des ajustements
   */
  private analyzePerformance(): void {
    if (this.metrics.fps.length < 5) {
      // Pas assez de données pour une analyse fiable
      return;
    }
    
    // Calcul des métriques moyennes
    const averageFPS = this.getAverage(this.metrics.fps);
    const averageParticleCount = this.getAverage(this.metrics.particleCount);
    const averageApiLatency = this.getAverage(this.metrics.apiLatency) || 0;
    const averageMemoryUsage = this.getAverage(this.metrics.memoryUsage) || 0;
    
    // Liste des problèmes détectés
    const criticalIssues: Array<{
      type: string;
      severity: 'warning' | 'critical';
      message: string;
    }> = [];
    
    // Vérifier les problèmes de FPS
    if (averageFPS < this.config.thresholds.fpsCritical) {
      criticalIssues.push({
        type: 'fps',
        severity: 'critical',
        message: `FPS critique (${averageFPS.toFixed(1)})`
      });
    } else if (averageFPS < this.config.thresholds.fpsLow) {
      criticalIssues.push({
        type: 'fps',
        severity: 'warning',
        message: `FPS bas (${averageFPS.toFixed(1)})`
      });
    }
    
    // Vérifier la latence API
    if (averageApiLatency > 0 && averageApiLatency > this.config.thresholds.apiLatencyHigh) {
      criticalIssues.push({
        type: 'apiLatency',
        severity: 'warning',
        message: `Latence API élevée (${averageApiLatency.toFixed(0)}ms)`
      });
    }
    
    // Vérifier l'utilisation de la mémoire
    if (this.config.thresholds.memoryHigh && 
        averageMemoryUsage > 0 &&
        averageMemoryUsage > this.config.thresholds.memoryHigh) {
      criticalIssues.push({
        type: 'memory',
        severity: 'warning',
        message: `Utilisation mémoire élevée (${averageMemoryUsage.toFixed(1)}MB)`
      });
    }
    
    // Déterminer si une adaptation de qualité est nécessaire
    let recommendedQuality: 'low' | 'medium' | 'high' = this.currentQuality;
    let adaptationReason = '';
    
    // Si l'utilisateur a défini une qualité spécifique, la respecter
    if (this.userSetQuality && this.userSetQuality !== 'auto') {
      recommendedQuality = this.userSetQuality as 'low' | 'medium' | 'high';
    } else {
      // Adaptation automatique basée sur les performances
      if (criticalIssues.some(issue => issue.severity === 'critical')) {
        // Problèmes critiques - réduire la qualité immédiatement
        if (this.currentQuality !== 'low') {
          recommendedQuality = 'low';
          adaptationReason = 'Problèmes de performance critiques';
        }
      } else if (criticalIssues.length > 0) {
        // Problèmes non critiques - réduire d'un niveau si nécessaire
        if (this.currentQuality === 'high') {
          recommendedQuality = 'medium';
          adaptationReason = 'Optimisation des performances';
        }
      } else if (averageFPS > 0.9 * this.config.targetFPS) {
        // Bonnes performances - augmenter la qualité si possible
        // mais seulement si le niveau de batterie est correct
        if (this.currentQuality === 'low' && (!this.batteryLevel || this.batteryLevel > 0.3)) {
          recommendedQuality = 'medium';
          adaptationReason = 'Amélioration de la qualité visuelle';
        } else if (this.currentQuality === 'medium' && 
                  (!this.batteryLevel || this.batteryLevel > 0.5) &&
                  this.deviceCapabilities.performanceLevel === 'high') {
          recommendedQuality = 'high';
          adaptationReason = 'Maximisation de la qualité visuelle';
        }
      }
    }
    
    // Générer des recommandations d'optimisation
    const optimizationRecommendations: Array<{
      target: string;
      action: string;
      expectedGain: 'low' | 'medium' | 'high';
      description: string;
    }> = [];
    
    // Recommandations basées sur les métriques
    if (averageParticleCount > 1000 && averageFPS < this.config.thresholds.fpsLow) {
      optimizationRecommendations.push({
        target: 'particles',
        action: 'reduce',
        expectedGain: 'high',
        description: 'Réduire le nombre de particules météorologiques'
      });
    }
    
    if (this.batteryLevel !== undefined && this.batteryLevel < 0.2) {
      optimizationRecommendations.push({
        target: 'updateFrequency',
        action: 'reduce',
        expectedGain: 'medium',
        description: 'Réduire la fréquence de mise à jour des effets météo'
      });
    }
    
    // Créer le rapport d'analyse
    const analysisResult: PerformanceAnalysisResult = {
      currentQuality: this.currentQuality,
      recommendedQuality,
      adaptationReason,
      criticalIssues,
      optimizationRecommendations
    };
    
    // Notifier les abonnés du rapport
    this.notifyPerformanceReport(analysisResult);
    
    // Appliquer l'adaptation de qualité si nécessaire
    if (recommendedQuality !== this.currentQuality) {
      this.applyQualityAdaptation(recommendedQuality, adaptationReason);
    }
  }
  
  /**
   * Applique une adaptation de qualité
   */
  private applyQualityAdaptation(newQuality: 'low' | 'medium' | 'high', reason: string): void {
    const now = performance.now();
    const timeSinceLastAdaptation = now - this.lastAdaptationTime;
    
    // Respecter le cooldown pour éviter les changements trop fréquents
    if (timeSinceLastAdaptation < this.adaptationCooldown) {
      return;
    }
    
    console.log(`Adaptation de qualité: ${this.currentQuality} -> ${newQuality}. Raison: ${reason}`);
    
    this.currentQuality = newQuality;
    this.lastAdaptationTime = now;
    
    // Notifier les abonnés du changement de qualité
    this.notifyQualityChange(newQuality, reason);
  }
  
  /**
   * Définir manuellement le niveau de qualité
   */
  public setQualityPreference(quality: 'auto' | 'low' | 'medium' | 'high'): void {
    this.userSetQuality = quality;
    
    if (quality !== 'auto') {
      this.applyQualityAdaptation(quality as 'low' | 'medium' | 'high', 'Préférence utilisateur');
    } else {
      // En mode auto, déclencher une analyse immédiate
      this.analyzePerformance();
    }
  }
  
  /**
   * Obtenir la qualité recommandée en fonction des capacités de l'appareil et des options
   */
  public getRecommendedQuality(options: QualityAdaptationOptions): 'low' | 'medium' | 'high' {
    // Si l'utilisateur a défini une préférence spécifique, la respecter
    if (options.userQualityPreference && options.userQualityPreference !== 'auto') {
      return options.userQualityPreference as 'low' | 'medium' | 'high';
    }
    
    // Par défaut, utiliser le niveau de performance de l'appareil
    let recommendedQuality: 'low' | 'medium' | 'high' = options.deviceCapabilities.performanceLevel;
    
    // Ajuster en fonction de la batterie
    if (options.batteryLevel !== undefined) {
      if (options.batteryLevel < 0.15) {
        // Batterie très faible, forcer la qualité minimale
        recommendedQuality = 'low';
      } else if (options.batteryLevel < 0.3 && recommendedQuality === 'high') {
        // Batterie faible, réduire d'un niveau
        recommendedQuality = 'medium';
      }
    }
    
    // Ajuster en fonction du réseau
    if (options.networkType) {
      if (options.networkType === '2g' || options.networkType === 'slow-2g') {
        // Connexion très lente, réduire la qualité au minimum
        recommendedQuality = 'low';
      } else if (options.networkType === '3g' && recommendedQuality === 'high') {
        // Connexion 3G, réduire d'un niveau
        recommendedQuality = 'medium';
      }
    }
    
    // Ajuster en fonction de la priorité de l'application
    if (options.applicationPriority === 'performance') {
      // Priorité aux performances, réduire d'un niveau
      if (recommendedQuality === 'high') {
        recommendedQuality = 'medium';
      } else if (recommendedQuality === 'medium') {
        recommendedQuality = 'low';
      }
    } else if (options.applicationPriority === 'quality' && 
               recommendedQuality === 'medium' && 
               (!options.batteryLevel || options.batteryLevel > 0.5)) {
      // Priorité à la qualité, augmenter si possible
      recommendedQuality = 'high';
    }
    
    return recommendedQuality;
  }
  
  /**
   * Ajouter un callback pour les changements de qualité
   */
  public onQualityChange(callback: (newQuality: 'low' | 'medium' | 'high', reason: string) => void): () => void {
    this.qualityChangeCallbacks.push(callback);
    
    // Retourner une fonction pour supprimer le callback
    return () => {
      this.qualityChangeCallbacks = this.qualityChangeCallbacks.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Ajouter un callback pour les rapports de performance
   */
  public onPerformanceReport(callback: (report: PerformanceAnalysisResult) => void): () => void {
    this.performanceReportCallbacks.push(callback);
    
    // Retourner une fonction pour supprimer le callback
    return () => {
      this.performanceReportCallbacks = this.performanceReportCallbacks.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Notifier les callbacks de changement de qualité
   */
  private notifyQualityChange(newQuality: 'low' | 'medium' | 'high', reason: string): void {
    this.qualityChangeCallbacks.forEach(callback => {
      try {
        callback(newQuality, reason);
      } catch (error) {
        console.error('Erreur dans un callback de changement de qualité:', error);
      }
    });
  }
  
  /**
   * Notifier les callbacks de rapport de performance
   */
  private notifyPerformanceReport(report: PerformanceAnalysisResult): void {
    this.performanceReportCallbacks.forEach(callback => {
      try {
        callback(report);
      } catch (error) {
        console.error('Erreur dans un callback de rapport de performance:', error);
      }
    });
  }
  
  /**
   * Calcule la moyenne d'un tableau de nombres
   */
  private getAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }
  
  /**
   * Nettoie les ressources lors de la destruction
   */
  public dispose(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    if (this.perfObserver) {
      this.perfObserver.disconnect();
    }
    
    this.qualityChangeCallbacks = [];
    this.performanceReportCallbacks = [];
  }
}
