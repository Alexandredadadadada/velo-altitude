/**
 * Service d'intégration des effets météorologiques dans la visualisation 3D
 * Combine la détection automatique des capacités, le calcul GPU et les effets météo
 */

import * as THREE from 'three';
import { 
  WeatherInfo, 
  RecommendationLevel 
} from '../../cols/types/WeatherTypes';
import { Weather3DEffects, Weather3DEffectsConfig } from './Weather3DEffects';
import { WeatherGPUComputation } from './WeatherGPUComputation';
import VISUALIZATION_CONFIG, { 
  detectDeviceCapabilities,
  getDeviceOptimizedSettings,
  getParticleSettings 
} from '../../../config/visualization/visualizationConfig';
import { 
  DeviceCapabilities, 
  VisualizationSettings,
  WeatherPreset
} from '../../../config/visualization/types';
import { PerformanceManager } from '../../../config/visualization/managers/PerformanceManager';
import { WeatherTransitionManager } from '../../../config/visualization/managers/WeatherTransitionManager';
import { 
  WEATHER_PRESETS, 
  getWeatherPreset,
  findClosestPreset 
} from '../../../config/visualization/weatherPresets';

/**
 * Options pour le service de visualisation météo
 */
export interface WeatherVisualizationOptions {
  quality?: 'low' | 'medium' | 'high';
  useGPUComputation?: boolean;
  enableRain?: boolean;
  enableSnow?: boolean;
  enableFog?: boolean;
  enableClouds?: boolean;
  enableWind?: boolean;
  enableLightning?: boolean;
  animationSpeed?: number;
  intensity?: number;
  adaptiveQuality?: boolean;
  preset?: string;
}

/**
 * Service intégrant les effets météorologiques avancés dans la visualisation 3D
 * Gère automatiquement la détection des capacités et l'utilisation du GPU si possible
 */
export class WeatherVisualizationService {
  // Effets météo
  private weatherEffects: Weather3DEffects;
  
  // Calcul GPU
  private gpuComputation: WeatherGPUComputation | null = null;
  
  // Capacités du dispositif
  private deviceCapabilities: DeviceCapabilities;
  
  // Configuration
  private config: VisualizationSettings;
  
  // Gestionnaires
  private performanceManager: PerformanceManager;
  private transitionManager: WeatherTransitionManager;
  
  // État
  private isInitialized: boolean = false;
  private currentQuality: 'low' | 'medium' | 'high';
  private useGPU: boolean = false;
  private currentWeather: WeatherInfo | null = null;
  private animationFrameId?: number;

  /**
   * Constructeur
   * @param scene Scène THREE.js
   * @param renderer Renderer WebGL
   * @param options Options de visualisation
   */
  constructor(
    private scene: THREE.Scene,
    private renderer: THREE.WebGLRenderer,
    private options: WeatherVisualizationOptions = {}
  ) {
    // Détecter les capacités de l'appareil
    this.deviceCapabilities = detectDeviceCapabilities(window.navigator);
    
    // Configurer en fonction des capacités et préférences
    this.config = getDeviceOptimizedSettings(this.deviceCapabilities);
    
    // Déterminer la qualité à utiliser
    this.currentQuality = options.quality || this.config.quality;
    
    // Déterminer si on utilise le GPU
    this.useGPU = options.useGPUComputation !== undefined 
      ? options.useGPUComputation 
      : this.config.useGPU;
    
    // Initialiser les gestionnaires
    this.initManagers();
    
    // Initialiser les effets météo
    this.initWeatherEffects();
    
    // Démarrer la boucle d'animation si nécessaire
    this.startAnimationLoop();
  }
  
  /**
   * Initialise les gestionnaires de performance et transitions
   */
  private initManagers(): void {
    // Gestionnaire de performances
    this.performanceManager = new PerformanceManager((quality: 'low' | 'medium' | 'high') => {
      // Callback appelé lorsque la qualité change automatiquement
      this.setQuality(quality);
    });
    
    if (this.options.adaptiveQuality !== false && this.config.adaptiveQuality) {
      this.performanceManager.startMonitoring();
    }
    
    // Gestionnaire de transitions météo
    this.transitionManager = new WeatherTransitionManager();
  }
  
