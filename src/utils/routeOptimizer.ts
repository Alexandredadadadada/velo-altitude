/**
 * Optimiseur de routes pour Velo-Altitude
 * Fournit des mécanismes avancés de préchargement basés sur les habitudes de navigation
 */

// Types pour le préchargement des routes
interface RouteNavigationPattern {
  count: number;
  lastAccessed: number;
}

/**
 * Optimiseur de routes avec préchargement intelligent
 */
export const routeOptimizer = {
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
  
  // Motifs de navigation basés sur l'historique utilisateur
  navigationPatterns: new Map<string, Map<string, RouteNavigationPattern>>(),
  
  // Précharge les routes connectées à la route actuelle
  prefetchConnectedRoutes(currentRoute: string): string[] {
    const routesToPrefetch = this.connectedRoutes[currentRoute] || [];
    
    // Rechercher également les motifs de navigation personnalisés
    const userPatterns = this.navigationPatterns.get(currentRoute);
    if (userPatterns && userPatterns.size > 0) {
      // Trouver les destinations les plus fréquentes
      const commonDestinations = Array.from(userPatterns.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 3)
        .map(entry => entry[0]);
      
      // Combiner avec les routes connectées prédéfinies
      return [...new Set([...routesToPrefetch, ...commonDestinations])];
    }
    
    return routesToPrefetch;
  },
  
  // Enregistre un changement de navigation
  recordNavigation(from: string, to: string): void {
    if (from === to) return; // Ignorer les rafraîchissements
    
    if (!this.navigationPatterns.has(from)) {
      this.navigationPatterns.set(from, new Map());
    }
    
    const destinations = this.navigationPatterns.get(from)!;
    const currentPattern = destinations.get(to) || { count: 0, lastAccessed: 0 };
    
    destinations.set(to, {
      count: currentPattern.count + 1,
      lastAccessed: Date.now()
    });
    
    // Sauvegarder les motifs dans localStorage pour persistance
    this.saveNavigationPatterns();
    
    // Mettre à jour les stratégies de préchargement en fonction des nouveaux modèles
    this.updatePrefetchStrategy(from);
  },
  
  // Met à jour la stratégie de préchargement
  updatePrefetchStrategy(route: string): void {
    const patterns = this.navigationPatterns.get(route);
    if (patterns && patterns.size > 5) {
      const commonDestinations = this.analyzePatterns(patterns);
      
      // Mettre à jour la carte des routes connectées avec les destinations fréquentes
      this.connectedRoutes[route] = [
        ...(this.connectedRoutes[route] || []).slice(0, 2),
        ...commonDestinations.slice(0, 3)
      ];
    }
  },
  
  // Analyse les motifs de navigation pour identifier les destinations fréquentes
  analyzePatterns(patterns: Map<string, RouteNavigationPattern>): string[] {
    // Calculer un score basé sur la fréquence et la récence
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    
    return Array.from(patterns.entries())
      .map(([route, pattern]) => {
        // Facteur de décroissance pour les anciennes navigations
        const recencyFactor = Math.max(0.5, 1 - ((now - pattern.lastAccessed) / oneWeek));
        const score = pattern.count * recencyFactor;
        
        return { route, score };
      })
      .sort((a, b) => b.score - a.score)
      .map(item => item.route);
  },
  
  // Sauvegarde les motifs de navigation dans le stockage local
  saveNavigationPatterns(): void {
    try {
      // Convertir la Map en structure sérialisable
      const serializedPatterns: Record<string, Record<string, RouteNavigationPattern>> = {};
      
      this.navigationPatterns.forEach((destinations, source) => {
        serializedPatterns[source] = {};
        
        destinations.forEach((pattern, destination) => {
          serializedPatterns[source][destination] = pattern;
        });
      });
      
      localStorage.setItem('velo_altitude_navigation_patterns', 
        JSON.stringify(serializedPatterns)
      );
    } catch (e) {
      console.warn('Impossible de sauvegarder les motifs de navigation:', e);
    }
  },
  
  // Charge les motifs de navigation depuis le stockage local
  loadNavigationPatterns(): void {
    try {
      const savedPatterns = localStorage.getItem('velo_altitude_navigation_patterns');
      
      if (savedPatterns) {
        const serializedPatterns = JSON.parse(savedPatterns);
        
        // Convertir la structure sérialisée en Map
        Object.entries(serializedPatterns).forEach(([source, destinations]) => {
          if (!this.navigationPatterns.has(source)) {
            this.navigationPatterns.set(source, new Map());
          }
          
          Object.entries(destinations as Record<string, RouteNavigationPattern>)
            .forEach(([destination, pattern]) => {
              this.navigationPatterns.get(source)!.set(destination, pattern);
            });
        });
      }
    } catch (e) {
      console.warn('Impossible de charger les motifs de navigation:', e);
    }
  },
  
  // Initialise l'optimiseur de routes
  init(): void {
    this.loadNavigationPatterns();
    
    // Nettoyer les anciennes entrées (plus de 3 mois)
    const now = Date.now();
    const threeMonths = 3 * 30 * 24 * 60 * 60 * 1000;
    
    this.navigationPatterns.forEach((destinations, source) => {
      destinations.forEach((pattern, destination) => {
        if (now - pattern.lastAccessed > threeMonths) {
          destinations.delete(destination);
        }
      });
      
      if (destinations.size === 0) {
        this.navigationPatterns.delete(source);
      }
    });
  }
};

export default routeOptimizer;
