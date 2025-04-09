/**
 * Gestionnaire de transitions météorologiques
 * Assure des transitions fluides entre différentes conditions météorologiques
 */
import { WeatherInfo } from '../types';
import VISUALIZATION_CONFIG from '../visualizationConfig';

export class WeatherTransitionManager {
  private currentTransition?: {
    start: WeatherInfo;
    end: WeatherInfo;
    startTime: number;
    duration: number;
    callback?: (weather: WeatherInfo) => void;
  };

  private lastInterpolatedWeather?: WeatherInfo;
  private animationFrameId?: number;

  constructor() {}

  /**
   * Lance une transition entre deux états météorologiques
   */
  public transitionTo(
    current: WeatherInfo,
    target: WeatherInfo,
    duration = VISUALIZATION_CONFIG.transitions.defaultDuration,
    callback?: (weather: WeatherInfo) => void
  ): void {
    // Arrêter toute transition en cours
    this.stopCurrentTransition();
    
    // Configurer la nouvelle transition
    this.currentTransition = {
      start: this.cloneWeatherInfo(current),
      end: this.cloneWeatherInfo(target),
      startTime: performance.now(),
      duration,
      callback
    };
    
    // Démarrer la boucle d'animation
    this.animateTransition();
  }

  /**
   * Arrête la transition en cours
   */
  public stopCurrentTransition(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = undefined;
    }
    this.currentTransition = undefined;
  }

  /**
   * Vérifie si une transition est en cours
   */
  public isTransitioning(): boolean {
    return !!this.currentTransition;
  }

  /**
   * Obtient la météo interpolée actuelle
   */
  public getCurrentWeather(): WeatherInfo | null {
    return this.lastInterpolatedWeather || null;
  }

  /**
   * Anime la transition entre deux états météorologiques
   */
  private animateTransition(): void {
    if (!this.currentTransition) return;
    
    const animate = () => {
      if (!this.currentTransition) return;
      
      const progress = this.getTransitionProgress();
      
      // Transition terminée
      if (progress >= 1) {
        this.lastInterpolatedWeather = this.cloneWeatherInfo(this.currentTransition.end);
        
        // Appeler le callback avec la météo finale
        if (this.currentTransition.callback) {
          this.currentTransition.callback(this.lastInterpolatedWeather);
        }
        
        this.currentTransition = undefined;
        return;
      }
      
      // Interpoler la météo
      const interpolatedWeather = this.interpolateWeather(
        this.currentTransition.start,
        this.currentTransition.end,
        this.applyEasing(progress)
      );
      
      this.lastInterpolatedWeather = interpolatedWeather;
      
      // Appeler le callback avec la météo interpolée
      if (this.currentTransition.callback) {
        this.currentTransition.callback(interpolatedWeather);
      }
      
      // Continuer l'animation
      this.animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
  }

  /**
   * Calcule la progression de la transition
   */
  private getTransitionProgress(): number {
    if (!this.currentTransition) return 1;

    const elapsed = performance.now() - this.currentTransition.startTime;
    return Math.min(elapsed / this.currentTransition.duration, 1);
  }

  /**
   * Applique une fonction d'easing à la progression
   */
  private applyEasing(progress: number): number {
    // Implémentation simple de easeInOutCubic
    return progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
  }

  /**
   * Interpole entre deux états météorologiques
   */
  private interpolateWeather(start: WeatherInfo, end: WeatherInfo, t: number): WeatherInfo {
    // Créer un nouvel objet pour ne pas modifier les originaux
    return {
      current: {
        precipitation: this.lerp(start.current.precipitation, end.current.precipitation, t),
        windSpeed: this.lerp(start.current.windSpeed, end.current.windSpeed, t),
        temperature: this.lerp(start.current.temperature, end.current.temperature, t),
        humidity: this.lerp(start.current.humidity, end.current.humidity, t),
        visibility: this.lerp(start.current.visibility, end.current.visibility, t),
        cloudCover: this.lerp(start.current.cloudCover, end.current.cloudCover, t),
        windDirection: this.lerpAngle(start.current.windDirection, end.current.windDirection, t)
      },
      // Conserver les autres propriétés telles quelles pour l'instant
      forecast: end.forecast,
      historical: end.historical
    };
  }

  /**
   * Interpolation linéaire entre deux valeurs
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * Interpolation pour les angles (degrés)
   */
  private lerpAngle(a: number, b: number, t: number): number {
    // Calculer le chemin le plus court entre deux angles
    const diff = ((b - a + 180) % 360) - 180;
    return (a + diff * t + 360) % 360;
  }

  /**
   * Clone un objet WeatherInfo pour éviter les modifications par référence
   */
  private cloneWeatherInfo(weather: WeatherInfo): WeatherInfo {
    return JSON.parse(JSON.stringify(weather));
  }
}
