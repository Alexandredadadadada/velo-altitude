/**
 * Utilitaires d'optimisation des performances pour l'application Velo-Altitude
 * Implémente le code splitting, l'optimisation d'images et le préchargement des composants
 */

import React from 'react';

/**
 * Configuration des optimisations de performance pour l'application
 */
export const optimizePerformance = () => {
  // Implémentation du code splitting pour les routes principales
  const routes = {
    home: React.lazy(() => import('../pages/Home')),
    colDetails: React.lazy(() => import('../pages/ColDetails')),
    challenges: React.lazy(() => import('../pages/Challenges')),
    training: React.lazy(() => import('../pages/Training')),
    nutrition: React.lazy(() => import('../pages/Nutrition')),
    profile: React.lazy(() => import('../pages/Profile')),
    workouts: React.lazy(() => import('../pages/Workouts')),
    recipes: React.lazy(() => import('../pages/Recipes')),
    community: React.lazy(() => import('../pages/Community')),
    colCatalog: React.lazy(() => import('../pages/ColCatalog')),
    sevenMajors: React.lazy(() => import('../pages/SevenMajors')),
    visualization3D: React.lazy(() => import('../pages/Visualization3D'))
  };
  
  /**
   * Optimisation des images avec redimensionnement automatique
   * @param imageUrl - URL de l'image à optimiser
   * @param width - Largeur souhaitée de l'image
   * @param quality - Qualité de l'image (0-100)
   */
  const optimizeImages = (imageUrl: string, width: number, quality?: number) => {
    if (!imageUrl) return '/images/placeholder.jpg';
    
    // Ne pas traiter les images SVG ou data URLs
    if (imageUrl.endsWith('.svg') || imageUrl.startsWith('data:')) {
      return imageUrl;
    }
    
    // Ajuster la qualité en fonction de la largeur (mobile vs desktop)
    const imageQuality = quality || (width > 768 ? 85 : 70);
    
    // Vérifier si l'image est déjà sur un CDN ou si nous devons l'optimiser nous-mêmes
    if (imageUrl.includes('imagecdn.app') || imageUrl.includes('cloudinary.com')) {
      // L'image est déjà sur un CDN d'optimisation, utiliser ses paramètres
      return imageUrl;
    }
    
    // Pour les images locales ou autres, ajouter des paramètres d'optimisation
    return `${imageUrl}?w=${width}&q=${imageQuality}&auto=format`;
  };
  
  /**
   * Préchargement des composants pour les navigations probables
   * @param routeName - Nom de la route à précharger
   */
  const prefetchComponent = (routeName: string) => {
    const route = routes[routeName as keyof typeof routes];
    if (route && typeof route.preload === 'function') {
      route.preload();
    }
  };
  
  /**
   * Préchargement des routes connectées à la page actuelle
   * @param currentRoute - Nom de la route actuelle
   */
  const prefetchConnectedRoutes = (currentRoute: string) => {
    // Mapping des routes qui sont souvent visitées ensemble
    const connectedRoutes: Record<string, string[]> = {
      'home': ['colCatalog', 'training', 'nutrition'],
      'colCatalog': ['colDetails', 'sevenMajors', 'visualization3D'],
      'colDetails': ['visualization3D', 'colCatalog'],
      'training': ['workouts', 'profile'],
      'workouts': ['training', 'nutrition'],
      'nutrition': ['recipes', 'training'],
      'recipes': ['nutrition'],
      'profile': ['training', 'nutrition']
    };
    
    // Précharger les routes connectées
    const routesToPrefetch = connectedRoutes[currentRoute] || [];
    routesToPrefetch.forEach(route => {
      prefetchComponent(route);
    });
  };
  
  /**
   * Détecter les ressources inactives qui peuvent être nettoyées
   */
  const detectIdleResources = () => {
    // Rechercher les composants chargés mais non utilisés pendant un certain temps
    const unusedComponents: string[] = [];
    
    // Cette fonction serait implémentée avec un système de suivi d'utilisation
    // des composants, avec un nettoyage possible pour libérer de la mémoire
    
    return unusedComponents;
  };
  
  return {
    routes,
    optimizeImages,
    prefetchComponent,
    prefetchConnectedRoutes,
    detectIdleResources
  };
};

/**
 * HOC pour optimiser le rendu des composants avec React.memo et comparaison personnalisée
 * @param Component - Composant à optimiser
 * @param compareProps - Fonction de comparaison des props (optionnelle)
 */
export const withOptimizedRendering = <P extends object>(
  Component: React.ComponentType<P>,
  compareProps?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
) => {
  // Si une fonction de comparaison est fournie, l'utiliser, sinon utiliser React.memo standard
  const OptimizedComponent = React.memo(
    (props: P) => {
      return <Component {...props} />;
    },
    compareProps
  );
  
  // Conserver le nom du composant pour les outils de développement
  const componentName = Component.displayName || Component.name || 'Component';
  OptimizedComponent.displayName = `Optimized(${componentName})`;
  
  return OptimizedComponent;
};

/**
 * Fonction utilitaire pour effectuer une comparaison profonde des objets
 * Utilisée dans withOptimizedRendering pour éviter les rendus inutiles
 */
export const deepEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;
  
  if (
    typeof obj1 !== 'object' ||
    typeof obj2 !== 'object' ||
    obj1 === null ||
    obj2 === null
  ) {
    return false;
  }
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
};

/**
 * Composant d'optimisation pour les listes avec virtualisation
 * À utiliser pour les longues listes d'éléments (cols, recettes, etc.)
 */
export const optimizeListRendering = (listItemHeight: number, overscan: number = 5) => {
  // Cette fonction retournerait un composant de liste virtualisée
  // qui ne rend que les éléments visibles dans la fenêtre d'affichage
  
  // Ici, nous utiliserions react-window ou une solution similaire
  
  return {
    // Ici, nous retournerions les composants et fonctions nécessaires
    // pour implémenter la virtualisation
  };
};

/**
 * Surveillance des performances et détection des problèmes
 */
export const performanceMonitor = () => {
  // Métriques de performance à surveiller
  let metrics = {
    firstPaint: 0,
    firstContentfulPaint: 0,
    timeToInteractive: 0,
    longTasks: [] as { duration: number, startTime: number }[],
    memoryUsage: null as any
  };
  
  // Observer les métriques de performance
  const observe = () => {
    // Utilisation de l'API Performance
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Observer les métriques de peinture
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name === 'first-paint') {
            metrics.firstPaint = entry.startTime;
          } else if (entry.name === 'first-contentful-paint') {
            metrics.firstContentfulPaint = entry.startTime;
          }
        });
      });
      observer.observe({ entryTypes: ['paint'] });
      
      // Observer les tâches longues
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          metrics.longTasks.push({
            duration: entry.duration,
            startTime: entry.startTime
          });
        });
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      
      // Mémoire (uniquement sur Chrome)
      if ('memory' in performance) {
        // @ts-ignore - L'API memory n'est pas standard
        metrics.memoryUsage = performance.memory;
      }
    }
  };
  
  // Obtenir les métriques actuelles
  const getMetrics = () => {
    return { ...metrics };
  };
  
  return {
    observe,
    getMetrics
  };
};

export default optimizePerformance;
