/**
 * Système de métriques dédié pour le service de cache
 * 
 * Fonctionnalités:
 * - Suivi des performances (hit ratio, latence)
 * - Alertes en cas de dégradation
 * - Segmentation par type de données
 * - Intégration avec le service de monitoring
 */

import { monitoringService } from '../monitoring';

// Seuils d'alerte
const ALERT_THRESHOLDS = {
  hitRatio: 0.60,       // Alerte si le hit ratio tombe en dessous de 60%
  latency: 50,          // Alerte si la latence moyenne dépasse 50ms
  evictionRate: 0.05,   // Alerte si le taux d'éviction dépasse 5% par minute
  errorRate: 0.02       // Alerte si le taux d'erreur dépasse 2%
};

export class CacheMetrics {
  // Métriques générales
  private hits: number = 0;
  private misses: number = 0;
  private latencies: number[] = [];
  private evictions: number = 0;
  private errors: number = 0;
  private operations: number = 0;
  
  // Métriques par segment
  private segmentHits: Map<string, number> = new Map();
  private segmentMisses: Map<string, number> = new Map();
  private segmentSizes: Map<string, number> = new Map();
  
  // Métriques temporelles (par minute)
  private minuteHits: number = 0;
  private minuteMisses: number = 0;
  private minuteEvictions: number = 0;
  private minuteErrors: number = 0;
  private minuteOperations: number = 0;
  private lastResetTime: number = Date.now();
  
