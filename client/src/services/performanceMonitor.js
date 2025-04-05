/**
 * Service de monitoring des performances
 * 
 * Ce service permet de mesurer et d'enregistrer les performances
 * de l'application, en particulier pour les fonctionnalités gourmandes
 * en ressources comme le Fly-through.
 */

class PerformanceMonitor {
  constructor() {
    this.isMonitoring = false;
    this.startTime = null;
    this.metrics = {
      fps: [],
      memoryUsage: [],
      cpuUsage: [],
      renderTimes: []
    };
    this.sampleInterval = 1000; // 1 seconde entre chaque échantillon
    this.intervalId = null;
  }

  /**
   * Démarre le monitoring des performances
   * @param {Object} options - Options de configuration
   */
  start(options = {}) {
    if (this.isMonitoring) {
      console.warn('Le monitoring est déjà en cours');
      return;
    }

    this.metrics = {
      fps: [],
      memoryUsage: [],
      cpuUsage: [],
      renderTimes: []
    };
    
    this.startTime = performance.now();
    this.isMonitoring = true;
    
    // Configuration
    this.sampleInterval = options.sampleInterval || 1000;
    
    // En environnement navigateur, on utilise requestAnimationFrame pour mesurer le FPS
    if (typeof window !== 'undefined') {
      let frameCount = 0;
      let lastSampleTime = performance.now();
      
      const countFrame = () => {
        frameCount++;
        
        const now = performance.now();
        const elapsed = now - lastSampleTime;
        
        if (elapsed >= this.sampleInterval) {
          const fps = Math.round((frameCount * 1000) / elapsed);
          this.metrics.fps.push(fps);
          
          // Mesurer l'utilisation mémoire si disponible
          if (window.performance && window.performance.memory) {
            this.metrics.memoryUsage.push(window.performance.memory.usedJSHeapSize / (1024 * 1024));
          }
          
          // Réinitialiser pour le prochain intervalle
          frameCount = 0;
          lastSampleTime = now;
        }
        
        if (this.isMonitoring) {
          requestAnimationFrame(countFrame);
        }
      };
      
      requestAnimationFrame(countFrame);
    } 
    // En environnement Node.js (pour les tests)
    else {
      this.intervalId = setInterval(() => {
        // Simuler des métriques pour les tests
        this.metrics.fps.push(Math.floor(55 + Math.random() * 10));
        this.metrics.memoryUsage.push(Math.floor(200 + Math.random() * 50));
        this.metrics.cpuUsage.push(Math.floor(20 + Math.random() * 15));
      }, this.sampleInterval);
    }
    
    console.log('Monitoring des performances démarré');
  }

  /**
   * Arrête le monitoring des performances
   * @returns {Object} Résumé des métriques collectées
   */
  stop() {
    if (!this.isMonitoring) {
      console.warn('Le monitoring n\'est pas actif');
      return null;
    }
    
    this.isMonitoring = false;
    const duration = performance.now() - this.startTime;
    
    // Nettoyer l'intervalle si en mode Node.js
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    // Calculer les moyennes
    const summary = {
      duration: duration,
      averageFps: this.calculateAverage(this.metrics.fps),
      averageMemoryUsage: this.calculateAverage(this.metrics.memoryUsage),
      averageCpuUsage: this.calculateAverage(this.metrics.cpuUsage),
      averageRenderTime: this.calculateAverage(this.metrics.renderTimes),
      sampleCount: this.metrics.fps.length
    };
    
    console.log('Monitoring des performances arrêté', summary);
    return summary;
  }

  /**
   * Enregistre une mesure de temps de rendu
   * @param {number} time - Temps de rendu en millisecondes
   */
  recordRenderTime(time) {
    if (this.isMonitoring) {
      this.metrics.renderTimes.push(time);
    }
  }

  /**
   * Calcule la moyenne d'un tableau de nombres
   * @param {Array<number>} arr - Tableau de nombres
   * @returns {number} - Moyenne
   */
  calculateAverage(arr) {
    if (!arr || arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  /**
   * Obtient un instantané des métriques actuelles
   * @returns {Object} Métriques actuelles
   */
  getSnapshot() {
    return {
      isMonitoring: this.isMonitoring,
      duration: this.isMonitoring ? performance.now() - this.startTime : 0,
      metrics: { ...this.metrics },
      summary: {
        averageFps: this.calculateAverage(this.metrics.fps),
        averageMemoryUsage: this.calculateAverage(this.metrics.memoryUsage),
        averageCpuUsage: this.calculateAverage(this.metrics.cpuUsage),
        averageRenderTime: this.calculateAverage(this.metrics.renderTimes)
      }
    };
  }
}

// Singleton
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;