  /**
   * Initialise les effets météorologiques
   */
  private initWeatherEffects(): void {
    // Configuration des effets météo
    const weatherConfig: Weather3DEffectsConfig = {
      intensity: this.options.intensity || 1.0,
      enableRain: this.options.enableRain !== undefined ? this.options.enableRain : true,
      enableSnow: this.options.enableSnow !== undefined ? this.options.enableSnow : true,
      enableFog: this.options.enableFog !== undefined ? this.options.enableFog : true,
      enableClouds: this.options.enableClouds !== undefined ? this.options.enableClouds : true,
      enableWind: this.options.enableWind !== undefined ? this.options.enableWind : true,
      enableLightning: this.options.enableLightning !== undefined ? this.options.enableLightning : true,
      quality: this.currentQuality,
      animationSpeed: this.options.animationSpeed || 1.0,
      useGPUComputation: this.useGPU
    };
    
    // Créer les effets météo
    this.weatherEffects = new Weather3DEffects(this.scene, weatherConfig, this.renderer);
    
    // Initialiser le calcul GPU si nécessaire
    if (this.useGPU) {
      this.initGPUComputation();
    }
    
    this.isInitialized = true;
  }
  
  /**
   * Initialise le calcul GPU pour les effets météo
   */
  private initGPUComputation(): void {
    if (!this.useGPU || !this.renderer) return;
    
    try {
      // Obtenir les paramètres GPU depuis la configuration
      const rainSettings = getParticleSettings(this.currentQuality, 'rain');
      const snowSettings = getParticleSettings(this.currentQuality, 'snow');
      
      // Configuration pour le GPU
      const gpuConfig: GPUComputationConfig = {
        textureSize: VISUALIZATION_CONFIG.performance.gpu.textureSize,
        particleCount: rainSettings.count + snowSettings.count,
        useHighPrecision: this.deviceCapabilities.browserSupport.floatTextures
      };
      
      // Initialiser le calcul GPU avec les paramètres compatibles
      this.gpuComputation = new WeatherGPUComputation(
        this.renderer, 
        gpuConfig as any // Utiliser any temporairement pour contourner les problèmes de compatibilité
      );
      
      // Connecter le calcul GPU aux effets météo de manière sécurisée
      this.connectGPUToEffects();
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du calcul GPU:', error);
      
      // Désactiver le GPU en cas d'erreur
      this.useGPU = false;
      this.weatherEffects.updateConfig({
        useGPUComputation: false
      });
      
      // Afficher un avertissement à l'utilisateur
      console.warn(
        'Le calcul GPU a été désactivé en raison d\'une erreur. ' +
        'Les effets météorologiques seront calculés sur le CPU.'
      );
    }
  }
  
  /**
   * Connecte le GPU aux effets météo en tenant compte des différences d'API possibles
   */
  private connectGPUToEffects(): void {
    if (!this.gpuComputation || !this.weatherEffects) return;
    
    // Vérifier quelle méthode est disponible
    if (typeof (this.weatherEffects as any).connectGPUComputation === 'function') {
      (this.weatherEffects as any).connectGPUComputation(this.gpuComputation);
    } else if (typeof (this.weatherEffects as any).setGPUComputation === 'function') {
      (this.weatherEffects as any).setGPUComputation(this.gpuComputation);
    } else {
      // Fallback: exposer le GPU à travers la configuration
      this.weatherEffects.updateConfig({
        useGPUComputation: true,
        gpuComputation: this.gpuComputation
      } as any);
    }
  }
  
