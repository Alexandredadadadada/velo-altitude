/**
 * Système d'intégration des composants météorologiques avancés
 * Coordonne les interactions entre les différents systèmes
 */

import { WeatherPredictionSystem } from './WeatherPredictionSystem';
import { GPUResourceManager } from './GPUResourceManager';
import { DynamicAdaptationSystem } from './DynamicAdaptationSystem';
import { AdvancedWeatherMonitoring } from '../monitoring/AdvancedWeatherMonitoring';
import { getDeviceCapabilities, DeviceCapabilities } from '../../utils/device';
import { WeatherVisualizationService } from '../visualization/WeatherVisualizationService';
import { GeoLocation } from '../../config/visualizationConfig';

// Interface pour les résultats d'optimisation
export interface OptimizationResult {
  applied: boolean;
  strategy?: string;
  impact?: {
    fps?: number;
    memory?: number;
    battery?: number;
  };
  details?: string;
}

/**
 * Classe principale d'intégration des systèmes météorologiques
 */
export class WeatherSystemIntegration {
  private predictionSystem: WeatherPredictionSystem;
  private resourceManager: GPUResourceManager;
  private adaptationSystem: DynamicAdaptationSystem;
  private monitoring: AdvancedWeatherMonitoring;
  private visualizationService?: WeatherVisualizationService;
  
  private deviceCapabilities: DeviceCapabilities;
  private isInitialized: boolean = false;
  private activeWeatherEffects: Set<string> = new Set();
  private preloadedEffects: Set<string> = new Set();
  private batteryLevel?: number;
  private proactiveOptimizationEnabled: boolean = true;
  private predictionEnabled: boolean = true;
  private autoAdaptEnabled: boolean = true;
  
  // Callbacks et nettoyage
  private cleanupCallbacks: Array<() => void> = [];
  private optimizationCallbacks: Array<(result: OptimizationResult) => void> = [];
  
  /**
   * Constructeur
   */
  constructor(
    monitoring: AdvancedWeatherMonitoring,
    predictionSystem?: WeatherPredictionSystem,
    resourceManager?: GPUResourceManager,
    adaptationSystem?: DynamicAdaptationSystem
  ) {
    // Récupérer les capacités de l'appareil
    this.deviceCapabilities = getDeviceCapabilities();
    
    // Utiliser les systèmes fournis ou en créer de nouveaux
    this.monitoring = monitoring;
    this.predictionSystem = predictionSystem || new WeatherPredictionSystem();
    this.resourceManager = resourceManager || new GPUResourceManager(this.deviceCapabilities);
    this.adaptationSystem = adaptationSystem || new DynamicAdaptationSystem();
    
    // Surveiller le niveau de batterie
    this.initializeBatteryMonitoring();
    
    console.log('Weather System Integration created');
  }
  
  /**
   * Initialise le système d'intégration
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('Initializing Weather System Integration');
    
    try {
      // Initialiser le gestionnaire de ressources
      this.resourceManager.initialize();
      
      // Configurer les interactions entre systèmes
      await this.setupSystemInteractions();
      
      this.isInitialized = true;
      console.log('Weather System Integration initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Weather System Integration:', error);
      throw error;
    }
  }
  
  /**
   * Configure le service de visualisation
   */
  public setVisualizationService(service: WeatherVisualizationService): void {
    this.visualizationService = service;
    console.log('Visualization service registered with integration system');
  }
  
