/**
 * Service de visualisation météorologique
 * Gère l'intégration entre les données météo et les effets visuels 3D
 */

import { WeatherVisualizationConfig, getDeviceOptimizedSettings, WindWarning, WeatherEffects, GeoLocation } from '../../config/visualizationConfig';
import { DeviceCapabilities } from '../../utils/device';
import { defaultConfig } from '../../config/visualizationConfig';

// Interfaces pour les services externes (à implémenter ou adapter selon votre architecture)
interface EnhancedWeatherService {
  getColWindConditions(colId: string, location: GeoLocation): Promise<WeatherConditions>;
  registerWindWarningCallback(callback: (warning: WindWarning) => void): void;
}

interface WeatherConditions {
  temperature: number;
  precipitation: number;
  windSpeed: number;
  windDirection: number;
  gustiness?: number;
  visibility: number;
  isEstimated?: boolean;
}

// Classes de visualisation (à implémenter avec Three.js ou votre moteur 3D)
class Weather3DEffects {
  private config: WeatherVisualizationConfig;
  private gpuComputation?: WeatherGPUComputation;
  private scene: any; // Votre scène Three.js
  private particleSystems: Map<string, any> = new Map();
  private fogEffect: any;
  private currentWindSettings: { speed: number, direction: number, gustFactor: number } = { 
    speed: 0, 
    direction: 0, 
    gustFactor: 1.0 
  };

  constructor(config: WeatherVisualizationConfig, gpuComputation?: WeatherGPUComputation, scene?: any) {
    this.config = config;
    this.gpuComputation = gpuComputation;
    this.scene = scene;
    
    // Initialisation des systèmes de particules et effets
    this.initialize();
  }

  private initialize(): void {
    console.log('Initializing weather 3D effects with config:', this.config);
    // Implémentation de l'initialisation des particules, brouillard, etc.
    // Cette méthode dépend de votre moteur 3D spécifique
  }

  public updateEffects(effects: WeatherEffects): void {
    console.log('Updating weather effects:', effects);
    
    // Mise à jour des effets de pluie/neige
    if (effects.rain) {
      const particleSystem = effects.rain.isSnow 
        ? this.particleSystems.get('snow')
        : this.particleSystems.get('rain');
      
      if (particleSystem) {
        // Mettre à jour l'intensité, visibilité, etc.
        console.log(`Updating ${effects.rain.isSnow ? 'snow' : 'rain'} with intensity ${effects.rain.intensity}`);
      }
    } else {
      // Masquer les systèmes de particules de pluie/neige
      const rainSystem = this.particleSystems.get('rain');
      if (rainSystem) {
        rainSystem.visible = false;
      }
      
      const snowSystem = this.particleSystems.get('snow');
      if (snowSystem) {
        snowSystem.visible = false;
      }
    }
    
    // Mise à jour des effets de vent
    if (effects.wind) {
      this.updateWindEffect(effects.wind);
    }
    
    // Mise à jour des effets de brouillard
    if (effects.fog) {
      console.log('Updating fog with density:', effects.fog.density);
      // Mise à jour du brouillard
      if (this.fogEffect) {
        // Implémenter selon votre moteur 3D
      }
    } else if (this.fogEffect) {
      // Désactiver le brouillard
      console.log('Disabling fog');
    }
  }

  public updateWindEffect(wind: { speed: number, direction: number, gustFactor: number }): void {
    console.log('Updating wind effect:', wind);
    // Implémenter les effets de vent (mouvements d'arbres, herbe, etc.)
    
    // Mettre à jour les valeurs actuelles
    this.currentWindSettings = { ...wind };
  }
  
  public setDefaultEffects(): void {
    console.log('Setting default weather effects');
    // Définir des effets météo par défaut sans données réelles
    this.updateEffects({
      rain: null,
      wind: {
        speed: 5,
        direction: 0,
        gustFactor: 1.0
      },
      fog: null
    });
  }
  
  public dispose(): void {
    console.log('Disposing weather 3D effects');
    // Nettoyer les ressources
    this.particleSystems.forEach(system => {
      // Nettoyage du système de particules
      if (system.geometry) system.geometry.dispose();
      if (system.material) system.material.dispose();
    });
    this.particleSystems.clear();
  }

  public getCurrentWindSpeed(): number {
    return this.currentWindSettings.speed;
  }

  public getCurrentWindDirection(): number {
    return this.currentWindSettings.direction;
  }

  public getCurrentGustFactor(): number {
    return this.currentWindSettings.gustFactor;
  }
}

class WeatherGPUComputation {
  private config: WeatherVisualizationConfig;
  private gpuCompute: any; // Votre instance GPUComputationRenderer
  