  /**
   * Vérifie si le dispositif est capable d'utiliser le calcul GPU
   */
  private isCapableOfGPUComputation(): boolean {
    // Vérifier la prise en charge de WebGL2
    if (!this.deviceCapabilities.browserSupport.webGL2) {
      console.warn('WebGL2 non pris en charge, le calcul GPU sera désactivé');
      return false;
    }
    
    // Vérifier la prise en charge des textures flottantes
    if (!this.deviceCapabilities.browserSupport.floatTextures) {
      console.warn('Les textures flottantes ne sont pas prises en charge, le calcul GPU peut être limité');
      // On continue, mais avec une précision réduite
    }
    
    // Vérifications supplémentaires basées sur la puissance de l'appareil
    const performanceScore = this.deviceCapabilities.browserSupport.computeShaders ? 0.8 : 0.4;
    const isLowEndDevice = performanceScore < 0.5;
    
    if (isLowEndDevice) {
      console.warn('Matériel de bas niveau détecté, le calcul GPU sera limité');
      // Continuer seulement si les shader de calcul sont supportés ou si la texture est petite
      return this.deviceCapabilities.browserSupport.computeShaders || 
             VISUALIZATION_CONFIG.performance.gpu.textureSize <= 256;
    }
    
    return true; // Le dispositif supporte le calcul GPU
  }
  
  /**
   * Met à jour les effets météorologiques en fonction des données météo
   * @param weatherInfo Informations météorologiques
   */
  public updateWeatherEffects(weatherInfo: WeatherInfo): void {
    if (!this.isInitialized) return;
    
    // Enregistrer les données météo actuelles
    this.currentWeather = weatherInfo;
    
    // Mettre à jour les effets météo
    this.weatherEffects.updateFromWeatherData(weatherInfo);
  }
  
  /**
   * Transition fluide vers de nouvelles conditions météorologiques
   * @param weatherInfo Nouvelles conditions météorologiques
   * @param duration Durée de la transition en millisecondes
   */
  public transitionToWeather(weatherInfo: WeatherInfo, duration: number = 3000): void {
    if (!this.isInitialized || !this.currentWeather) {
      // Si pas de météo actuelle, simplement mettre à jour
      this.updateWeatherEffects(weatherInfo);
      return;
    }
    
    // Démarrer la transition avec le gestionnaire
    this.transitionManager.transitionTo(
      this.currentWeather,
      weatherInfo,
      duration,
      (interpolated) => {
        // Callback appelé à chaque frame avec la météo interpolée
        this.weatherEffects.updateFromWeatherData(interpolated);
      }
    );
  }
  
  /**
   * Applique un préréglage météorologique prédéfini
   * @param presetName Nom du préréglage
   * @param transitionDuration Durée de la transition
   */
  public applyWeatherPreset(presetName: string, transitionDuration: number = 3000): void {
    const preset = getWeatherPreset(presetName);
    
    if (!preset) {
      console.warn(`Préréglage météorologique "${presetName}" introuvable`);
      return;
    }
    
    // Déterminer le niveau de recommandation en fonction des conditions
    const recommendationLevel = this.getRecommendationFromConditions(preset);
    
    // Construire un objet WeatherInfo complet à partir du préréglage
    const weatherInfo: WeatherInfo = {
      current: {
        temperature: preset.conditions.temperature || 20,
        feelsLike: preset.conditions.temperature || 20,
        humidity: preset.conditions.humidity || 50,
        windSpeed: preset.conditions.windSpeed || 0,
        windDirection: preset.conditions.windDirection || 0,
        precipitation: preset.conditions.precipitation || 0,
        cloudCover: preset.conditions.cloudCover || 0,
        visibility: preset.conditions.visibility ? preset.conditions.visibility * 20000 : 10000,
        pressure: 1013,
        uvIndex: 0,
        weatherCode: 0,
        weatherDescription: preset.name,
        weatherIcon: this.getWeatherIconFromPreset(preset),
        lastUpdated: new Date()
      },
      hourlyForecast: [],
      dailyForecast: [],
      alerts: [],
      cyclingRecommendation: {
        recommendation: recommendationLevel,
        description: preset.description,
        risks: [],
        tips: []
      },
      dataSource: 'WeatherPreset',
      lastUpdated: new Date()
    };
    
    // Appliquer les effets spécifiques
    const effectsConfig: Partial<Weather3DEffectsConfig> = {
      intensity: preset.effects.particles.rainIntensity || preset.effects.particles.snowIntensity || 1.0,
      enableRain: !!preset.effects.particles.rainIntensity,
      enableSnow: !!preset.effects.particles.snowIntensity,
      enableFog: !!preset.effects.particles.fogDensity,
      enableLightning: !!preset.effects.lighting.lightningEnabled
    };
    
    // Mettre à jour la configuration
    this.weatherEffects.updateConfig(effectsConfig);
    
    // Démarrer la transition météo
    this.transitionToWeather(weatherInfo, transitionDuration);
  }
  
