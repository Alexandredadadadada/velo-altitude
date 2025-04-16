/**
 * Optimiseur de routes amélioré pour Velo-Altitude
 * Intègre des statistiques détaillées et s'intègre avec le système de cache existant
 */

import { ENV } from '../config/environment';

// Types pour les statistiques de route
interface RouteStats {
  frequency: number;
  avgLoadTime: number;
  lastAccess: number;
  consecutiveAccess: number;
  navigationTimes: number[];
}

// Interface pour la configuration du cache par route
interface RouteCacheConfig {
  ttl: number;
  maxSize: number;
  priority: 'frequency' | 'recency' | 'hybrid';
}

/**
 * Optimiseur de routes amélioré avec statistiques
 */
export const enhancedRouteOptimizer = {
  // Carte des routes connectées pour le préchargement intelligent
  connectedRoutes: {
    '/': ['/cols/catalog', '/training', '/nutrition'],
    '/cols/catalog': ['/cols/seven-majors', '/cols/3d-view'],
    '/cols/seven-majors': ['/cols/catalog', '/training'],
    '/cols/3d-view': ['/cols/catalog', '/cols/seven-majors'],
    '/cols': ['/cols/catalog', '/cols/seven-majors'],
    '/training': ['/nutrition', '/profile', '/cols/catalog'],
    '/nutrition': ['/nutrition/recipes', '/training'],
    '/nutrition/recipes': ['/nutrition', '/training'],
    '/profile': ['/training', '/nutrition', '/community'],
    '/community': ['/profile', '/training']
  },
  
  // Statistiques des routes
  routeStats: new Map<string, RouteStats>(),
  
  // Configuration du cache par type de route
  cacheConfig: {
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
    },
    profile: {
      ttl: 30 * 24 * 60 * 60 * 1000, // 30 jours
      maxSize: 50,
      priority: 'recency'
    },
    community: {
      ttl: 6 * 60 * 60 * 1000, // 6 heures
      maxSize: 300,
      priority: 'hybrid'
    },
    default: {
      ttl: 24 * 60 * 60 * 1000, // 24 heures
      maxSize: 100,
      priority: 'frequency'
    }
  } as Record<string, RouteCacheConfig>,
  
  /**
   * Initialise l'optimiseur de routes
   */
  init(): void {
    // Charger les statistiques sauvegardées
    this.loadRouteStats();
    
    // Configurer l'observateur de navigation si disponible
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        const navObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          if (entries.length > 0) {
            const navEntry = entries[0] as PerformanceNavigationTiming;
            this.trackNavigation(window.location.pathname, navEntry);
          }
        });
        
        navObserver.observe({ type: 'navigation', buffered: true });
        
        console.info('Optimiseur de routes initialisé avec observateur de navigation');
      } catch (e) {
        console.warn('Impossible d\'initialiser l\'observateur de navigation:', e);
      }
    }
    
    // Nettoyer les anciennes entrées
    this.cleanupOldEntries();
  },
  
  /**
   * Précharge les routes connectées à la route actuelle
   */
  prefetchConnectedRoutes(currentRoute: string): string[] {
    // Commencer avec les routes connectées prédéfinies
    let routesToPrefetch = [...(this.connectedRoutes[currentRoute] || [])];
    
    // Ajouter les routes fréquemment visitées basées sur les statistiques
    const frequentRoutes = this.optimizeRoutes();
    
    // Combiner les routes
    routesToPrefetch = [...new Set([...routesToPrefetch, ...frequentRoutes])];
    
    // Limiter le nombre de routes à précharger
    routesToPrefetch = routesToPrefetch.slice(0, 5);
    
    // Précharger les ressources associées pour la visualisation 3D des cols
    if (currentRoute.includes('/cols/3d-view') || frequentRoutes.some(r => r.includes('/cols/3d-view'))) {
      this.prefetchCriticalResources(['three.js', 'terrain-data.json']);
    }
    
    // Précharger les ressources pour le module d'entraînement
    if (currentRoute.includes('/training') || frequentRoutes.some(r => r.includes('/training'))) {
      this.prefetchCriticalResources(['training-programs.json', 'workout-templates.json']);
    }
    
    // Ajouter les suggestions de cache pour le système de cache existant
    this.updateCacheConfig(currentRoute, routesToPrefetch);
    
    return routesToPrefetch;
  },
  
  /**
   * Précharge les ressources critiques
   */
  prefetchCriticalResources(resources: string[]): void {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = `/assets/${resource}`;
      link.as = resource.endsWith('.js') ? 'script' : 'fetch';
      document.head.appendChild(link);
    });
  },
  
  /**
   * Optimise les routes basées sur les statistiques
   */
  optimizeRoutes(): string[] {
    // Filtrer les routes avec une fréquence significative
    const frequentRoutes = Array.from(this.routeStats.entries())
      .filter(([_, stats]) => stats.frequency > 5)
      .sort((a, b) => {
        // Utiliser un score hybride basé sur la fréquence, la récence et le temps de chargement
        const scoreA = (a[1].frequency * 0.5) + 
                      (1 / (Date.now() - a[1].lastAccess) * 1000 * 0.3) + 
                      (a[1].consecutiveAccess * 0.2);
        
        const scoreB = (b[1].frequency * 0.5) + 
                      (1 / (Date.now() - b[1].lastAccess) * 1000 * 0.3) + 
                      (b[1].consecutiveAccess * 0.2);
        
        return scoreB - scoreA;
      })
      .slice(0, 10)
      .map(([route]) => route);
    
    return frequentRoutes;
  },
  
  /**
   * Enregistre une navigation
   */
  trackNavigation(path: string, navigationEntry?: PerformanceNavigationTiming): void {
    const now = Date.now();
    
    // Récupérer la route précédente du stockage de session
    const previousPath = sessionStorage.getItem('previousPath') || '/';
    
    // Mettre à jour les statistiques de la route précédente
    if (previousPath !== path) {
      // Enregistrer la transition entre les routes
      this.recordRouteTransition(previousPath, path);
      
      // Sauvegarder la route actuelle
      sessionStorage.setItem('previousPath', path);
    }
    
    // Mettre à jour les statistiques de la route actuelle
    if (!this.routeStats.has(path)) {
      this.routeStats.set(path, {
        frequency: 0,
        avgLoadTime: 0,
        lastAccess: now,
        consecutiveAccess: 1,
        navigationTimes: []
      });
    } else {
      const stats = this.routeStats.get(path)!;
      stats.frequency++;
      stats.lastAccess = now;
      
      // Incrémenter le compteur d'accès consécutifs si la dernière route était différente
      if (previousPath !== path) {
        stats.consecutiveAccess++;
      }
      
      // Ajouter le temps de navigation si disponible
      if (navigationEntry) {
        stats.navigationTimes.push(navigationEntry.duration);
        
        // Limiter le nombre de temps enregistrés
        if (stats.navigationTimes.length > 20) {
          stats.navigationTimes.shift();
        }
        
        // Calculer la moyenne des temps de navigation
        stats.avgLoadTime = stats.navigationTimes.reduce((a, b) => a + b, 0) / stats.navigationTimes.length;
      }
    }
    
    // Sauvegarder les statistiques périodiquement
    if (Math.random() < 0.1) { // 10% de chance
      this.saveRouteStats();
    }
  },
  
  /**
   * Enregistre une transition entre deux routes
   */
  recordRouteTransition(from: string, to: string): void {
    if (from === to) return;
    
    // Mettre à jour les routes connectées dynamiquement
    if (!this.connectedRoutes[from]) {
      this.connectedRoutes[from] = [];
    }
    
    // Ajouter la route de destination si elle n'est pas déjà présente
    if (!this.connectedRoutes[from].includes(to)) {
      this.connectedRoutes[from].push(to);
      
      // Limiter le nombre de routes connectées
      if (this.connectedRoutes[from].length > 5) {
        this.connectedRoutes[from].shift();
      }
    } else {
      // Réorganiser pour que les destinations récentes soient à la fin
      const index = this.connectedRoutes[from].indexOf(to);
      this.connectedRoutes[from].splice(index, 1);
      this.connectedRoutes[from].push(to);
    }
  },
  
  /**
   * Met à jour la configuration de cache pour les routes
   */
  updateCacheConfig(currentRoute: string, connectedRoutes: string[]): void {
    // Déterminer le type de route
    const getRouteType = (route: string) => {
      if (route.includes('/cols')) return 'cols';
      if (route.includes('/training')) return 'training';
      if (route.includes('/nutrition')) return 'nutrition';
      if (route.includes('/profile')) return 'profile';
      if (route.includes('/community')) return 'community';
      return 'default';
    };
    
    const currentType = getRouteType(currentRoute);
    
    // Mettre à jour le TTL pour les données fréquemment utilisées
    if (this.routeStats.has(currentRoute)) {
      const stats = this.routeStats.get(currentRoute)!;
      
      // Ajuster le TTL en fonction de la fréquence
      if (stats.frequency > 20) {
        // Pour les routes très fréquentes, augmenter le TTL
        this.cacheConfig[currentType].ttl *= 1.5;
      }
      
      // Ajuster la priorité en fonction du modèle d'utilisation
      if (stats.consecutiveAccess > 5) {
        // Si la route est souvent visitée consécutivement, privilégier la récence
        this.cacheConfig[currentType].priority = 'recency';
      }
    }
    
    // Intégration avec le service de cache existant de Velo-Altitude
    // (Ceci utilise l'API supposée du service de cache existant)
    if (typeof window !== 'undefined' && 'VeloAltitudeCache' in window) {
      const cache = (window as any).VeloAltitudeCache;
      
      // Mettre à jour la configuration du cache pour les routes connectées
      connectedRoutes.forEach(route => {
        const routeType = getRouteType(route);
        const config = this.cacheConfig[routeType];
        
        // Utiliser l'API du cache existant
        cache.configureSegment(routeType, {
          ttl: config.ttl,
          maxSize: config.maxSize,
          priority: config.priority
        });
        
        // Précharger les données pour ces routes si disponibles
        cache.prefetch(route);
      });
    }
  },
  
  /**
   * Sauvegarde les statistiques de route dans le stockage local
   */
  saveRouteStats(): void {
    try {
      // Convertir la Map en objet pour la sérialisation
      const serialized = {};
      
      this.routeStats.forEach((stats, route) => {
        serialized[route] = stats;
      });
      
      localStorage.setItem('velo_altitude_route_stats', JSON.stringify(serialized));
    } catch (e) {
      console.warn('Impossible de sauvegarder les statistiques de route:', e);
    }
  },
  
  /**
   * Charge les statistiques de route depuis le stockage local
   */
  loadRouteStats(): void {
    try {
      const saved = localStorage.getItem('velo_altitude_route_stats');
      
      if (saved) {
        const parsed = JSON.parse(saved);
        
        // Convertir l'objet en Map
        this.routeStats = new Map();
        
        Object.entries(parsed).forEach(([route, stats]) => {
          this.routeStats.set(route, stats as RouteStats);
        });
        
        console.info(`Statistiques de route chargées pour ${this.routeStats.size} routes`);
      }
    } catch (e) {
      console.warn('Impossible de charger les statistiques de route:', e);
    }
  },
  
  /**
   * Nettoie les entrées anciennes
   */
  cleanupOldEntries(): void {
    const now = Date.now();
    const oneMonth = 30 * 24 * 60 * 60 * 1000; // 30 jours
    
    // Supprimer les routes qui n'ont pas été accédées depuis plus d'un mois
    this.routeStats.forEach((stats, route) => {
      if (now - stats.lastAccess > oneMonth) {
        this.routeStats.delete(route);
      }
    });
  },
  
  /**
   * Obtient les recommandations d'optimisation basées sur les statistiques
   */
  getOptimizationRecommendations(): string[] {
    const recommendations = [];
    
    // Identifier les routes lentes
    const slowRoutes = Array.from(this.routeStats.entries())
      .filter(([_, stats]) => {
        return stats.frequency > 5 && stats.avgLoadTime > 2000;
      })
      .sort((a, b) => b[1].avgLoadTime - a[1].avgLoadTime)
      .slice(0, 3);
    
    if (slowRoutes.length > 0) {
      const routesList = slowRoutes.map(([route, stats]) => 
        `${route} (${Math.round(stats.avgLoadTime)}ms)`
      ).join(', ');
      
      recommendations.push(`Optimiser les routes lentes: ${routesList}`);
    }
    
    // Identifier les routes à précharger
    const frequentRoutes = Array.from(this.routeStats.entries())
      .filter(([_, stats]) => stats.frequency > 10)
      .sort((a, b) => b[1].frequency - a[1].frequency)
      .slice(0, 5)
      .map(([route]) => route);
    
    if (frequentRoutes.length > 0) {
      recommendations.push(`Précharger les routes fréquentes: ${frequentRoutes.join(', ')}`);
    }
    
    // Identifier les transitions fréquentes
    const transitionRecommendations = [];
    
    Object.entries(this.connectedRoutes).forEach(([from, destinations]) => {
      if (destinations.length > 0) {
        const fromStats = this.routeStats.get(from);
        
        if (fromStats && fromStats.frequency > 10) {
          transitionRecommendations.push({
            from,
            to: destinations[destinations.length - 1],
            frequency: fromStats.frequency
          });
        }
      }
    });
    
    if (transitionRecommendations.length > 0) {
      const sortedTransitions = transitionRecommendations
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 3);
      
      const transitionsList = sortedTransitions.map(t => 
        `${t.from} → ${t.to}`
      ).join(', ');
      
      recommendations.push(`Optimiser les transitions fréquentes: ${transitionsList}`);
    }
    
    return recommendations;
  },
  
  /**
   * Intégration avec le système de cache de Velo-Altitude
   */
  updateCacheStrategy(): void {
    // Mise à jour basée sur les données d'utilisation
    const intelligentCacheConfig = {
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
      }
    };
    
    // Ajuster les configurations en fonction des statistiques récentes
    if (this.routeStats.size > 0) {
      // Calcul des fréquences par type
      const typeFrequency = {
        cols: 0,
        training: 0,
        nutrition: 0,
        profile: 0,
        community: 0
      };
      
      this.routeStats.forEach((stats, route) => {
        if (route.includes('/cols')) typeFrequency.cols += stats.frequency;
        if (route.includes('/training')) typeFrequency.training += stats.frequency;
        if (route.includes('/nutrition')) typeFrequency.nutrition += stats.frequency;
        if (route.includes('/profile')) typeFrequency.profile += stats.frequency;
        if (route.includes('/community')) typeFrequency.community += stats.frequency;
      });
      
      // Ajuster les priorités en fonction de l'utilisation
      const types = Object.keys(typeFrequency);
      const sortedTypes = types.sort((a, b) => typeFrequency[b] - typeFrequency[a]);
      
      // Augmenter la taille du cache pour les types les plus utilisés
      if (sortedTypes.length > 0) {
        const mostUsed = sortedTypes[0];
        this.cacheConfig[mostUsed].maxSize *= 1.5;
      }
    }
    
    // Partager cette configuration avec le service de cache existant
    if (typeof window !== 'undefined' && 'VeloAltitudeCache' in window) {
      const cache = (window as any).VeloAltitudeCache;
      
      // Appliquer les configurations par segment
      Object.entries(this.cacheConfig).forEach(([segment, config]) => {
        cache.configureSegment(segment, config);
      });
    }
  }
};

// Budgets de performance pour les routes
export const performanceBudgets = {
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
  // Budgets spécifiques pour les fonctionnalités clés de Velo-Altitude
  veloSpecific: {
    colVisualization: {
      renderTime: 200,   // ms
      memoryThreshold: 500 * 1024 * 1024,  // 500 MB
      frameRate: 30      // fps
    },
    routeCalculation: {
      computeTime: 500,  // ms pour calculer un itinéraire
      maxDistance: 10000 // m (10 km) pour un calcul instantané
    }
  }
};

export default enhancedRouteOptimizer;