  constructor(config: WeatherVisualizationConfig) {
    this.config = config;
    this.initialize();
  }
  
  private initialize(): void {
    console.log('Initializing GPU computation for weather effects');
    // Initialiser les calculs GPU pour la simulation de pluie, neige, vent, etc.
    // Dépend de votre implémentation Three.js
  }
  
  public updateComputations(): void {
    // Mettre à jour les calculs GPU
    if (this.gpuCompute) {
      // Exécuter les calculs
    }
  }
  
  public dispose(): void {
    console.log('Disposing GPU computation resources');
    // Nettoyer les ressources GPU
    if (this.gpuCompute) {
      // Supprimer les textures, shaders, etc.
    }
  }
}

/**
 * Service principal de visualisation météorologique
 * Intègre les données météo avec les effets visuels 3D
 */
export class WeatherVisualizationService {
  private weather3DEffects: Weather3DEffects;
  private gpuComputation?: WeatherGPUComputation;
  private weatherService: EnhancedWeatherService;
  private config: WeatherVisualizationConfig;
  private lastUpdateTime: number = 0;
  private updateInterval: number = 60000; // 1 minute par défaut
  private colId?: string;
  private location?: GeoLocation;
  private preloadedEffects: Map<string, Weather3DEffects> = new Map();
  private currentTransition: any = null;
  private transitionDuration: number = 3000; // ms
  
  /**
   * Crée une instance du service de visualisation météorologique
   * @param weatherService Service météo
   * @param deviceCapabilities Capacités de l'appareil
   * @param scene Scène 3D
   * @param batteryLevel Niveau de batterie (optionnel)
   * @param updateInterval Intervalle de mise à jour en ms (optionnel)
   */
  constructor(
    weatherService: EnhancedWeatherService,
    deviceCapabilities: DeviceCapabilities,
    scene?: any,
    batteryLevel?: number,
    updateInterval?: number
  ) {
    this.weatherService = weatherService;
    
    // Initialiser la configuration avec les paramètres optimisés
    this.config = {
      ...defaultConfig,
      ...getDeviceOptimizedSettings(deviceCapabilities, batteryLevel)
    };
    
    console.log('Weather visualization service initialized with config:', this.config);
    
    // Définir l'intervalle de mise à jour (plus long sur mobile pour économiser la batterie)
    if (updateInterval) {
      this.updateInterval = updateInterval;
    } else if (deviceCapabilities.isMobile) {
      this.updateInterval = 120000; // 2 minutes sur mobile
    }

    // Initialiser le calcul GPU si supporté
    if (deviceCapabilities.hasWebGL2 && deviceCapabilities.performanceLevel !== 'low') {
      console.log('Initializing GPU computation for weather effects');
      this.gpuComputation = new WeatherGPUComputation(this.config);
    }

    // Initialiser les effets 3D
    this.weather3DEffects = new Weather3DEffects(
      this.config,
      this.gpuComputation,
      scene
    );

    // S'inscrire aux alertes météo
    this.weatherService.registerWindWarningCallback(this.handleWindWarning);
    
    // Précharger les effets courants pour des transitions plus fluides
    this.preloadCommonEffects();
  }

  /**
   * Précharge les effets météorologiques courants pour minimiser les temps de chargement
   */
  private async preloadCommonEffects(): Promise<void> {
    // Définir les présets météo courants à précharger
    const commonPresets = ['clear', 'light_rain', 'heavy_rain', 'snow', 'fog', 'windy'];
    
    console.log('Préchargement des effets météorologiques courants...');
    
    try {
      await this.preloadEffects(commonPresets);
      console.log('Préchargement terminé pour', commonPresets.length, 'effets');
    } catch (error) {
      console.error('Erreur lors du préchargement des effets:', error);
    }
  }
  
  /**
   * Précharge plusieurs effets météorologiques
   * @param presets Liste des présets à précharger
   */
  public async preloadEffects(presets: string[]): Promise<void> {
    const preloadPromises = presets.map(preset => this.preloadEffect(preset));
    await Promise.all(preloadPromises);
  }
  
  /**
   * Précharge un effet météorologique spécifique
   * @param preset Nom du preset à précharger
   */
  private async preloadEffect(preset: string): Promise<void> {
    try {
      if (this.preloadedEffects.has(preset)) {
        return; // Déjà préchargé
      }
      
      const config = this.getPresetConfig(preset);
      
      // Créer un effet 3D pour ce preset mais le garder invisible
      const effect = new Weather3DEffects(
        { ...this.config, ...config },
        this.gpuComputation
      );
      
      // Stocker l'effet préchargé
      this.preloadedEffects.set(preset, effect);
      
      console.log(`Effet '${preset}' préchargé avec succès`);
    } catch (error) {
      console.error(`Erreur lors du préchargement de l'effet '${preset}':`, error);
    }
  }
  