  /**
   * Détermine le niveau de recommandation en fonction des conditions météo
   */
  private getRecommendationFromConditions(preset: WeatherPreset): RecommendationLevel {
    // Conditions dangeureuses
    if (
      (preset.effects.particles.snowIntensity && preset.effects.particles.snowIntensity > 0.7) ||
      (preset.effects.particles.rainIntensity && preset.effects.particles.rainIntensity > 0.8) ||
      (preset.conditions.windSpeed && preset.conditions.windSpeed > 20) ||
      (preset.effects.lighting.lightningEnabled)
    ) {
      return RecommendationLevel.DANGEROUS;
    }
    
    // Conditions médiocres
    if (
      (preset.effects.particles.rainIntensity && preset.effects.particles.rainIntensity > 0.4) ||
      (preset.effects.particles.snowIntensity && preset.effects.particles.snowIntensity > 0.3) ||
      (preset.effects.particles.fogDensity && preset.effects.particles.fogDensity > 0.5) ||
      (preset.conditions.windSpeed && preset.conditions.windSpeed > 15)
    ) {
      return RecommendationLevel.POOR;
    }
    
    // Conditions modérées
    if (
      (preset.effects.particles.rainIntensity && preset.effects.particles.rainIntensity > 0.1) ||
      (preset.effects.particles.snowIntensity && preset.effects.particles.snowIntensity > 0.1) ||
      (preset.effects.particles.fogDensity && preset.effects.particles.fogDensity > 0.2) ||
      (preset.conditions.windSpeed && preset.conditions.windSpeed > 10) ||
      (preset.conditions.cloudCover && preset.conditions.cloudCover > 0.7)
    ) {
      return RecommendationLevel.FAIR;
    }
    
    // Conditions bonnes
    if (
      (preset.conditions.cloudCover && preset.conditions.cloudCover > 0.3) ||
      (preset.conditions.temperature && (preset.conditions.temperature < 10 || preset.conditions.temperature > 28))
    ) {
      return RecommendationLevel.GOOD;
    }
    
    // Conditions idéales
    return RecommendationLevel.IDEAL;
  }
  
  /**
   * Détermine l'icône météo à partir d'un préréglage
   * @param preset Préréglage météorologique
   * @returns Nom de l'icône météo
   */
  private getWeatherIconFromPreset(preset: WeatherPreset): string {
    if (preset.effects.particles.rainIntensity && preset.effects.particles.rainIntensity > 0.6) {
      return 'rain';
    } else if (preset.effects.particles.rainIntensity && preset.effects.particles.rainIntensity > 0) {
      return 'drizzle';
    } else if (preset.effects.particles.snowIntensity && preset.effects.particles.snowIntensity > 0) {
      return 'snow';
    } else if (preset.effects.particles.fogDensity && preset.effects.particles.fogDensity > 0.4) {
      return 'fog';
    } else if (preset.effects.lighting.lightningEnabled) {
      return 'thunderstorm';
    } else if (preset.conditions.cloudCover && preset.conditions.cloudCover > 0.7) {
      return 'cloudy';
    } else if (preset.conditions.cloudCover && preset.conditions.cloudCover > 0.3) {
      return 'partly-cloudy-day';
    } else {
      return 'clear-day';
    }
  }
  
  /**
   * Met à jour l'animation des effets météorologiques
   * @param deltaTime Temps écoulé depuis la dernière mise à jour
   */
  public update(deltaTime: number): void {
    if (!this.isInitialized) return;
    
    // Mettre à jour les effets météo
    this.weatherEffects.update(deltaTime);
  }
  