  /**
   * Configure les interactions entre les différents systèmes
   */
  private async setupSystemInteractions(): Promise<void> {
    // 1. Monitoring influence l'adaptation
    const monitoringCallback = this.monitoring.onPerformanceIssue(async (issue) => {
      if (!this.autoAdaptEnabled) return;
      
      console.log(`Performance issue detected by monitoring: ${issue.type} (${issue.severity})`);
      
      const context = {
        batteryLevel: this.batteryLevel,
        deviceCapabilities: this.deviceCapabilities,
        colId: issue.metrics.colId,
        weatherType: this.getActiveWeatherType()
      };
      
      const adaptation = await this.adaptationSystem.handleIssue(issue, context);
      
      if (adaptation) {
        console.log(`Applied adaptation: ${adaptation.name}`);
        
        // Appliquer les ajustements aux autres systèmes
        await this.applyAdaptationToSystems(adaptation);
        
        // Notifier les callbacks
        this.notifyOptimizationResult({
          applied: true,
          strategy: adaptation.name,
          impact: {
            fps: adaptation.estimatedImpact.fps,
            memory: adaptation.estimatedImpact.memoryUsage,
            battery: adaptation.estimatedImpact.batteryDrain
          },
          details: adaptation.description
        });
      }
    });
    
    // 2. Prédiction influence le préchargement
    const predictionCallback = this.predictionSystem.onPrediction(async (predictions, colId) => {
      if (!this.predictionEnabled || !this.visualizationService) return;
      
      console.log(`Weather prediction received for col ${colId}:`, predictions);
      
      // Précharger les effets prédits
      for (const effectType of predictions) {
        if (!this.preloadedEffects.has(effectType)) {
          try {
            await this.preloadWeatherEffect(effectType);
            this.preloadedEffects.add(effectType);
          } catch (error) {
            console.error(`Failed to preload weather effect ${effectType}:`, error);
          }
        }
      }
      
      // Si l'optimisation proactive est activée, préparer les ressources
      if (this.proactiveOptimizationEnabled) {
        const nextEffect = predictions[0]; // Le plus probable
        if (nextEffect) {
          const resources = this.prepareResourcesForEffect(nextEffect);
          await this.resourceManager.preloadResources(nextEffect, resources);
        }
      }
    });
    
    // 3. Adaptation influence la gestion des ressources
    const adaptationCallback = this.adaptationSystem.onAdaptationChange(async (strategy, active) => {
      console.log(`Adaptation ${strategy.id} ${active ? 'activated' : 'deactivated'}`);
      
      if (active) {
        // Appliquer l'adaptation aux ressources GPU
        if (strategy.id === 'reduce_particles') {
          await this.resourceManager.optimizeResources('low');
        } else if (strategy.id === 'reduce_resolution') {
          await this.resourceManager.optimizeResources('low');
        }
      } else {
        // Restaurer les ressources GPU
        const quality = this.deviceCapabilities.performanceLevel;
        await this.resourceManager.optimizeResources(quality);
      }
    });
    
    // Enregistrer les callbacks pour le nettoyage
    this.cleanupCallbacks.push(monitoringCallback);
    this.cleanupCallbacks.push(predictionCallback);
    this.cleanupCallbacks.push(adaptationCallback);
    
    // Démarrer l'optimisation proactive si activée
    if (this.proactiveOptimizationEnabled) {
      this.startProactiveOptimization();
    }
  }
  
  /**
   * Initialise le monitoring de la batterie
   */
  private initializeBatteryMonitoring(): void {
    try {
      if ('getBattery' in navigator) {
        (navigator as any).getBattery().then((battery: any) => {
          this.batteryLevel = battery.level;
          
          // Écouter les changements de niveau de batterie
          battery.addEventListener('levelchange', () => {
            this.batteryLevel = battery.level;
            
            // Adapter la qualité si la batterie est faible
            if (this.batteryLevel < 0.2 && this.autoAdaptEnabled) {
              this.optimizeForLowBattery();
            }
          });
        });
      }
    } catch (e) {
      console.warn('Battery API not supported:', e);
    }
  }
  
