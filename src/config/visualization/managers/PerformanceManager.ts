/**
 * Gestionnaire de performances pour l'optimisation dynamique
 * Surveille le FPS et ajuste automatiquement la qualité des visuels
 */
import VISUALIZATION_CONFIG from '../visualizationConfig';

export class PerformanceManager {
  private frames = 0;
  private lastTime = performance.now();
  private currentFps = 0;
  private qualityLevel: 'low' | 'medium' | 'high' = 'medium';
  private isMonitoring = false;
  private adaptationCooldown = 0;
  private animationFrameId?: number;

  constructor(
    private onQualityChange: (quality: 'low' | 'medium' | 'high') => void
  ) {}

  /**
   * Démarre la surveillance des performances
   */
  public startMonitoring(): void {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    this.monitorLoop();
  }

  /**
   * Arrête la surveillance des performances
   */
  public stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  /**
   * Mesure et analyse les performances actuelles
   */
  private monitorLoop(): void {
    const measure = () => {
      if (!this.isMonitoring) return;
      
      const now = performance.now();
      this.frames++;

      // Mettre à jour la mesure FPS selon l'intervalle configuré
      if (now - this.lastTime >= VISUALIZATION_CONFIG.performance.monitoring.adjustmentInterval) {
        this.currentFps = Math.round((this.frames * 1000) / (now - this.lastTime));
        this.frames = 0;
        this.lastTime = now;
        
        // Réduire le cooldown s'il est actif
        if (this.adaptationCooldown > 0) {
          this.adaptationCooldown--;
        } else {
          // Ajuster la qualité si nécessaire
          this.adjustQuality();
        }
        
        // Enregistrer les métriques de performance pour analyse
        this.logPerformanceMetrics();
      }

      this.animationFrameId = requestAnimationFrame(measure);
    };

    measure();
  }

  /**
   * Ajuste la qualité en fonction des performances mesurées
   */
  private adjustQuality(): void {
    const { min, target } = VISUALIZATION_CONFIG.performance.monitoring.fpsThreshold;
    
    // Réduire la qualité si le FPS est trop bas
    if (this.currentFps < min) {
      this.decreaseQuality();
      // Ajouter un cooldown pour éviter des changements trop fréquents
      this.adaptationCooldown = 3;
    } 
    // Augmenter la qualité si le FPS est bien au-dessus de la cible
    // et que nous ne sommes pas déjà au maximum
    else if (this.currentFps > target * 1.2 && this.qualityLevel !== 'high') {
      this.increaseQuality();
      // Cooldown plus long pour l'augmentation de qualité
      this.adaptationCooldown = 5;
    }
  }

  /**
   * Diminue le niveau de qualité
   */
  private decreaseQuality(): void {
    let hasChanged = false;
    
    if (this.qualityLevel === 'high') {
      this.qualityLevel = 'medium';
      hasChanged = true;
    } else if (this.qualityLevel === 'medium') {
      this.qualityLevel = 'low';
      hasChanged = true;
    }
    
    if (hasChanged) {
      console.log(`Performance: Diminution de la qualité à ${this.qualityLevel} (FPS: ${this.currentFps})`);
      this.onQualityChange(this.qualityLevel);
    }
  }

  /**
   * Augmente le niveau de qualité
   */
  private increaseQuality(): void {
    let hasChanged = false;
    
    if (this.qualityLevel === 'low') {
      this.qualityLevel = 'medium';
      hasChanged = true;
    } else if (this.qualityLevel === 'medium') {
      this.qualityLevel = 'high';
      hasChanged = true;
    }
    
    if (hasChanged) {
      console.log(`Performance: Augmentation de la qualité à ${this.qualityLevel} (FPS: ${this.currentFps})`);
      this.onQualityChange(this.qualityLevel);
    }
  }

  /**
   * Force un niveau de qualité spécifique
   */
  public setQualityLevel(quality: 'low' | 'medium' | 'high'): void {
    if (this.qualityLevel !== quality) {
      this.qualityLevel = quality;
      this.onQualityChange(quality);
      // Réinitialiser le cooldown
      this.adaptationCooldown = 5;
    }
  }

  /**
   * Récupère le FPS actuel
   */
  public getCurrentFps(): number {
    return this.currentFps;
  }

  /**
   * Récupère le niveau de qualité actuel
   */
  public getQualityLevel(): 'low' | 'medium' | 'high' {
    return this.qualityLevel;
  }

  /**
   * Enregistre les métriques de performance pour analyse
   */
  private logPerformanceMetrics(): void {
    // Enregistrer les métriques pour analyse et débogage
    // Cette fonction pourrait être étendue pour envoyer des données
    // de telemetry anonymisées avec l'accord de l'utilisateur
    const metrics = {
      timestamp: Date.now(),
      fps: this.currentFps,
      qualityLevel: this.qualityLevel
    };
    
    // Stockage local pour analyse
    const metricsHistory = JSON.parse(localStorage.getItem('performanceMetrics') || '[]');
    metricsHistory.push(metrics);
    
    // Limiter l'historique à 100 entrées
    if (metricsHistory.length > 100) {
      metricsHistory.shift();
    }
    
    localStorage.setItem('performanceMetrics', JSON.stringify(metricsHistory));
  }
}
