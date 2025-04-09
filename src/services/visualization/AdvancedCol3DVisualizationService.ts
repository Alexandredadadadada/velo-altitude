/**
 * Service avancé de visualisation 3D pour les cols
 * Étend le service de base avec des effets météorologiques, un rendu de terrain amélioré 
 * et des fonctionnalités interactives supplémentaires
 */

import * as THREE from 'three';
import { Col3DVisualizationService, Col3DOptions } from './Col3DVisualizationService';
import { WeatherVisualizationService } from './weather/WeatherVisualizationService';
import { Terrain3DRenderer, Terrain3DConfig } from './terrain/Terrain3DRenderer';
import { Col } from '../cols/types/ColTypes';
import { ElevationProfile } from '../cols/types/ElevationTypes';
import { WeatherInfo } from '../cols/types/WeatherTypes';

/**
 * Options étendues pour la visualisation 3D avancée
 */
export interface AdvancedCol3DOptions extends Col3DOptions {
  // Options pour les effets météorologiques
  weatherEffects: boolean;
  weatherConfig?: Partial<WeatherVisualizationService['config']>;
  
  // Options pour le rendu de terrain amélioré
  enhancedTerrain: boolean;
  terrainConfig?: Partial<Terrain3DConfig>;
  
  // Options pour les fonctionnalités interactives
  interactive: boolean;
  enableFlythrough: boolean;
  enableTimeOfDay: boolean;
  
  // Options pour les effets visuels
  enablePostProcessing: boolean;
  enableBloom: boolean;
  enableSSAO: boolean;
}

/**
 * Service de visualisation 3D avancée pour les cols
 * Ajoute des effets météorologiques, un rendu de terrain amélioré,
 * et des fonctionnalités interactives supplémentaires au service de base
 */
export class AdvancedCol3DVisualizationService extends Col3DVisualizationService {
  // Composants avancés
  private weatherVisualization?: WeatherVisualizationService;
  private terrainRenderer?: Terrain3DRenderer;
  
  // Gestion du temps
  private timeOfDay: number = 12; // Heure (0-24)
  private animateTimeOfDay: boolean = false;
  private timeSpeed: number = 1; // Vitesse d'écoulement du temps
  
  // Parcours virtuel
  private flythrough: {
    active: boolean;
    progress: number;
    speed: number;
    camera: THREE.PerspectiveCamera;
  } = {
    active: false,
    progress: 0,
    speed: 0.001,
    camera: new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
  };
  
  // Options par défaut pour les fonctionnalités avancées
  private defaultAdvancedOptions: AdvancedCol3DOptions = {
    ...this.defaultOptions,
    weatherEffects: true,
    weatherConfig: {
      quality: 'medium',
      useGPUComputation: true,
      enableRain: true,
      enableSnow: true,
      enableFog: true,
      enableClouds: true,
      enableWind: true,
      enableLightning: true,
      intensity: 1.0,
      animationSpeed: 1.0
    },
    enhancedTerrain: true,
    terrainConfig: {
      resolution: 'medium',
      textureQuality: 'medium',
      enableHeightMap: true,
      enableNormalMap: true,
      enableShadows: true,
      terrainScale: 1.0,
      detailLevel: 3,
      waterLevel: 0,
      enableWater: true,
      enableVegetation: true,
      vegetationDensity: 0.5,
      snowLevel: 1800,
      enableSnowcaps: true
    },
    interactive: true,
    enableFlythrough: true,
    enableTimeOfDay: true,
    enablePostProcessing: false,
    enableBloom: false,
    enableSSAO: false
  };

  /**
   * Constructeur
   * @param container Élément HTML contenant la visualisation
   * @param options Options de configuration
   */
  constructor(
    container: HTMLElement,
    options: Partial<AdvancedCol3DOptions> = {}
  ) {
    // Fusionner les options par défaut et les options fournies
    const mergedOptions = { ...new.target.prototype.defaultAdvancedOptions, ...options };
    
    // Appeler le constructeur parent
    super(container, mergedOptions);
    
    // Initialiser les composants avancés si activés
    this.initializeAdvancedComponents(mergedOptions);
  }