  // Surveillance active
  private degradationState: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    // Démarrer la surveillance des métriques par minute
    this.monitoringInterval = setInterval(() => {
      this.resetMinuteMetrics();
      this.checkPerformance();
    }, 60000); // Vérifier toutes les minutes
  }
  
  /**
   * Enregistre un hit de cache
   * @param key Clé accédée
   * @param segment Segment (optionnel)
   * @param latency Latence de l'opération
   */
  recordHit(key: string, latency: number, segment?: string): void {
    this.hits++;
    this.minuteHits++;
    this.operations++;
    this.minuteOperations++;
    this.latencies.push(latency);
    
    // Limiter le tableau des latences
    if (this.latencies.length > 1000) {
      this.latencies = this.latencies.slice(-1000);
    }
    
    // Enregistrer par segment
    if (segment) {
      const segmentHits = this.segmentHits.get(segment) || 0;
      this.segmentHits.set(segment, segmentHits + 1);
    }
  }
  
  /**
   * Enregistre un miss de cache
   * @param key Clé accédée
   * @param segment Segment (optionnel)
   */
  recordMiss(key: string, segment?: string): void {
    this.misses++;
    this.minuteMisses++;
    this.operations++;
    this.minuteOperations++;
    
    // Enregistrer par segment
    if (segment) {
      const segmentMisses = this.segmentMisses.get(segment) || 0;
      this.segmentMisses.set(segment, segmentMisses + 1);
    }
  }
  
  /**
   * Enregistre une éviction de cache
   * @param key Clé évincée
   * @param segment Segment (optionnel)
   */
  recordEviction(key: string, segment?: string): void {
    this.evictions++;
    this.minuteEvictions++;
    
    // Enregistrer par segment
    if (segment) {
      const segmentSize = this.segmentSizes.get(segment) || 0;
      if (segmentSize > 0) {
        this.segmentSizes.set(segment, segmentSize - 1);
      }
    }
  }
  
  /**
   * Enregistre une erreur de cache
   * @param operation Opération qui a échoué
   * @param error Erreur survenue
   */
  recordError(operation: string, error: Error): void {
    this.errors++;
    this.minuteErrors++;
    
    // Enregistrer l'erreur dans le monitoring
    monitoringService.trackError('cache_error', error, { operation });
  }
  
  /**
   * Enregistre un ajout au cache
   * @param segment Segment (optionnel)
   */
  recordSet(segment?: string): void {
    this.operations++;
    this.minuteOperations++;
    
    // Enregistrer par segment
    if (segment) {
      const segmentSize = this.segmentSizes.get(segment) || 0;
      this.segmentSizes.set(segment, segmentSize + 1);
    }
  }
  
  /**
   * Récupère le ratio de hits
   * @returns Hit ratio entre 0 et 1
   */
  getHitRatio(): number {
    const total = this.hits + this.misses;
    return total === 0 ? 1 : this.hits / total;
  }
  
  /**
   * Récupère le ratio de hits pour la dernière minute
   * @returns Hit ratio de la dernière minute
   */
  getMinuteHitRatio(): number {
    const total = this.minuteHits + this.minuteMisses;
    return total === 0 ? 1 : this.minuteHits / total;
  }
  
  /**
   * Récupère la latence moyenne
   * @returns Latence moyenne en ms
   */
  getAverageLatency(): number {
    if (this.latencies.length === 0) {
      return 0;
    }
    
    const sum = this.latencies.reduce((a, b) => a + b, 0);
    return sum / this.latencies.length;
  }
  
  /**
   * Récupère le taux d'erreur
   * @returns Taux d'erreur entre 0 et 1
   */
  getErrorRate(): number {
    return this.operations === 0 ? 0 : this.errors / this.operations;
  }
  
  /**
   * Récupère le taux d'éviction par minute
   * @returns Taux d'éviction
   */
  getMinuteEvictionRate(): number {
    return this.minuteOperations === 0 ? 0 : this.minuteEvictions / this.minuteOperations;
  }
  
  /**
   * Récupère toutes les métriques
   * @returns Objet contenant toutes les métriques
   */
  getMetrics() {
    const segmentStats: Record<string, { hits: number; misses: number; hitRatio: number; size: number }> = {};
    
    // Construire les statistiques par segment
    for (const segment of new Set([
      ...this.segmentHits.keys(),
      ...this.segmentMisses.keys(),
      ...this.segmentSizes.keys()
    ])) {
      const hits = this.segmentHits.get(segment) || 0;
      const misses = this.segmentMisses.get(segment) || 0;
      const total = hits + misses;
      const hitRatio = total === 0 ? 0 : hits / total;
      const size = this.segmentSizes.get(segment) || 0;
      
      segmentStats[segment] = { hits, misses, hitRatio, size };
    }
    
    return {
      // Métriques générales
      hits: this.hits,
      misses: this.misses,
      hitRatio: this.getHitRatio(),
      averageLatency: this.getAverageLatency(),
      evictions: this.evictions,
      errors: this.errors,
      errorRate: this.getErrorRate(),
      
      // Métriques par minute
      minuteHitRatio: this.getMinuteHitRatio(),
      minuteEvictionRate: this.getMinuteEvictionRate(),
      
      // Métriques par segment
      segmentStats,
      
      // État de dégradation
      degraded: this.degradationState
    };
  }
  
  /**
   * Réinitialise les métriques par minute
   * @private
   */
  private resetMinuteMetrics(): void {
    this.minuteHits = 0;
    this.minuteMisses = 0;
    this.minuteEvictions = 0;
    this.minuteErrors = 0;
    this.minuteOperations = 0;
    this.lastResetTime = Date.now();
  }
  
  /**
   * Vérifie les performances du cache et envoie des alertes si nécessaire
   * @private
   */
  private checkPerformance(): void {
    const metrics = this.getMetrics();
    
    // Envoyer les métriques au service de monitoring
    monitoringService.trackMetrics('cache_performance', {
      hit_ratio: metrics.hitRatio,
      minute_hit_ratio: metrics.minuteHitRatio,
      average_latency: metrics.averageLatency,
      eviction_rate: this.getMinuteEvictionRate(),
      error_rate: metrics.errorRate
    });
    
    // Vérifier si le cache est en état de dégradation
    const isDegraded = 
      metrics.minuteHitRatio < ALERT_THRESHOLDS.hitRatio ||
      metrics.averageLatency > ALERT_THRESHOLDS.latency ||
      this.getMinuteEvictionRate() > ALERT_THRESHOLDS.evictionRate ||
      metrics.errorRate > ALERT_THRESHOLDS.errorRate;
    
    // Si l'état a changé, envoyer une alerte
    if (isDegraded !== this.degradationState) {
      this.degradationState = isDegraded;
      
      if (isDegraded) {
        // Envoyer une alerte de dégradation
        monitoringService.trackEvent('cache_degradation', {
          hitRatio: metrics.minuteHitRatio,
          averageLatency: metrics.averageLatency,
          evictionRate: this.getMinuteEvictionRate(),
          errorRate: metrics.errorRate,
          timestamp: new Date().toISOString()
        });
        
        console.warn('[CacheMetrics] Cache performance degradation detected');
      } else {
        // Envoyer une notification de récupération
        monitoringService.trackEvent('cache_recovery', {
          hitRatio: metrics.minuteHitRatio,
          averageLatency: metrics.averageLatency,
          timestamp: new Date().toISOString()
        });
        
        console.info('[CacheMetrics] Cache performance recovered');
      }
    }
  }
  
  /**
   * Libère les ressources
   */
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}