  /**
   * Obtient la configuration pour un preset météorologique
   */
  private getPresetConfig(preset: string): any {
    // Configurations pour les différents présets météorologiques
    const presetConfigs: { [key: string]: any } = {
      'clear': {
        rainEnabled: false,
        fogEnabled: false,
        windIntensity: 0.2
      },
      'light_rain': {
        rainEnabled: true,
        rainIntensity: 0.3,
        isSnow: false,
        fogEnabled: false,
        windIntensity: 0.4
      },
      'heavy_rain': {
        rainEnabled: true,
        rainIntensity: 0.8,
        isSnow: false,
        fogEnabled: true,
        fogDensity: 0.01,
        windIntensity: 0.6
      },
      'snow': {
        rainEnabled: true,
        rainIntensity: 0.5,
        isSnow: true,
        fogEnabled: true,
        fogDensity: 0.02,
        windIntensity: 0.3
      },
      'fog': {
        rainEnabled: false,
        fogEnabled: true,
        fogDensity: 0.03,
        windIntensity: 0.2
      },
      'windy': {
        rainEnabled: false,
        fogEnabled: false,
        windIntensity: 0.9
      }
    };
    
    return presetConfigs[preset] || presetConfigs['clear'];
  }

  /**
   * Gère les alertes de vent
   */
  private handleWindWarning = (warning: WindWarning): void => {
    console.log('Received wind warning:', warning);
    
    // Ajuster la visualisation du vent selon l'alerte
    this.transitionWindEffect({
      speed: warning.speed,
      direction: warning.direction,
      gustFactor: warning.gustiness || 1.0
    });
  };

  /**
   * Effectue une transition progressive vers un nouvel effet de vent
   */
  private transitionWindEffect(newWindEffect: { speed: number, direction: number, gustFactor: number }): void {
    const startTime = Date.now();
    const startWindEffect = { 
      speed: this.weather3DEffects.getCurrentWindSpeed() || 0,
      direction: this.weather3DEffects.getCurrentWindDirection() || 0,
      gustFactor: this.weather3DEffects.getCurrentGustFactor() || 1.0
    };
    
    // Annuler toute transition en cours
    if (this.currentTransition) {
      cancelAnimationFrame(this.currentTransition);
    }
    
    // Fonction d'animation pour la transition
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / this.transitionDuration, 1);
      
      // Fonction d'easing pour une transition plus naturelle
      const eased = this.easeInOutCubic(progress);
      
      // Interpoler les valeurs
      const currentEffect = {
        speed: startWindEffect.speed + (newWindEffect.speed - startWindEffect.speed) * eased,
        direction: this.interpolateDirection(startWindEffect.direction, newWindEffect.direction, eased),
        gustFactor: startWindEffect.gustFactor + (newWindEffect.gustFactor - startWindEffect.gustFactor) * eased
      };
      
      // Appliquer l'effet intermédiaire
      this.weather3DEffects.updateWindEffect(currentEffect);
      
