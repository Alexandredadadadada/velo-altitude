/**
 * Configuration for performance optimizations across Velo-Altitude
 * Defines thresholds, quality settings, and cache policies
 */

export const performanceConfig = {
  // Prefetching configuration
  prefetchThreshold: 0.8,  // Trigger prefetch at 80% of viewport
  
  // Image quality tiers for different devices
  imageQualityTiers: {
    mobile: { width: 640, quality: 80 },
    tablet: { width: 1024, quality: 85 },
    desktop: { width: 1920, quality: 90 }
  },
  
  // Cache duration configuration
  cacheConfig: {
    maxAge: 3600,  // 1 hour
    staleWhileRevalidate: 7200,  // 2 hours
    segments: {
      cols: {
        ttl: 24 * 60 * 60 * 1000, // 24 heures
        maxSize: 1000,
        priority: 'frequency'
      },
      routes: {
        ttl: 12 * 60 * 60 * 1000, // 12 heures
        maxSize: 500,
        priority: 'recency'
      },
      training: {
        ttl: 7 * 24 * 60 * 60 * 1000, // 7 jours
        maxSize: 100,
        priority: 'hybrid'
      },
      nutrition: {
        ttl: 3 * 24 * 60 * 60 * 1000, // 3 jours
        maxSize: 200,
        priority: 'frequency'
      }
    }
  },
  
  // List of routes to preload on application start
  criticalRoutes: [
    'home',
    'colCatalog',
    'training'
  ],
  
  // Bundle size limits (in KB)
  bundleSizeLimits: {
    initial: 200,
    async: 100
  },
  
  // Time-to-Interactive targets (in ms)
  timeToInteractiveTargets: {
    mobile: 3500,
    desktop: 2000
  },
  
  // Performance budgets for components and interactions
  performanceBudgets: {
    interaction: {
      target: 100,    // ms
      warning: 150,   // ms
      critical: 200   // ms
    },
    loading: {
      target: 1000,   // ms
      warning: 2000,  // ms
      critical: 3000  // ms
    },
    memory: {
      target: 0.6,    // 60% de la limite
      warning: 0.8,   // 80% de la limite
      critical: 0.9   // 90% de la limite
    },
    webVitals: {
      lcp: {
        good: 2500,   // ms
        needsImprovement: 4000,  // ms
      },
      fid: {
        good: 100,    // ms
        needsImprovement: 300,   // ms
      },
      cls: {
        good: 0.1,
        needsImprovement: 0.25,
      },
      ttfb: {
        good: 800,    // ms
        needsImprovement: 1800,  // ms
      }
    }
  },
  
  // Velo-specific performance metrics and thresholds
  veloSpecificMetrics: {
    colVisualization: {
      renderTime: {
        target: 200,   // ms
        warning: 500,  // ms
        critical: 1000 // ms
      },
      memoryThreshold: 500 * 1024 * 1024,  // 500 MB
      frameRate: {
        target: 60,    // fps
        minimum: 30    // fps
      }
    },
    routeCalculation: {
      computeTime: {
        target: 500,  // ms pour calculer un itinéraire
        warning: 1000, // ms
        critical: 2000 // ms
      },
      maxDistance: 10000 // m (10 km) pour un calcul instantané
    },
    synchronization: {
      syncInterval: 5 * 60 * 1000, // 5 minutes
      maxSyncDuration: 30 * 1000,  // 30 secondes
      conflictResolutionStrategy: 'LAST_WRITE_WINS'
    }
  },
  
  // Reporting configuration
  reporting: {
    endpoint: '/api/monitoring',
    sampleRate: {
      production: 0.1, // 10% des sessions
      staging: 0.5,    // 50% des sessions
      development: 1.0 // 100% des sessions
    },
    batchSize: 10,     // Nombre d'événements par lot
    maxQueueSize: 100, // Nombre maximum d'événements en file d'attente
    flushInterval: 30 * 1000 // Intervalle d'envoi (30 secondes)
  },
  
  // Rollback configuration
  rollback: {
    enabled: true,
    phaseStates: {
      monitoring: true,
      routing: true,
      ui: true,
      business: true
    },
    autoRollbackThreshold: {
      errorRate: 0.05, // 5% d'erreurs
      performanceDegradation: 0.3 // 30% de dégradation des performances
    }
  }
};

/**
 * Helper to determine device tier based on viewport width
 */
export const getDeviceTier = (width: number = window.innerWidth): 'mobile' | 'tablet' | 'desktop' => {
  if (width < 768) return 'mobile';
  if (width < 1280) return 'tablet';
  return 'desktop';
};

/**
 * Get optimal image quality settings for current device
 */
export const getImageQualitySettings = () => {
  const deviceTier = getDeviceTier();
  return performanceConfig.imageQualityTiers[deviceTier];
};

/**
 * Check if device is on slow connection
 */
export const isLowBandwidth = (): boolean => {
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    // @ts-ignore - Navigator connection API not in all type definitions
    const connection = navigator.connection;
    if (connection) {
      // @ts-ignore
      if (connection.saveData) return true;
      // @ts-ignore
      if (connection.effectiveType && ['slow-2g', '2g', '3g'].includes(connection.effectiveType)) return true;
    }
  }
  return false;
};

/**
 * Génère un ID unique pour une session de monitoring
 */
export const generateMonitoringSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Détermine si le rollback d'une phase est nécessaire
 */
export const shouldRollbackPhase = (
  phase: keyof typeof performanceConfig.rollback.phaseStates, 
  metrics: { 
    errorRate?: number; 
    performanceDegradation?: number;
  }
): boolean => {
  if (!performanceConfig.rollback.enabled || 
      !performanceConfig.rollback.phaseStates[phase]) {
    return false;
  }
  
  const thresholds = performanceConfig.rollback.autoRollbackThreshold;
  
  if (metrics.errorRate !== undefined && 
      metrics.errorRate > thresholds.errorRate) {
    return true;
  }
  
  if (metrics.performanceDegradation !== undefined && 
      metrics.performanceDegradation > thresholds.performanceDegradation) {
    return true;
  }
  
  return false;
};

export default performanceConfig;