  /**
   * Initialise les composants avancés
   * @param options Options de configuration
   */
  private initializeAdvancedComponents(options: AdvancedCol3DOptions): void {
    // Initialiser les effets météorologiques
    if (options.weatherEffects) {
      this.weatherVisualization = new WeatherVisualizationService(
        this.scene,
        this.renderer,
        options.weatherConfig
      );
    }
    
    // Initialiser le rendu de terrain amélioré
    if (options.enhancedTerrain) {
      this.terrainRenderer = new Terrain3DRenderer(
        this.scene,
        options.terrainConfig
      );
    }
    
    // Initialiser la caméra de parcours virtuel
    if (options.enableFlythrough) {
      this.setupFlythroughCamera();
    }
    
    // Initialiser les contrôles interactifs
    if (options.interactive) {
      this.setupInteractiveControls();
    }
  }

  /**
   * Configure la caméra pour le parcours virtuel
   */
  private setupFlythroughCamera(): void {
    // Configurer la caméra de parcours virtuel
    this.flythrough.camera = new THREE.PerspectiveCamera(
      90, // Champ de vision plus large pour l'immersion
      this.options.width / this.options.height,
      0.1,
      1000
    );
    
    // Ajouter la caméra à la scène, mais ne pas l'utiliser tout de suite
    this.scene.add(this.flythrough.camera);
  }

  /**
   * Configure les contrôles interactifs supplémentaires
   */
  private setupInteractiveControls(): void {
    // Cette méthode pourrait être implémentée pour ajouter des contrôles GUI pour
    // régler les paramètres en temps réel, mais cela nécessiterait une bibliothèque
    // supplémentaire comme dat.gui ou tweakpane.
    // 
    // Pour l'instant, nous allons simplement ajouter des méthodes publiques pour
    // configurer ces paramètres par programmation.
  }

  /**
   * Visualise un col en 3D avec les fonctionnalités avancées
   * @param col Col à visualiser
   * @returns Promise résolue lorsque la visualisation est prête
   */
  public async visualizeCol(col: Col): Promise<void> {
    // Stocker les données
    this.currentCol = col;
    this.currentElevationProfile = col.elevationProfile;
    
    // Nettoyer la scène
    this.clearScene();
    
    // Utiliser le rendu de terrain amélioré si disponible
    if (this.options.enhancedTerrain && this.terrainRenderer) {
      await this.visualizeWithEnhancedTerrain(col);
    } else {
      // Sinon, utiliser le rendu de base
      await super.visualizeCol(col);
    }
    
    // Appliquer les effets météorologiques si disponibles et si des données météo existent
    if (this.options.weatherEffects && this.weatherVisualization && col.weather) {
      this.weatherVisualization.updateWeatherEffects(col.weather);
    }
    
    // Préparer le parcours virtuel
    if (this.options.enableFlythrough) {
      this.prepareFlythroughPath(col.elevationProfile);
    }
    
    // Ajuster l'heure du jour si activée
    if (this.options.enableTimeOfDay) {
      this.updateTimeOfDay(this.timeOfDay);
    }
    
    // Démarrer l'animation si nécessaire
    if (!this.animating) {
      this.startAnimation();
    }
  }

  /**
   * Visualise un col avec le rendu de terrain amélioré
   * @param col Col à visualiser
   */
  private async visualizeWithEnhancedTerrain(col: Col): Promise<void> {
    if (!this.terrainRenderer || !col.elevationProfile) return;
    
    // Calculer les limites géographiques du terrain
    const bounds = this.calculateTerrainBounds(col.elevationProfile);
    
    // Charger le terrain avec le renderer avancé
    this.terrainRenderer.loadTerrain(col.elevationProfile, bounds);
    
    // Ajouter le chemin
    this.createPath(col.elevationProfile.points);
    
    // Ajouter les marqueurs
    this.addMarkers(col);
    
    // Optimiser la vue
    this.focusView();
  }

  /**
   * Calcule les limites géographiques du terrain
   * @param profile Profil d'élévation
   * @returns Limites géographiques
   */
  private calculateTerrainBounds(profile: ElevationProfile): { 
    min: { lat: number, lng: number }, 
    max: { lat: number, lng: number } 
  } {
    if (!profile || !profile.points || profile.points.length === 0) {
      return {
        min: { lat: 0, lng: 0 },
        max: { lat: 1, lng: 1 }
      };
    }
    
    // Trouver les min/max des coordonnées
    let minLat = Infinity, minLng = Infinity;
    let maxLat = -Infinity, maxLng = -Infinity;
    
    profile.points.forEach(point => {
      if (point.lat < minLat) minLat = point.lat;
      if (point.lat > maxLat) maxLat = point.lat;
      if (point.lng < minLng) minLng = point.lng;
      if (point.lng > maxLng) maxLng = point.lng;
    });
    
    // Ajouter une marge pour le rendu
    const latMargin = (maxLat - minLat) * 0.1;
    const lngMargin = (maxLng - minLng) * 0.1;
    
    return {
      min: { lat: minLat - latMargin, lng: minLng - lngMargin },
      max: { lat: maxLat + latMargin, lng: maxLng + lngMargin }
    };
  }