      // Continuer l'animation si nécessaire
      if (progress < 1) {
        this.currentTransition = requestAnimationFrame(animate);
      } else {
        this.currentTransition = null;
      }
    };
    
    // Démarrer l'animation
    this.currentTransition = requestAnimationFrame(animate);
  }
  
  /**
   * Interpole une direction angulaire (en degrés) en prenant le chemin le plus court
   */
  private interpolateDirection(start: number, end: number, factor: number): number {
    let diff = end - start;
    
    // Prendre le chemin le plus court
    if (Math.abs(diff) > 180) {
      if (diff > 0) {
        diff -= 360;
      } else {
        diff += 360;
      }
    }
    
    return (start + diff * factor + 360) % 360;
  }
  
  /**
   * Fonction d'easing cubique pour des transitions fluides
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Met à jour la visualisation avec les données météo actuelles
   * @param colId ID du col
   * @param location Localisation géographique
   */
  public async updateVisualization(colId: string, location: GeoLocation): Promise<void> {
    this.colId = colId;
    this.location = location;
    
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdateTime;
    
    // Vérifier si une mise à jour est nécessaire
    if (timeSinceLastUpdate < this.updateInterval && this.lastUpdateTime !== 0) {
      console.log('Skipping weather update, last update was', Math.round(timeSinceLastUpdate / 1000), 'seconds ago');
      return;
    }
    
    try {
      console.log(`Updating weather visualization for col ${colId} at location:`, location);
      
      // Récupérer les données météo en temps réel
      const conditions = await this.weatherService.getColWindConditions(
        colId,
        location
      );

      // Déterminer le type d'effet à utiliser
      const effectType = this.determineEffectType(conditions);
      
      // Vérifier si l'effet est préchargé
      if (this.preloadedEffects.has(effectType)) {
        console.log(`Utilisation de l'effet préchargé '${effectType}'`);
        // Transition vers l'effet préchargé
        await this.transitionToEffect(effectType, conditions);
      } else {
        // Mise à jour directe des effets
        this.weather3DEffects.updateEffects({
          rain: conditions.precipitation > 0 ? {
            intensity: Math.min(conditions.precipitation / 10, 1),
            isSnow: conditions.temperature < 2
          } : null,
          wind: {
            speed: conditions.windSpeed,
            direction: conditions.windDirection,
            gustFactor: conditions.gustiness || 1.0
          },
          fog: conditions.visibility < 5000 ? {
            density: Math.min((5000 - conditions.visibility) / 5000, 0.03)
          } : null
        });
      }
      
      // Mettre à jour le timestamp
      this.lastUpdateTime = now;
      
      // Ajouter un indicateur si les données sont estimées
      if (conditions.isEstimated) {
        console.log('Using estimated weather data');
      }
    } catch (error) {
      console.error('Failed to update weather visualization:', error);
      
      // Utiliser des effets par défaut en cas d'erreur
      this.weather3DEffects.setDefaultEffects();
    }
  }
  
  /**
   * Détermine le type d'effet météo à utiliser en fonction des conditions
   */
  private determineEffectType(conditions: any): string {
    if (conditions.temperature < 2 && conditions.precipitation > 0) {
      return 'snow';
    } else if (conditions.precipitation > 5) {
      return 'heavy_rain';
    } else if (conditions.precipitation > 0) {
      return 'light_rain';
    } else if (conditions.visibility < 3000) {
      return 'fog';
    } else if (conditions.windSpeed > 40) {
      return 'windy';
    } else {
      return 'clear';
    }
  }
  
  /**
   * Effectue une transition vers un effet préchargé
   */
  private async transitionToEffect(effectType: string, conditions: any): Promise<void> {
    const targetEffect = this.preloadedEffects.get(effectType);
    if (!targetEffect) return;
    
    const startTime = Date.now();
    
    // Fonction d'animation pour la transition
    return new Promise<void>((resolve) => {
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / this.transitionDuration, 1);
        const eased = this.easeInOutCubic(progress);
        
        // Appliquer la transition
        this.applyTransition(targetEffect, eased, conditions);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Transition terminée
          resolve();
        }
      };
      
      requestAnimationFrame(animate);
    });
  }
  
  /**
   * Applique une transition entre deux effets météo
   */
  private applyTransition(targetEffect: Weather3DEffects, factor: number, conditions: any): void {
    // Implémentation de l'animation de transition
    // Cela dépend de la façon dont les effets 3D sont structurés
    
    // Par exemple, on pourrait modifier l'opacité des systèmes de particules
    // et mélanger les paramètres entre l'ancien et le nouvel effet
  }

  /**
   * Force la mise à jour des effets météo
   */
  public forceUpdate(): void {
    if (this.colId && this.location) {
      this.lastUpdateTime = 0; // Forcer une mise à jour
      this.updateVisualization(this.colId, this.location);
    }
  }
  
  /**
   * Change la qualité des effets météo
   * @param quality Niveau de qualité
   */
  public setQualityLevel(quality: 'low' | 'medium' | 'high'): void {
    console.log('Setting weather effects quality to:', quality);
    
    // Ajuster les paramètres de qualité
    // (Implémentation spécifique selon votre moteur 3D)
    
    // Forcer une mise à jour avec les nouveaux paramètres
    this.forceUpdate();
  }

  /**
   * Libère les ressources utilisées
   */
  public destroy(): void {
    console.log('Destroying weather visualization service');
    
    if (this.weather3DEffects) {
      this.weather3DEffects.dispose();
    }
    
    if (this.gpuComputation) {
      this.gpuComputation.dispose();
    }
    
    // Nettoyer les effets préchargés
    this.preloadedEffects.forEach(effect => {
      effect.dispose();
    });
    this.preloadedEffects.clear();
    
    // Annuler toute transition en cours
    if (this.currentTransition) {
      cancelAnimationFrame(this.currentTransition);
      this.currentTransition = null;
    }
  }
}