  /**
   * Change la qualité des effets météorologiques
   * @param quality Nouvelle qualité
   */
  public setQuality(quality: 'low' | 'medium' | 'high'): void {
    if (this.currentQuality === quality) return;
    
    this.currentQuality = quality;
    
    // Mettre à jour la configuration des effets météo
    this.weatherEffects.updateConfig({
      quality: quality
    });
    
    // Réinitialiser le calcul GPU si nécessaire
    if (this.useGPU) {
      if (this.gpuComputation) {
        this.gpuComputation.dispose();
      }
      this.initGPUComputation();
    }
  }
  
  /**
   * Active ou désactive le calcul GPU
   * @param enabled Activer le calcul GPU
   */
  public setGPUComputation(enabled: boolean): void {
    if (this.useGPU === enabled) return;
    
    // Vérifier les capacités réelles de l'appareil
    const canUseGPU = enabled && this.isCapableOfGPUComputation();
    this.useGPU = canUseGPU;
    
    // Mettre à jour la configuration des effets météo
    this.weatherEffects.updateConfig({
      useGPUComputation: this.useGPU
    });
    
    // Réinitialiser le calcul GPU si nécessaire
    if (this.useGPU) {
      this.initGPUComputation();
    } else if (this.gpuComputation) {
      this.gpuComputation.dispose();
      this.gpuComputation = null;
    }
  }
  
  /**
   * Active ou désactive un effet météorologique spécifique
   * @param effect Type d'effet
   * @param enabled Activer l'effet
   */
  public toggleEffect(
    effect: 'rain' | 'snow' | 'fog' | 'clouds' | 'wind' | 'lightning', 
    enabled: boolean
  ): void {
    const config: Partial<Weather3DEffectsConfig> = {};
    
    switch (effect) {
      case 'rain':
        config.enableRain = enabled;
        break;
      case 'snow':
        config.enableSnow = enabled;
        break;
      case 'fog':
        config.enableFog = enabled;
        break;
      case 'clouds':
        config.enableClouds = enabled;
        break;
      case 'wind':
        config.enableWind = enabled;
        break;
      case 'lightning':
        config.enableLightning = enabled;
        break;
    }
    
    // Mettre à jour la configuration des effets météo
    this.weatherEffects.updateConfig(config);
  }
  
  /**
   * Ajuste l'intensité globale des effets météorologiques
   * @param intensity Intensité (0-1)
   */
  public setIntensity(intensity: number): void {
    const validIntensity = Math.max(0, Math.min(1, intensity));
    
    // Mettre à jour la configuration des effets météo
    this.weatherEffects.updateConfig({
      intensity: validIntensity
    });
  }
  
  /**
   * Ajuste la vitesse d'animation des effets météorologiques
   * @param speed Vitesse d'animation
   */
  public setAnimationSpeed(speed: number): void {
    const validSpeed = Math.max(0.1, Math.min(2, speed));
    
    // Mettre à jour la configuration des effets météo
    this.weatherEffects.updateConfig({
      animationSpeed: validSpeed
    });
  }
  
  /**
   * Supprime tous les effets météorologiques
   */
  public clear(): void {
    if (!this.isInitialized) return;
    
    this.weatherEffects.clear();
  }
  
  /**
   * Libère les ressources utilisées par le service
   */
  public dispose(): void {
    this.clear();
    
    if (this.gpuComputation) {
      this.gpuComputation.dispose();
      this.gpuComputation = null;
    }
    
    this.isInitialized = false;
  }
  
  /**
   * Obtient les capacités de l'appareil
   * @returns Capacités de l'appareil
   */
  public getDeviceCapabilities(): any {
    return this.deviceCapabilities;
  }
  
  /**
   * Obtient la configuration actuelle
   * @returns Configuration actuelle
   */
  public getConfig(): any {
    return this.config;
  }
  
  /**
   * Démarre la boucle d'animation
   */
  private startAnimationLoop(): void {
    if (this.animationFrameId !== undefined) return;
    
    this.animationFrameId = requestAnimationFrame(() => {
      this.update(0);
      this.startAnimationLoop();
    });
  }
}

// Interface pour le GPU si non disponible dans WeatherGPUComputation
interface GPUComputationConfig {
  textureSize: number;
  particleCount: number;
  useHighPrecision?: boolean;
  [key: string]: any; // Permet d'ajouter des propriétés supplémentaires
}