  /**
   * Démarre l'optimisation proactive
   */
  private startProactiveOptimization(): void {
    // Planifier une optimisation proactive toutes les minutes
    const interval = setInterval(async () => {
      if (!this.proactiveOptimizationEnabled) {
        clearInterval(interval);
        return;
      }
      
      try {
        // Effectuer une optimisation proactive
        const result = await this.monitoring.optimizeProactively();
        
        if (result) {
          console.log('Proactive optimization performed');
        }
        
        // Nettoyer les ressources inutilisées
        this.resourceManager.manageLifecycle(this.activeWeatherEffects);
      } catch (error) {
        console.error('Error during proactive optimization:', error);
      }
    }, 60000); // 1 minute
    
    // Enregistrer pour le nettoyage
    this.cleanupCallbacks.push(() => clearInterval(interval));
  }
  
  /**
   * Optimise pour une batterie faible
   */
  private async optimizeForLowBattery(): Promise<void> {
    console.log('Optimizing for low battery');
    
    try {
      // Réduire la qualité
      if (this.visualizationService) {
        this.visualizationService.setQualityLevel('low');
      }
      
      // Optimiser les ressources
      await this.resourceManager.optimizeResources('low');
      
      // Notifier les callbacks
      this.notifyOptimizationResult({
        applied: true,
        strategy: 'battery_saver',
        impact: {
          fps: 5,
          memory: 0,
          battery: -30
        },
        details: 'Optimisation pour batterie faible'
      });
    } catch (error) {
      console.error('Error optimizing for low battery:', error);
    }
  }
  
  /**
   * Précharge un effet météorologique
   */
  private async preloadWeatherEffect(effectType: string): Promise<void> {
    console.log(`Preloading weather effect: ${effectType}`);
    
    if (this.visualizationService) {
      try {
        // Précharger l'effet dans le service de visualisation
        if (typeof this.visualizationService.preloadEffect === 'function') {
          await this.visualizationService.preloadEffect(effectType);
        } else if (typeof this.visualizationService.preloadEffects === 'function') {
          await this.visualizationService.preloadEffects([effectType]);
        }
        
        console.log(`Weather effect ${effectType} preloaded successfully`);
      } catch (error) {
        console.error(`Error preloading weather effect ${effectType}:`, error);
      }
    }
  }
  
  /**
   * Prépare les ressources pour un effet météorologique
   */
  private prepareResourcesForEffect(effectType: string): any {
    // Cette fonction devrait retourner les ressources spécifiques à précharger
    // pour un effet météorologique donné
    
    // Structure simplifiée pour la démonstration
    const resources: any = {
      textures: {},
      geometries: {},
      materials: {},
      shaders: {}
    };
    
    switch (effectType) {
      case 'light_rain':
      case 'heavy_rain':
        resources.textures.rainDrop = {}; // Texture de goutte de pluie
        resources.textures.ripple = {}; // Texture d'ondulation
        resources.geometries.particle = {}; // Géométrie de particule
        resources.shaders.rain = {}; // Shader de pluie
        break;
        
      case 'snow':
        resources.textures.snowflake = {}; // Texture de flocon
        resources.geometries.particle = {}; // Géométrie de particule
        resources.shaders.snow = {}; // Shader de neige
        break;
        
      case 'fog':
        resources.textures.noise = {}; // Texture de bruit
        resources.shaders.fog = {}; // Shader de brouillard
        break;
    }
    
    return resources;
  }
  
  /**
   * Obtient le type d'effet météorologique actif
   */
  private getActiveWeatherType(): string {
    if (this.activeWeatherEffects.size === 0) {
      return 'clear';
    }
    
    // Retourner le premier effet actif (il devrait normalement n'y en avoir qu'un)
    return Array.from(this.activeWeatherEffects)[0];
  }
  
  /**
   * Applique une adaptation aux différents systèmes
   */
  private async applyAdaptationToSystems(adaptation: any): Promise<void> {
    // Appliquer à la visualisation
    if (this.visualizationService) {
      switch (adaptation.id) {
        case 'reduce_particles':
          // Réduire la qualité
          this.visualizationService.setQualityLevel('low');
          break;
          
        case 'battery_saver':
          // Réduire la qualité et l'intervalle de mise à jour
          this.visualizationService.setQualityLevel('low');
          break;
      }
    }
    
    // Appliquer au gestionnaire de ressources
    switch (adaptation.id) {
      case 'reduce_particles':
      case 'reduce_resolution':
        await this.resourceManager.optimizeResources('low');
        break;
    }
  }
  
