/**
 * Utilitaire de surveillance des performances pour Velo-Altitude
 * Suit les métriques clés et compare aux objectifs définis
 */

import performanceConfig, { getDeviceTier } from '../config/performance';

interface PerformanceMetrics {
  timeToInteractive: number;
  firstContentfulPaint: number;
  totalBundleSize: number;
  largestContentfulPaint: number;
  cacheHitRate: number;
  resourceLoadTimes: Record<string, number>;
}

/**
 * Initialise et configure la surveillance des performances
 */
export const initPerformanceMonitoring = () => {
  // Surveiller les métriques Web Vitals
  if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
    try {
      // Observer pour First Contentful Paint
      const fcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            console.info('FCP:', entry.startTime);
            if (entry.startTime > 2000) {
              console.warn('FCP exceeds recommended threshold');
            }
          }
        });
      });
      fcpObserver.observe({ type: 'paint', buffered: true });

      // Observer pour Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.info('LCP:', lastEntry.startTime);
        if (lastEntry.startTime > 2500) {
          console.warn('LCP exceeds recommended threshold');
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // Observer pour les tâches longues
      const longTaskObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          console.warn(`${entries.length} long tasks detected`, 
            entries.map(e => ({ 
              duration: e.duration, 
              startTime: e.startTime 
            }))
          );
        }
      });
      longTaskObserver.observe({ type: 'longtask', buffered: true });

      // Observer pour les ressources
      const resourceObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const jsEntries = entries.filter(entry => 
          entry.name.includes('.js') && !entry.name.includes('vendor')
        );

        const totalJsSize = jsEntries.reduce((total, entry) => {
          // @ts-ignore - encodedBodySize existe mais peut être absent des définitions
          return total + (entry.encodedBodySize || 0);
        }, 0);

        if (totalJsSize / 1024 > performanceConfig.bundleSizeLimits.initial) {
          console.warn(`JS bundle size (${Math.round(totalJsSize / 1024)}KB) exceeds limit (${performanceConfig.bundleSizeLimits.initial}KB)`);
        }
      });
      resourceObserver.observe({ type: 'resource', buffered: true });

    } catch (e) {
      console.error('Error setting up performance observers:', e);
    }
  }
};

/**
 * Surveille les performances après le chargement initial
 */
export const monitorPerformance = () => {
  // Mesurer le temps d'interaction
  const tti = performance.now();
  const deviceTier = getDeviceTier();
  
  if (tti > performanceConfig.timeToInteractiveTargets[deviceTier]) {
    console.warn(`TTI (${Math.round(tti)}ms) exceeds target (${performanceConfig.timeToInteractiveTargets[deviceTier]}ms) for ${deviceTier} devices`);
  }

  // Analyser les ressources chargées
  if (typeof window !== 'undefined' && 'performance' in window) {
    const resources = performance.getEntriesByType('resource');
    
    // Taille des bundles JS
    const jsResources = resources.filter(r => r.name.includes('.js'));
    const bundleSize = jsResources.reduce((total, r) => {
      // @ts-ignore - encodedBodySize existe mais peut être absent des définitions
      return total + (r.encodedBodySize || 0);
    }, 0);

    if (bundleSize / 1024 > performanceConfig.bundleSizeLimits.initial) {
      console.warn(`Total JS bundle size (${Math.round(bundleSize / 1024)}KB) exceeds limit (${performanceConfig.bundleSizeLimits.initial}KB)`);
    }

    // Temps de chargement des ressources critiques
    const criticalResources = resources.filter(r => 
      r.name.includes('main') || 
      r.name.includes('critical') || 
      r.name.includes('vendor')
    );

    criticalResources.forEach(resource => {
      if (resource.duration > 1000) {
        console.warn(`Slow resource load: ${resource.name} took ${Math.round(resource.duration)}ms`);
      }
    });
  }
};

/**
 * Vérifie l'efficacité du cache
 */
export const monitorCacheEfficiency = (cacheKey: string, hitOrMiss: 'hit' | 'miss') => {
  // Récupérer ou initialiser les statistiques de cache
  const cacheStats = localStorage.getItem('velo_altitude_cache_stats');
  let stats: Record<string, { hits: number, misses: number }> = {};
  
  if (cacheStats) {
    try {
      stats = JSON.parse(cacheStats);
    } catch (e) {
      console.error('Error parsing cache stats:', e);
    }
  }

  // Initialiser les statistiques pour cette clé de cache si nécessaire
  if (!stats[cacheKey]) {
    stats[cacheKey] = { hits: 0, misses: 0 };
  }

  // Mettre à jour les statistiques
  if (hitOrMiss === 'hit') {
    stats[cacheKey].hits++;
  } else {
    stats[cacheKey].misses++;
  }

  // Calculer le taux de succès du cache
  const total = stats[cacheKey].hits + stats[cacheKey].misses;
  const hitRate = stats[cacheKey].hits / total;

  // Alerter si le taux de succès est faible
  if (total > 10 && hitRate < 0.5) {
    console.warn(`Low cache hit rate for ${cacheKey}: ${Math.round(hitRate * 100)}%`);
  }

  // Sauvegarder les statistiques mises à jour
  localStorage.setItem('velo_altitude_cache_stats', JSON.stringify(stats));

  return { hitRate, total };
};

/**
 * Recueille et rapporte les métriques de performance
 */
export const collectPerformanceMetrics = (): PerformanceMetrics => {
  let metrics: PerformanceMetrics = {
    timeToInteractive: performance.now(),
    firstContentfulPaint: 0,
    totalBundleSize: 0,
    largestContentfulPaint: 0,
    cacheHitRate: 0,
    resourceLoadTimes: {}
  };

  // Tenter d'obtenir des métriques plus précises si disponibles
  if (typeof window !== 'undefined' && 'performance' in window) {
    const paintEntries = performance.getEntriesByType('paint');
    const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    
    if (fcpEntry) {
      metrics.firstContentfulPaint = fcpEntry.startTime;
    }

    // Calculer la taille totale des bundles JS
    const resources = performance.getEntriesByType('resource');
    const jsResources = resources.filter(r => r.name.includes('.js'));
    
    metrics.totalBundleSize = jsResources.reduce((total, r) => {
      // @ts-ignore - encodedBodySize existe mais peut être absent des définitions
      return total + (r.encodedBodySize || 0);
    }, 0);

    // Collecter les temps de chargement des ressources
    resources.forEach(resource => {
      const name = resource.name.split('/').pop() || resource.name;
      metrics.resourceLoadTimes[name] = resource.duration;
    });
  }

  // Calculer le taux moyen de succès du cache
  const cacheStats = localStorage.getItem('velo_altitude_cache_stats');
  if (cacheStats) {
    try {
      const stats = JSON.parse(cacheStats);
      let totalHits = 0;
      let totalRequests = 0;

      Object.values(stats).forEach((stat: any) => {
        totalHits += stat.hits;
        totalRequests += stat.hits + stat.misses;
      });

      if (totalRequests > 0) {
        metrics.cacheHitRate = totalHits / totalRequests;
      }
    } catch (e) {
      console.error('Error calculating cache hit rate:', e);
    }
  }

  return metrics;
};

export default {
  initPerformanceMonitoring,
  monitorPerformance,
  monitorCacheEfficiency,
  collectPerformanceMetrics
};