  /**
   * Prépare le parcours virtuel le long du profil d'élévation
   * @param profile Profil d'élévation
   */
  private prepareFlythroughPath(profile: ElevationProfile): void {
    if (!profile || !profile.points || profile.points.length < 2) return;
    
    // Réinitialiser le parcours
    this.flythrough.progress = 0;
    this.flythrough.active = false;
  }

  /**
   * Met à jour l'heure du jour et les conditions d'éclairage
   * @param hour Heure (0-24)
   */
  private updateTimeOfDay(hour: number): void {
    this.timeOfDay = hour;
    
    // Calculer l'angle du soleil (0h = -90°, 12h = 90°, 24h = -90°)
    const sunAngle = ((hour / 24) * 360 - 90) * Math.PI / 180;
    
    // Calculer la position du soleil
    const sunDistance = 100;
    const sunX = Math.cos(sunAngle) * sunDistance;
    const sunY = Math.sin(sunAngle) * sunDistance;
    
    // Mettre à jour les lumières
    this.scene.traverse(object => {
      if (object instanceof THREE.DirectionalLight) {
        // Supposons que la première lumière directionnelle est le soleil
        object.position.set(sunX, sunY, 0);
        
        // Ajuster l'intensité en fonction de l'heure
        // Plus lumineux à midi, plus sombre la nuit
        const dayFactor = 1 - Math.abs((hour - 12) / 12);
        object.intensity = 0.2 + dayFactor * 0.8;
      } else if (object instanceof THREE.AmbientLight) {
        // Ajuster la lumière ambiante
        const ambientFactor = 0.2 + dayFactor * 0.4;
        object.intensity = ambientFactor;
      }
    });
    
    // Ajuster la couleur du ciel
    if (hour < 6 || hour > 18) {
      // Nuit
      this.scene.background = new THREE.Color(0x050A30);
    } else if (hour < 8 || hour > 16) {
      // Lever/coucher du soleil
      this.scene.background = new THREE.Color(0xF9A56B);
    } else {
      // Jour
      this.scene.background = new THREE.Color(0x87CEEB);
    }
  }

  /**
   * Démarre le parcours virtuel
   * @param speed Vitesse du parcours (0-1)
   */
  public startFlythrough(speed: number = 0.001): void {
    if (!this.options.enableFlythrough || !this.currentElevationProfile) return;
    
    this.flythrough.active = true;
    this.flythrough.speed = Math.max(0.0001, Math.min(0.01, speed));
    this.flythrough.progress = 0;
  }