  /**
   * Notifie qu'un effet météo a été activé
   */
  public notifyWeatherEffectActivated(
    effectType: string,
    colId: string,
    location: GeoLocation
  ): void {
    console.log(`Weather effect activated: ${effectType} for col ${colId}`);
    
    // Mettre à jour l'ensemble des effets actifs
    this.activeWeatherEffects.add(effectType);
    
    // Notifier le système de prédiction
    if (this.predictionEnabled) {
      try {
        // Récupérer les conditions météo (simplifiées pour la démonstration)
        const conditions = {
          temperature: 20,
          precipitation: effectType.includes('rain') ? 10 : 0,
          windSpeed: 5,
          windDirection: 0,
          visibility: effectType === 'fog' ? 1000 : 10000,
          isEstimated: false
        };
        
        this.predictionSystem.updateCurrentState(colId, conditions, effectType, location);
      } catch (error) {
        console.error('Error updating prediction system:', error);
      }
    }
    
    // Gérer les ressources
    this.resourceManager.manageLifecycle(this.activeWeatherEffects);
  }
  
  /**
   * Notifie qu'un effet météo a été désactivé
   */
  public notifyWeatherEffectDeactivated(effectType: string): void {
    console.log(`Weather effect deactivated: ${effectType}`);
    
    // Mettre à jour l'ensemble des effets actifs
    this.activeWeatherEffects.delete(effectType);
    
    // Gérer les ressources
    this.resourceManager.manageLifecycle(this.activeWeatherEffects);
  }
  
  /**
   * S'abonne aux résultats d'optimisation
   */
  public onOptimizationResult(
    callback: (result: OptimizationResult) => void
  ): () => void {
    this.optimizationCallbacks.push(callback);
    
    return () => {
      this.optimizationCallbacks = this.optimizationCallbacks.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Notifie les callbacks d'optimisation
   */
  private notifyOptimizationResult(result: OptimizationResult): void {
    this.optimizationCallbacks.forEach(callback => {
      try {
        callback(result);
      } catch (error) {
        console.error('Error in optimization result callback:', error);
      }
    });
  }
  
  /**
   * Configure les options du système
   */
  public configure(options: {
    proactiveOptimization?: boolean;
    prediction?: boolean;
    autoAdapt?: boolean;
  }): void {
    if (options.proactiveOptimization !== undefined) {
      this.proactiveOptimizationEnabled = options.proactiveOptimization;
    }
    
    if (options.prediction !== undefined) {
      this.predictionEnabled = options.prediction;
    }
    
    if (options.autoAdapt !== undefined) {
      this.autoAdaptEnabled = options.autoAdapt;
    }
    
    console.log('Weather System Integration configured:', {
      proactiveOptimization: this.proactiveOptimizationEnabled,
      prediction: this.predictionEnabled,
      autoAdapt: this.autoAdaptEnabled
    });
  }
  
  /**
   * Nettoie les ressources
   */
  public dispose(): void {
    console.log('Disposing Weather System Integration');
    
    // Nettoyer les callbacks
    this.cleanupCallbacks.forEach(cleanup => {
      try {
        cleanup();
      } catch (error) {
        console.error('Error cleaning up callback:', error);
      }
    });
    
    // Nettoyer les systèmes
    this.resourceManager.dispose();
    this.adaptationSystem.dispose();
    this.monitoring.dispose();
    
    // Nettoyer les ensembles
    this.activeWeatherEffects.clear();
    this.preloadedEffects.clear();
    
    // Réinitialiser les flags
    this.isInitialized = false;
    this.cleanupCallbacks = [];
    this.optimizationCallbacks = [];
    
    console.log('Weather System Integration disposed');
  }
}