  /**
   * Arrête le parcours virtuel
   */
  public stopFlythrough(): void {
    this.flythrough.active = false;
    
    // Revenir à la caméra normale
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Active/désactive l'animation de l'heure du jour
   * @param animate Activer l'animation
   * @param speed Vitesse de l'animation (heures par seconde)
   */
  public setTimeAnimation(animate: boolean, speed: number = 1): void {
    if (!this.options.enableTimeOfDay) return;
    
    this.animateTimeOfDay = animate;
    this.timeSpeed = Math.max(0.1, Math.min(24, speed));
  }

  /**
   * Définit l'heure du jour
   * @param hour Heure (0-24)
   */
  public setTimeOfDay(hour: number): void {
    if (!this.options.enableTimeOfDay) return;
    
    // Normaliser l'heure entre 0 et 24
    hour = ((hour % 24) + 24) % 24;
    
    this.updateTimeOfDay(hour);
  }

  /**
   * Met à jour les données météorologiques
   * @param weather Données météo
   */
  public updateWeather(weather: WeatherInfo): void {
    if (!this.options.weatherEffects || !this.weatherVisualization) return;
    
    this.weatherVisualization.updateWeatherEffects(weather);
  }

  /**
   * Configure les effets météorologiques
   * @param config Configuration des effets météo
   */
  public configureWeather(config: Partial<WeatherVisualizationService['config']>): void {
    if (!this.options.weatherEffects || !this.weatherVisualization) return;
    
    this.weatherVisualization.updateConfig(config);
  }

  /**
   * Configure le rendu de terrain
   * @param config Configuration du terrain
   */
  public configureTerrain(config: Partial<Terrain3DConfig>): void {
    if (!this.options.enhancedTerrain || !this.terrainRenderer) return;
    
    this.terrainRenderer.updateConfig(config);
  }

  /**
   * Méthode de mise à jour surcharge
   */
  protected override updateAnimations(): void {
    // Appeler la mise à jour de base
    super.updateAnimations();
    
    const deltaTime = 0.016; // ~60fps
    
    // Mettre à jour les effets météorologiques
    if (this.weatherVisualization) {
      this.weatherVisualization.update(deltaTime);
    }
    
    // Mettre à jour le rendu de terrain
    if (this.terrainRenderer) {
      this.terrainRenderer.update(deltaTime);
    }
    
    // Mettre à jour l'heure du jour
    if (this.animateTimeOfDay) {
      const newTime = (this.timeOfDay + deltaTime * this.timeSpeed) % 24;
      this.updateTimeOfDay(newTime);
    }
    
    // Mettre à jour le parcours virtuel
    if (this.flythrough.active) {
      this.updateFlythrough(deltaTime);
    }
  }

  /**
   * Met à jour le parcours virtuel
   * @param deltaTime Temps écoulé depuis la dernière mise à jour
   */
  private updateFlythrough(deltaTime: number): void {
    if (!this.currentElevationProfile?.points || this.currentElevationProfile.points.length < 2) {
      this.flythrough.active = false;
      return;
    }
    
    // Avancer sur le parcours
    this.flythrough.progress += this.flythrough.speed * deltaTime * 100;
    
    // Si on a atteint la fin, arrêter ou boucler
    if (this.flythrough.progress >= 1) {
      // Option: boucler ou arrêter
      this.flythrough.progress = 0; // Pour boucler
      // this.flythrough.active = false; // Pour arrêter
    }
    
    // Calculer la position sur le parcours
    const points = this.currentElevationProfile.points;
    const segmentIndex = Math.floor(this.flythrough.progress * (points.length - 1));
    const segmentProgress = (this.flythrough.progress * (points.length - 1)) - segmentIndex;
    
    // Obtenir les points actuels et suivants
    const currentPoint = points[segmentIndex];
    const nextPoint = points[Math.min(segmentIndex + 1, points.length - 1)];
    
    // Interpoler la position
    const position = new THREE.Vector3(
      segmentIndex + segmentProgress,
      0,
      currentPoint.altitude + (nextPoint.altitude - currentPoint.altitude) * segmentProgress
    );
    
    // Calculer la direction (regarder vers le prochain point ou plus loin)
    const lookIndex = Math.min(segmentIndex + 5, points.length - 1);
    const lookPoint = points[lookIndex];
    const lookPosition = new THREE.Vector3(
      lookIndex,
      0,
      lookPoint.altitude
    );
    
    // Positionner la caméra
    const heightOffset = 0.5; // Hauteur au-dessus du terrain
    this.flythrough.camera.position.set(
      position.x,
      position.z * this.options.exaggeration + heightOffset,
      position.y
    );
    
    // Orienter la caméra
    this.flythrough.camera.lookAt(
      lookPosition.x,
      lookPosition.z * this.options.exaggeration + heightOffset,
      lookPosition.y
    );
    
    // Utiliser cette caméra pour le rendu
    this.renderer.render(this.scene, this.flythrough.camera);
  }

  /**
   * Nettoie la scène et libère les ressources supplémentaires
   */
  protected override clearScene(): void {
    // Nettoyer les composants avancés
    if (this.weatherVisualization) {
      this.weatherVisualization.clear();
    }
    
    if (this.terrainRenderer) {
      this.terrainRenderer.clear();
    }
    
    // Appeler la méthode de nettoyage parent
    super.clearScene();
  }

  /**
   * Libère toutes les ressources
   */
  public override dispose(): void {
    // Arrêter les animations spécifiques
    this.flythrough.active = false;
    this.animateTimeOfDay = false;
    
    // Nettoyer les composants spécifiques
    if (this.weatherVisualization) {
      this.weatherVisualization.clear();
      this.weatherVisualization = undefined;
    }
    
    if (this.terrainRenderer) {
      this.terrainRenderer.clear();
      this.terrainRenderer = undefined;
    }
    
    // Appeler la méthode de libération parent
    super.dispose();
  }
}
